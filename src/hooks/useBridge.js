import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getBridgeRoutes, executeBridge } from '../lib/bridge/providers';
import { monitorTransaction, BRIDGE_STATUS } from '../lib/bridge/monitor';
import { isGaslessSupported, estimateGaslessTransactionCost, executeStargateBridgeWithTokenFees } from '../lib/gasless/biconomy';
import { getTokenContract } from '../lib/tokens/tokenUtils';

/**
 * Hook for managing bridge operations
 * @param {ethers.Signer} signer - Ethers signer
 * @returns {Object} Bridge state and functions
 */
const useBridge = (signer) => {
  // States for routes and transaction
  const [routes, setRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [isBridging, setIsBridging] = useState(false);
  const [bridgeError, setBridgeError] = useState(null);
  const [bridgeResult, setBridgeResult] = useState(null);
  const [transactionStatus, setTransactionStatus] = useState(null);
  const [monitoringInterval, setMonitoringInterval] = useState(null);
  const [useGasAbstraction, setUseGasAbstraction] = useState(false);
  const [gaslessEstimate, setGaslessEstimate] = useState(null);
  // Additional state for token fees option
  const [useTokenFees, setUseTokenFees] = useState(false);
  
  /**
   * Fetch available bridge routes
   * @param {Object} params - Bridge parameters
   * @param {string} params.sourceChain - Source chain name
   * @param {string} params.destChain - Destination chain name
   * @param {string} params.tokenSymbol - Token symbol
   * @param {string} params.amount - Amount to bridge
   */
  const fetchRoutes = useCallback(async ({ sourceChain, destChain, tokenSymbol, amount }) => {
    if (!signer || !amount || !sourceChain || !destChain || !tokenSymbol) {
      return;
    }
    
    setIsLoadingRoutes(true);
    setBridgeError(null);
    
    try {
      const availableRoutes = await getBridgeRoutes({
        sourceChain,
        destChain,
        tokenSymbol,
        amount,
        signer
      });
      
      setRoutes(availableRoutes);
      
      if (availableRoutes.length > 0) {
        // Select the first route since we're only using Stargate
        selectRoute(0);
        
        // Check if gasless is supported for this route
        const canUseGasless = isGaslessSupported(sourceChain, tokenSymbol);
        setUseGasAbstraction(canUseGasless);
        
        // If gasless is supported, get estimate
        if (canUseGasless) {
          try {
            await estimateGaslessCost({
              sourceChain,
              tokenSymbol,
              route: availableRoutes[0]
            });
          } catch (error) {
            console.error('Error estimating gasless cost:', error);
            setGaslessEstimate(null);
          }
        } else {
          setGaslessEstimate(null);
        }
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      setBridgeError(`Failed to fetch routes: ${error.message}`);
      setRoutes([]);
      setSelectedRoute(null);
      setSelectedRouteIndex(null);
    } finally {
      setIsLoadingRoutes(false);
    }
  }, [signer]);
  
  /**
   * Estimate the cost of a gasless transaction
   * @param {Object} params - Parameters for estimation
   * @param {string} params.sourceChain - Source chain name
   * @param {string} params.tokenSymbol - Token symbol
   * @param {Object} params.route - Selected route
   */
  const estimateGaslessCost = useCallback(async ({ sourceChain, tokenSymbol, route }) => {
    if (!signer || !route) return;
    
    try {
      // Get the token contract
      const tokenContract = await getTokenContract(tokenSymbol, sourceChain, signer);
      
      // Simplified parameters for estimation
      const estimate = await estimateGaslessTransactionCost({
        chainName: sourceChain,
        tokenSymbol,
        provider: signer.provider,
        contract: tokenContract,
        method: 'approve',
        params: [route.details?.routerAddress || ethers.constants.AddressZero, ethers.utils.parseUnits('1', 18)]
      });
      
      setGaslessEstimate(estimate);
    } catch (error) {
      console.error('Error estimating gasless cost:', error);
      setGaslessEstimate(null);
    }
  }, [signer]);
  
  /**
   * Select a route by index
   * @param {number} index - Route index
   */
  const selectRoute = useCallback((index) => {
    if (index !== null && index >= 0 && index < routes.length) {
      setSelectedRouteIndex(index);
      setSelectedRoute(routes[index]);
    } else {
      setSelectedRouteIndex(null);
      setSelectedRoute(null);
    }
  }, [routes]);
  
  /**
   * Toggle gas abstraction
   */
  const toggleGasAbstraction = useCallback(() => {
    setUseGasAbstraction(prev => !prev);
  }, []);
  
  /**
   * Toggle token fees
   */
  const toggleTokenFees = useCallback(() => {
    setUseTokenFees(prev => !prev);
  }, []);
  
  /**
   * Execute the bridge transaction
   * @param {Object} params - Bridge parameters
   * @param {string} params.sourceChain - Source chain name
   * @param {string} params.destChain - Destination chain name
   * @param {string} params.tokenSymbol - Token symbol
   * @param {string} params.amount - Amount to bridge
   * @param {number} params.slippageTolerance - Slippage tolerance in percentage
   * @param {boolean} params.useTokenFees - Whether to pay fees in token (instead of ETH)
   */
  const bridge = useCallback(async ({
    sourceChain,
    destChain,
    tokenSymbol,
    amount,
    slippageTolerance = 0.5,
    useTokenFeesParam
  }) => {
    // Use the parameter if provided, otherwise use the state
    const shouldUseTokenFees = useTokenFeesParam !== undefined ? useTokenFeesParam : useTokenFees;
    
    if (!signer || !amount || !sourceChain || !destChain || !tokenSymbol) {
      setBridgeError('Missing required parameters for bridge');
      return;
    }
    
    setIsBridging(true);
    setBridgeError(null);
    setTransactionStatus(null);
    clearMonitoring();
    
    try {
      let result;
      
      if (shouldUseTokenFees) {
        // Execute the bridge with token fees (Biconomy + Stargate)
        result = await executeStargateBridgeWithTokenFees({
          sourceChain,
          destChain,
          tokenSymbol,
          amount,
          wallet: signer
        });
      } else {
        // Execute the standard bridge transaction
        result = await executeBridge({
          sourceChain,
          destChain,
          tokenSymbol,
          amount,
          signer,
          slippageTolerance,
          useGasAbstraction // Pass the gas abstraction flag
        });
      }
      
      setBridgeResult(result);
      
      // Start monitoring the transaction
      startMonitoring({
        txHash: result.transactionHash,
        sourceChain,
        destChain,
        provider: result.provider
      });
      
      return result;
    } catch (error) {
      console.error('Bridge error:', error);
      setBridgeError(`Bridge failed: ${error.message}`);
    } finally {
      setIsBridging(false);
    }
  }, [signer, useGasAbstraction, useTokenFees, clearMonitoring, startMonitoring]);
  
  /**
   * Start monitoring a bridge transaction
   * @param {Object} params - Monitoring parameters
   * @param {string} params.txHash - Transaction hash
   * @param {string} params.sourceChain - Source chain name
   * @param {string} params.destChain - Destination chain name
   * @param {string} params.provider - Provider name (e.g., 'Stargate')
   */
  const startMonitoring = useCallback(({ txHash, sourceChain, destChain, provider }) => {
    // Clear any existing interval
    clearMonitoring();
    
    // Initialize status
    setTransactionStatus({
      status: BRIDGE_STATUS.PENDING,
      message: 'Transaction submitted, waiting for confirmation...',
      txHash
    });
    
    // Set up polling interval (every 15 seconds)
    const interval = setInterval(async () => {
      try {
        const status = await monitorTransaction({
          transactionHash: txHash,
          sourceChain,
          destChain,
          provider, // Only 'Stargate' now
          walletAddress: await signer.getAddress()
        });
        
        setTransactionStatus(status);
        
        // If the transaction is completed or failed, stop monitoring
        if (
          status.status === BRIDGE_STATUS.COMPLETED ||
          status.status === BRIDGE_STATUS.FAILED
        ) {
          clearInterval(interval);
          setMonitoringInterval(null);
        }
      } catch (error) {
        console.error('Error monitoring transaction:', error);
      }
    }, 15000);
    
    setMonitoringInterval(interval);
  }, [signer]);
  
  /**
   * Clear monitoring interval
   */
  const clearMonitoring = useCallback(() => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      setMonitoringInterval(null);
    }
  }, [monitoringInterval]);
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => clearMonitoring();
  }, [clearMonitoring]);
  
  return {
    routes,
    selectedRoute,
    selectRoute,
    fetchRoutes,
    bridge,
    isLoadingRoutes,
    isBridging,
    bridgeError,
    bridgeResult,
    transactionStatus,
    useGasAbstraction,
    toggleGasAbstraction,
    gaslessEstimate,
    useTokenFees,
    toggleTokenFees
  };
};

export default useBridge; 