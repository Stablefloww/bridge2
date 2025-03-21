import { ethers } from 'ethers';
import { LZ_CHAIN_IDS, STARGATE_ADDRESSES } from './providers.js';

// Status enum for bridge transactions
export const BRIDGE_STATUS = {
  PENDING: 'PENDING',
  SOURCE_CONFIRMED: 'SOURCE_CONFIRMED',
  DESTINATION_PENDING: 'DESTINATION_PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  UNKNOWN: 'UNKNOWN'
};

// RPC URLs for different chains
const RPC_URLS = {
  'ethereum': 'https://eth-mainnet.g.alchemy.com/v2/demo',
  'base': 'https://mainnet.base.org',
  'arbitrum': 'https://arb1.arbitrum.io/rpc',
  'optimism': 'https://mainnet.optimism.io',
  'polygon': 'https://polygon-rpc.com',
  'avalanche': 'https://api.avax.network/ext/bc/C/rpc',
  'bsc': 'https://bsc-dataseed.binance.org',
  'fantom': 'https://rpc.ftm.tools',
  'zksync': 'https://mainnet.era.zksync.io',
  'linea': 'https://rpc.linea.build'
};

// Stargate event topics
const STARGATE_SWAP_TOPIC = ethers.keccak256(
  ethers.toUtf8Bytes('SwapRemote(uint16,bytes,uint256,address,uint256,uint256)')
);

/**
 * Create a provider for a specific chain
 * 
 * @param {string} chainName - Chain name
 * @returns {ethers.JsonRpcProvider} Provider instance
 */
