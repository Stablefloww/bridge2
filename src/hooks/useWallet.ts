'use client';

import { useEffect } from 'react';
import { 
  useAccount, 
  useConnect, 
  useDisconnect, 
  useBalance, 
  useChainId,
  useSwitchChain 
} from 'wagmi';

// Mock implementation of store since the real one isn't accessible
// You should replace this with the actual import when available
const useWalletStore = () => {
  return {
    setAddress: (address: string) => {},
    setIsConnected: (isConnected: boolean) => {},
    setChainId: (chainId: number) => {},
    setBalance: (token: string, amount: string) => {},
    setIsLoading: (isLoading: boolean) => {},
    setError: (error: string | undefined) => {},
    disconnect: () => {},
    address: null,
    isConnected: false,
    chainId: null,
    balance: {},
    error: undefined
  };
};

// Define supported chains for the application
const SUPPORTED_CHAINS = ["1", "8453"]; // Ethereum Mainnet and Base

export function useWallet() {
  const {
    setAddress,
    setIsConnected,
    setChainId,
    setBalance,
    setIsLoading,
    setError,
    disconnect: storeDisconnect,
    address: storedAddress,
    isConnected: storedIsConnected,
    chainId: storedChainId,
    balance: storedBalance,
    error: storedError
  } = useWalletStore();

  // Use wagmi hooks for wallet interactions
  const { address, isConnected, status } = useAccount();
  const { connect: wagmiConnect, connectors, isPending } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const currentChainId = useChainId();
  const { switchChain: wagmiSwitchChain } = useSwitchChain();
  
  // Update store when wagmi state changes
  useEffect(() => {
    if (address) setAddress(address);
    setIsConnected(isConnected);
    if (currentChainId) setChainId(currentChainId);
    setIsLoading(isPending);
  }, [address, isConnected, currentChainId, isPending, setAddress, setIsConnected, setChainId, setIsLoading]);

  // Sync wallet store with wagmi state
  useEffect(() => {
    if (isConnected && address && currentChainId) {
      setAddress(address);
      setIsConnected(isConnected);
      setChainId(currentChainId);
      if (!SUPPORTED_CHAINS.includes(currentChainId.toString())) {
        setError('Unsupported network');
      }
    }
  }, [isConnected, address, currentChainId, setAddress, setIsConnected, setChainId, setError]);

  // Connect function using ConnectKit
  const connect = async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      
      // Find the appropriate connector
      const connector = connectors[0]; // Usually first connector
      if (!connector) {
        throw new Error('No wallet connectors available');
      }
      
      await wagmiConnect({ connector });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect function
  const disconnectWallet = () => {
    try {
      wagmiDisconnect();
      storeDisconnect();
      return true;
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      return false;
    }
  };

  // Use wagmi to fetch token balances when the address or chain changes
  useEffect(() => {
    // For now, this is just a placeholder. 
    // In a real implementation, we would fetch real balances for different tokens.
    if (isConnected && address) {
      // You would use useBalance from wagmi for each token you want to track
      // For now, we'll set some mock balances just as before
      setBalance('ETH', '1.5');
      setBalance('USDC', '1000');
    }
  }, [isConnected, address, setBalance]);

  const switchChain = async (chainId: number) => {
    try {
      if (wagmiSwitchChain) {
        wagmiSwitchChain({ chainId });
        setChainId(chainId);
        setError(undefined);
      }
    } catch (error) {
      setError('Failed to switch network');
    }
  };

  return {
    address: storedAddress,
    isConnected: storedIsConnected,
    chainId: storedChainId,
    balance: storedBalance,
    isLoading: isPending,
    error: storedError,
    connect,
    disconnect: disconnectWallet,
    switchChain,
  };
} 