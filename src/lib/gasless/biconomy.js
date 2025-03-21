import { ethers } from 'ethers';
import { supportedTokens } from '../tokens/tokenUtils.js';

// Biconomy API key from environment variables
const BICONOMY_API_KEY = process.env.BICONOMY_API_KEY || '';

// Biconomy forwarder addresses for different chains
const FORWARDER_ADDRESSES = {
  'ethereum': '0x84a0856b038eaAd1cC7E297cF34A7e72685A8693',
  'base': '0x84a0856b038eaAd1cC7E297cF34A7e72685A8693',
  'arbitrum': '0xfe0fa3C06d03bDC7fb49c892BbB39113B534Cb4A',
  'optimism': '0xfe0fa3C06d03bDC7fb49c892BbB39113B534Cb4A',
  'polygon': '0x86C80a8aa58e0A4fa09A69624c31Ab2a6CAD56b8',
  'avalanche': '0xe41626f2889e6ee382ea19bc20d981012007cb4e'
};

// List of tokens that support gasless transactions on different chains
const GASLESS_SUPPORTED_TOKENS = {
  'base': ['USDC', 'DAI'],
  'arbitrum': ['USDC', 'USDT', 'DAI'],
  'optimism': ['USDC', 'DAI'],
  'polygon': ['USDC', 'USDT', 'DAI'],
  'ethereum': ['USDC', 'USDT', 'DAI'],
  'avalanche': ['USDC', 'USDT', 'DAI']
};

/**
 * Initialize Biconomy for a specific chain
 * @param {string} chainName - Chain name
 * @param {ethers.Provider} provider - Provider instance
 * @returns {Promise<Object>} Biconomy instance
 */
export async function initBiconomy(chainName, provider) {
  try {
    // In a real implementation, we would initialize the Biconomy SDK here
    // For now, we'll just return a mock implementation
    return {
      chainName,
      provider,
      apiKey: BICONOMY_API_KEY,
      forwarderAddress: FORWARDER_ADDRESSES[chainName.toLowerCase()]
    };
  } catch (error) {
    console.error('Error initializing Biconomy:', error);
    throw new Error(`Failed to initialize Biconomy: ${error.message}`);
  }
}

/**
 * Build a meta-transaction for Biconomy
 * @param {Object} params - Parameters
 * @param {ethers.Contract} params.contract - Contract instance
 * @param {string} params.method - Method name
 * @param {Array} params.params - Method parameters
 * @param {string} params.from - User address
 * @returns {Promise<Object>} Meta transaction object
 */
export async function buildMetaTransaction({
  contract,
  method,
  params,
  from
}) {
  try {
    // Get method interface from contract ABI
    const contractInterface = contract.interface;
    const methodFragment = contractInterface.getFunction(method);
    
    // Encode function data
    const functionData = contractInterface.encodeFunctionData(
      methodFragment,
      params
    );
    
    // Get nonce for the user address
    const nonce = Date.now(); // In a real implementation, we would get this from the contract
    
    // Build meta-transaction object
    return {
      from,
      to: contract.target, // Using target instead of address in ethers v6
      data: functionData,
      nonce: ethers.hexlify(nonce),
      value: 0
    };
  } catch (error) {
    console.error('Error building meta-transaction:', error);
    throw new Error(`Failed to build meta-transaction: ${error.message}`);
  }
}

/**
 * Sign a meta-transaction
 * @param {Object} params - Parameters
 * @param {Object} params.metaTx - Meta transaction object
 * @param {string} params.chainName - Chain name
 * @param {ethers.Wallet} params.wallet - Wallet instance
 * @returns {Promise<string>} Signature
 */
export async function signMetaTransaction({
  metaTx,
  chainName,
  wallet
}) {
  try {
    // Get network details
    const provider = wallet.provider;
    const network = await provider.getNetwork();
    const chainId = network.chainId;
    
    // Get domain data for EIP-712 signature
    const domainData = {
      name: 'Biconomy Forwarder',
      version: '1',
      chainId,
      verifyingContract: FORWARDER_ADDRESSES[chainName.toLowerCase()]
    };
    
    // EIP-712 types
    const types = {
      MetaTransaction: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'data', type: 'bytes' },
        { name: 'nonce', type: 'uint256' },
        { name: 'value', type: 'uint256' }
      ]
    };
    
    // Sign the meta-transaction (using signTypedData in ethers v6)
    const signature = await wallet.signTypedData(
      domainData,
      types,
      metaTx
    );
    
    return signature;
  } catch (error) {
    console.error('Error signing meta-transaction:', error);
    throw new Error(`Failed to sign meta-transaction: ${error.message}`);
  }
}

