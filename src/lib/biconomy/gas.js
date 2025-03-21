import { ethers } from 'ethers';
import { Biconomy } from '@biconomy/mexa';

/**
 * Custom implementation of payload to message conversion
 * This replaces the dependency on @biconomy/utils
 * 
 * @param {string} address - User's address
 * @param {string} functionData - Encoded function data
 * @param {number} nonce - Transaction nonce
 * @returns {string} Message to sign
 */
function payloadToMessage(address, functionData, nonce) {
  return ethers.solidityPackedKeccak256(
    ['address', 'bytes', 'uint256'],
    [address, functionData, nonce]
  );
}

/**
 * Initialize Biconomy for gas abstraction
 * 
 * @param {Object} provider - Ethers provider
 * @param {string} apiKey - Biconomy API key
 * @param {string} networkId - Network ID in decimal (e.g. '8453' for Base)
 * @returns {Promise<Object>} Biconomy instance
 */
export async function initBiconomy(provider, apiKey, networkId) {
  try {
    const biconomy = new Biconomy(provider, {
      apiKey,
      debug: process.env.NODE_ENV === 'development',
      strictMode: true
    });
    
    // Initialize Biconomy
    await new Promise((resolve, reject) => {
      biconomy.onEvent(biconomy.READY, () => {
        console.log('Biconomy initialized successfully');
        resolve();
      });
      
      biconomy.onEvent(biconomy.ERROR, (error) => {
        console.error('Biconomy initialization error:', error);
        reject(error);
      });
    });
    
    return biconomy;
  } catch (error) {
    console.error('Error initializing Biconomy:', error);
    throw new Error(`Failed to initialize Biconomy: ${error.message}`);
  }
}

/**
 * Create a contract instance with Biconomy for EIP-2771 meta transactions
 * 
 * @param {Object} params - Parameters
 * @param {string} params.contractAddress - Contract address
 * @param {Array|string} params.abi - Contract ABI
 * @param {Object} params.biconomy - Biconomy instance
 * @param {Object} params.signer - Ethers signer
 * @returns {Object} Contract instance with Biconomy
 */
export function createBiconomyContract({ contractAddress, abi, biconomy, signer }) {
  // Create a contract instance that will use Biconomy for gas abstraction
  return new ethers.Contract(
    contractAddress,
    abi,
    biconomy.getSignerByAddress(signer.address)
  );
}

/**
 * Send a meta transaction using Biconomy
 * 
 * @param {Object} params - Parameters
 * @param {Object} params.contract - Contract instance with Biconomy
 * @param {string} params.method - Contract method to call
 * @param {Array} params.params - Method parameters
 * @param {Object} params.signer - Ethers signer
 * @returns {Promise<Object>} Transaction result
 */
export async function sendMetaTransaction({ contract, method, params, signer }) {
  try {
    // Get the nonce for the user
    const nonce = await contract.provider.getTransactionCount(signer.address);
    
    // Create function data
    const functionSignature = contract.interface.encodeFunctionData(method, params);
    
    // Get the message to sign
    const messageToSign = payloadToMessage(signer.address, functionSignature, nonce);
    
    // Sign the message
    const signature = await signer.signMessage(ethers.getBytes(messageToSign));
    
    // Send the meta transaction
    const tx = await contract.executeMetaTransaction(
      signer.address,
      functionSignature,
      signature,
      { gasLimit: 1000000 }
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error('Error in meta transaction:', error);
    throw new Error(`Meta transaction failed: ${error.message}`);
  }
}

/**
 * Checks if Biconomy supports a token for gas payment
 * 
 * @param {string} chainId - Chain ID in decimal
 * @param {string} tokenAddress - Token contract address
 * @returns {Promise<boolean>} Whether the token is supported
 */
export async function isBiconomySupportedToken(chainId, tokenAddress) {
  try {
    // This is a placeholder implementation
    // In a real implementation, this would check Biconomy's API
    // or a predefined list of supported tokens
    
    // For now, let's assume these major tokens are supported
    const supportedTokens = {
      '8453': [ // Base
        '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
        '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb'  // DAI
      ],
      '1': [ // Ethereum
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        '0x6B175474E89094C44Da98b954EedeAC495271d0F'  // DAI
      ],
      '42161': [ // Arbitrum
        '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
        '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'  // DAI
      ]
    };
    
    return supportedTokens[chainId]?.includes(tokenAddress.toLowerCase()) || false;
  } catch (error) {
    console.error('Error checking Biconomy token support:', error);
    return false;
  }
} 