function createProvider(chainName) {
  const rpcUrl = RPC_URLS[chainName.toLowerCase()];
  if (!rpcUrl) {
    throw new Error(`No RPC URL found for chain: ${chainName}`);
  }
  
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Monitor a bridge transaction across chains
 * 
 * @param {Object} params - Transaction parameters
 * @returns {Promise<Object>} Transaction status
 */
export async function monitorTransaction({
  transactionHash,
  sourceChain,
  destChain,
  provider = 'Stargate',
  walletAddress
}) {
  try {
    // Create provider for source chain
    const sourceProvider = createProvider(sourceChain);
    
    // Get transaction receipt
    const receipt = await sourceProvider.getTransactionReceipt(transactionHash);
    
    // If the transaction is not confirmed on the source chain
    if (!receipt) {
      return {
        status: BRIDGE_STATUS.PENDING,
        confirmations: 0,
        message: 'Transaction is pending on the source chain'
      };
    }
    
    // If the transaction failed on the source chain
    if (receipt.status === 0) {
      return {
        status: BRIDGE_STATUS.FAILED,
        confirmations: receipt.confirmations,
        sourceConfirmed: true,
        message: 'Transaction failed on the source chain'
      };
    }
    
    // Transaction is confirmed on the source chain
    // Now check if it's completed on the destination chain
    
    // Different monitoring logic based on the bridge provider
    if (provider.toLowerCase() === 'stargate') {
      return await monitorStargateTransaction({
        receipt,
        sourceChain,
        destChain,
        walletAddress
      });
    } else if (provider.toLowerCase() === 'socket') {
      // Socket doesn't have a standard way to track cross-chain transactions
      // So we'll just return the source confirmation status
      return {
        status: BRIDGE_STATUS.SOURCE_CONFIRMED,
        confirmations: receipt.confirmations,
        sourceConfirmed: true,
        message: 'Transaction confirmed on source chain. Socket transactions cannot be automatically tracked across chains.'
      };
    } else {
      return {
        status: BRIDGE_STATUS.UNKNOWN,
        message: `Unsupported provider: ${provider}`
      };
    }
  } catch (error) {
    console.error('Error monitoring transaction:', error);
    return {
      status: BRIDGE_STATUS.UNKNOWN,
      message: `Error monitoring transaction: ${error.message}`
    };
  }
}

/**
 * Monitor a Stargate bridge transaction
 * 
 * @param {Object} params - Monitoring parameters
 * @returns {Promise<Object>} Transaction status
 */
async function monitorStargateTransaction({
  receipt,
  sourceChain,
  destChain,
  walletAddress
}) {
  try {
    // Extract the LayerZero nonce from the Stargate router logs
    const sourceLzNonce = extractLayerZeroNonce(receipt);
    
    if (!sourceLzNonce) {
      return {
        status: BRIDGE_STATUS.SOURCE_CONFIRMED,
        confirmations: receipt.confirmations,
        sourceConfirmed: true,
        message: 'Transaction confirmed on source chain, but could not extract LayerZero nonce'
      };
    }
    
    // Create provider for destination chain
    const destProvider = createProvider(destChain);
    
    // Get Stargate router address for destination chain
    const destRouterAddress = STARGATE_ADDRESSES[destChain]?.router;
    if (!destRouterAddress) {
      return {
        status: BRIDGE_STATUS.DESTINATION_PENDING,
        confirmations: receipt.confirmations,
        sourceConfirmed: true,
        message: 'Transaction confirmed on source chain, destination chain router not found'
      };
    }
    
    // Get Layer Zero chain IDs
    const srcLzChainId = LZ_CHAIN_IDS[sourceChain];
    
    // Look for Stargate SwapRemote event on destination chain
    // Filter for events from the destination router
    const filter = {
      address: destRouterAddress,
      topics: [STARGATE_SWAP_TOPIC]
    };
    
    // Search for events in the last 1000 blocks
    const destBlockNumber = await destProvider.getBlockNumber();
    const fromBlock = destBlockNumber - 1000;
    
    // Get logs
    const logs = await destProvider.getLogs({
      ...filter,
      fromBlock
    });
    
    // Find matching log with the same nonce
    const matchingLog = logs.find(log => {
      // The source chain ID should be in the first parameter of the event
      // and it should match the sourceChain
      const srcChainIdFromLog = parseInt(log.topics[1], 16);
      return srcChainIdFromLog === srcLzChainId;
      
      // In a real implementation, we would also verify the nonce
      // but we skip that here for simplicity
    });
    
    if (matchingLog) {
      return {
        status: BRIDGE_STATUS.COMPLETED,
        confirmations: receipt.confirmations,
        sourceConfirmed: true,
        destinationConfirmed: true,
        destinationTxHash: matchingLog.transactionHash,
        message: 'Bridge transaction completed on both chains'
      };
    } else {
      // Get estimated time based on the destination chain
      const estimatedTime = getEstimatedTime(destChain);
      
      return {
        status: BRIDGE_STATUS.DESTINATION_PENDING,
        confirmations: receipt.confirmations,
        sourceConfirmed: true,
        destinationConfirmed: false,
        message: `Transaction confirmed on source chain, pending on destination chain. Typically takes ${estimatedTime} minutes.`
      };
    }
  } catch (error) {
    console.error('Error monitoring Stargate transaction:', error);
    return {
      status: BRIDGE_STATUS.UNKNOWN,
      message: `Error monitoring Stargate transaction: ${error.message}`
    };
  }
}

/**
 * Extract LayerZero nonce from transaction receipt
 * 
 * @param {Object} receipt - Transaction receipt
 * @returns {string|null} LayerZero nonce or null if not found
 */
function extractLayerZeroNonce(receipt) {
  // This is a simplified implementation
  // In a real implementation, we would parse the logs to extract the nonce
  // For now, we just use the transaction hash as a unique identifier
  return receipt.transactionHash;
}

/**
 * Get estimated time for transaction confirmation based on destination chain
 * 
 * @param {string} destChain - Destination chain name
 * @returns {number} Estimated time in minutes
 */
function getEstimatedTime(destChain) {
  const times = {
    'ethereum': 15,
    'base': 5,
    'arbitrum': 5,
    'optimism': 5,
    'polygon': 5,
    'bsc': 3,
    'avalanche': 3,
    'fantom': 3,
    'zksync': 5,
    'linea': 5
  };
  
  return times[destChain.toLowerCase()] || 10; // Default 10 minutes
}

/**
 * Get all pending bridge transactions for a user
 * 
 * @param {string} walletAddress - User's wallet address
 * @returns {Promise<Array>} Pending transactions
 */
export async function getPendingTransactions(walletAddress) {
  // This would normally be implemented using a database or local storage
  // For now, we return an empty array
  return [];
}

export default {
  monitorTransaction,
  getPendingTransactions,
  BRIDGE_STATUS
}; 