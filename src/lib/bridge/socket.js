import { ethers } from 'ethers';

// Constants for Socket API 
const SOCKET_API_KEY = process.env.SOCKET_API_KEY || 'b91a5b31-0b7d-48e5-b6bf-b2029d7864f7';
const SOCKET_API_URL = 'https://api.socket.tech/v2';

// Chain ID mappings for Socket
const SOCKET_CHAIN_IDS = {
  'ethereum': 1,
  'base': 8453,
  'arbitrum': 42161,
  'optimism': 10,
  'polygon': 137,
  'avalanche': 43114,
  'bsc': 56,
  'fantom': 250,
  'zksync': 324,
  'linea': 59144
};

// Token address mappings for Socket (example addresses)
const SOCKET_TOKEN_ADDRESSES = {
  'ethereum': {
    'eth': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    'usdc': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    'usdt': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    'dai': '0x6B175474E89094C44Da98b954EedeAC495271d0F'
  },
  'base': {
    'eth': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    'usdc': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    'usdt': '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    'dai': '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb'
  },
  'arbitrum': {
    'eth': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    'usdc': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    'usdt': '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    'dai': '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'
  }
};

/**
 * Get Chain ID for Socket API
 * 
 * @param {string} chainName - Chain name 
 * @returns {number} Socket chain ID
 */
function getSocketChainId(chainName) {
  const chainId = SOCKET_CHAIN_IDS[chainName.toLowerCase()];
  if (!chainId) {
    throw new Error(`Unsupported chain: ${chainName}`);
  }
  return chainId;
}

/**
 * Get token address for Socket API
 * 
 * @param {string} chainName - Chain name
 * @param {string} tokenSymbol - Token symbol
 * @returns {string} Token address
 */
function getSocketTokenAddress(chainName, tokenSymbol) {
  const chain = chainName.toLowerCase();
  const token = tokenSymbol.toLowerCase();
  
  if (!SOCKET_TOKEN_ADDRESSES[chain]) {
    throw new Error(`Unsupported chain: ${chainName}`);
  }
  
  const address = SOCKET_TOKEN_ADDRESSES[chain][token];
  if (!address) {
    throw new Error(`Unsupported token: ${tokenSymbol} on ${chainName}`);
  }
  
  return address;
}

/**
 * Get bridge quotes from Socket API
 * 
 * @param {Object} params - Quote parameters
 * @returns {Promise<Array>} Socket quotes
 */
export async function getSocketQuotes({
  sourceChain,
  destChain,
  tokenSymbol,
  amount,
  signer
}) {
  try {
    const fromChainId = getSocketChainId(sourceChain);
    const toChainId = getSocketChainId(destChain);
    const fromTokenAddress = getSocketTokenAddress(sourceChain, tokenSymbol);
    const toTokenAddress = getSocketTokenAddress(destChain, tokenSymbol);
    
    // Get user's address
    const userAddress = await signer.getAddress();
    
    // Determine token decimals to format amount correctly
    let decimals = 18; // Default for ETH
    if (tokenSymbol.toLowerCase() === 'usdc' || tokenSymbol.toLowerCase() === 'usdt') {
      decimals = 6;
    }
    
    // Convert amount to token units with correct decimals
    const amountBN = ethers.parseUnits(amount, decimals);
    
    // Build API request URL
    const url = new URL(`${SOCKET_API_URL}/quote`);
    url.searchParams.append('fromChainId', fromChainId);
    url.searchParams.append('toChainId', toChainId);
    url.searchParams.append('fromTokenAddress', fromTokenAddress);
    url.searchParams.append('toTokenAddress', toTokenAddress);
    url.searchParams.append('fromAmount', amountBN.toString());
    url.searchParams.append('userAddress', userAddress);
    url.searchParams.append('sort', 'output');
    
    // Call Socket API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'API-KEY': SOCKET_API_KEY,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Socket API error: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success || !data.result || !data.result.routes || data.result.routes.length === 0) {
      throw new Error('No routes found through Socket');
    }
    
    // Format the routes
    return data.result.routes.map(route => ({
      provider: 'Socket',
      sourceChain,
      destChain,
      tokenSymbol,
      amount,
      bridge: route.usedBridgeNames.join(', '),
      estimatedGas: ethers.formatEther(route.totalGasFeesInUsd.toString()),
      bridgeFee: ethers.formatUnits(route.totalFees.toString(), decimals),
      estimatedTime: route.serviceTime,
      outputAmount: ethers.formatUnits(route.toAmount, decimals),
      rawRoute: route // Keep the raw route data for execution
    }));
  } catch (error) {
    console.error('Error fetching Socket quotes:', error);
    throw new Error(`Failed to get Socket quotes: ${error.message}`);
  }
}

/**
 * Build transaction for Socket bridge
 * 
 * @param {Object} params - Bridge parameters
 * @returns {Promise<Object>} Transaction parameters
 */
export async function buildSocketTransaction({
  route,
  signer,
  slippageTolerance = 0.5
}) {
  try {
    if (!route || !route.rawRoute) {
      throw new Error('Invalid route provided');
    }
    
    // Get user's address
    const userAddress = await signer.getAddress();
    
    // Build API request URL for build transaction
    const url = new URL(`${SOCKET_API_URL}/build-tx`);
    
    // Create request body
    const requestBody = {
      route: route.rawRoute,
      userAddress,
      slippage: slippageTolerance * 100, // Convert to basis points (0.5% -> 50)
    };
    
    // Call Socket API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'API-KEY': SOCKET_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Socket API error: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success || !data.result || !data.result.txData) {
      throw new Error('Failed to build transaction through Socket');
    }
    
    return {
      to: data.result.txData.to,
      data: data.result.txData.data,
      value: data.result.txData.value,
      gasLimit: data.result.txData.gasLimit,
      chainId: data.result.txData.chainId
    };
  } catch (error) {
    console.error('Error building Socket transaction:', error);
    throw new Error(`Failed to build Socket transaction: ${error.message}`);
  }
}

/**
 * Execute bridge transaction using Socket
 * 
 * @param {Object} params - Bridge parameters
 * @returns {Promise<Object>} Transaction result
 */
export async function executeSocketBridge({
  route,
  signer,
  slippageTolerance = 0.5
}) {
  try {
    // Build the transaction
    const txParams = await buildSocketTransaction({
      route,
      signer,
      slippageTolerance
    });
    
    // Execute the transaction
    const tx = await signer.sendTransaction({
      to: txParams.to,
      data: txParams.data,
      value: txParams.value,
      gasLimit: txParams.gasLimit ? ethers.BigNumber.from(txParams.gasLimit) : undefined
    });
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      sourceChain: route.sourceChain,
      destChain: route.destChain,
      tokenSymbol: route.tokenSymbol,
      amount: route.amount,
      provider: 'Socket',
      bridge: route.bridge,
      estimatedTime: route.estimatedTime,
    };
  } catch (error) {
    console.error('Error executing Socket bridge:', error);
    throw new Error(`Socket bridge failed: ${error.message}`);
  }
}

export default {
  getSocketQuotes,
  buildSocketTransaction,
  executeSocketBridge
}; 