/**
 * Send a meta-transaction through Biconomy
 * @param {Object} params - Parameters
 * @param {Object} params.metaTx - Meta transaction object
 * @param {string} params.signature - Signature
 * @param {string} params.chainName - Chain name
 * @param {Object} params.biconomy - Biconomy instance
 * @returns {Promise<Object>} Transaction response
 */
export async function sendMetaTransaction({
  metaTx,
  signature,
  chainName,
  biconomy
}) {
  try {
    // In a real implementation, we would use the Biconomy SDK to send the transaction
    // For now, we'll just return a mock transaction hash
    return {
      transactionHash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      wait: async () => ({ status: 1 })
    };
  } catch (error) {
    console.error('Error sending meta-transaction:', error);
    throw new Error(`Failed to send meta-transaction: ${error.message}`);
  }
}

/**
 * Check if a token supports gasless transactions on a specific chain
 * @param {string} chainName - Chain name
 * @param {string} tokenSymbol - Token symbol
 * @returns {boolean} Whether the token supports gasless transactions
 */
export function isGaslessSupported(chainName, tokenSymbol) {
  const chainLower = chainName.toLowerCase();
  const supportedTokensForChain = GASLESS_SUPPORTED_TOKENS[chainLower] || [];
  return supportedTokensForChain.includes(tokenSymbol.toUpperCase());
}

/**
 * Estimate the cost of a gasless transaction
 * @param {Object} params - Parameters
 * @param {string} params.chainName - Chain name
 * @param {ethers.Contract} params.contract - Contract instance
 * @param {string} params.method - Method name
 * @param {Array} params.params - Method parameters
 * @param {ethers.Wallet} params.wallet - Wallet instance
 * @returns {Promise<Object>} Cost estimation
 */
export async function estimateGaslessTransactionCost({
  chainName,
  contract,
  method,
  params,
  wallet
}) {
  try {
    // In a real implementation, we would estimate gas costs
    // For now, we'll return a mock estimate
    return {
      gasEstimate: '100000',
      feeTokenSymbol: 'USDC',
      feeAmount: '0.5',
      feeUSD: '0.5'
    };
  } catch (error) {
    console.error('Error estimating gasless transaction cost:', error);
    throw new Error(`Failed to estimate gasless transaction cost: ${error.message}`);
  }
}

/**
 * Execute a bridge transaction with gas abstraction
 * @param {Object} params - Parameters
 * @param {string} params.chainName - Chain name
 * @param {ethers.Contract} params.contract - Contract instance
 * @param {string} params.method - Method name
 * @param {Array} params.params - Method parameters
 * @param {ethers.Wallet} params.wallet - Wallet instance
 * @param {bigint} params.value - Value to send (optional)
 * @returns {Promise<Object>} Transaction response
 */
export async function executeBridgeWithGasAbstraction({
  chainName,
  contract,
  method,
  params,
  wallet,
  value = BigInt(0)
}) {
  try {
    // Check if the chain is supported
    if (!FORWARDER_ADDRESSES[chainName.toLowerCase()]) {
      throw new Error(`Chain ${chainName} not supported for gas abstraction`);
    }
    
    // Initialize Biconomy
    const biconomy = await initBiconomy(chainName, wallet.provider);
    
    // Get user address
    const from = await wallet.getAddress();
    
    // Build meta-transaction
    const metaTx = await buildMetaTransaction({
      contract,
      method,
      params,
      from
    });
    
    // Sign meta-transaction
    const signature = await signMetaTransaction({
      metaTx,
      chainName,
      wallet
    });
    
    // Send meta-transaction
    return await sendMetaTransaction({
      metaTx,
      signature,
      chainName,
      biconomy
    });
  } catch (error) {
    console.error('Error executing bridge with gas abstraction:', error);
    throw new Error(`Failed to execute bridge with gas abstraction: ${error.message}`);
  }
}

export default {
  isGaslessSupported,
  estimateGaslessTransactionCost,
  executeBridgeWithGasAbstraction
}; 