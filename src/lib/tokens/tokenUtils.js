import { ethers } from 'ethers';

/**
 * Supported token data with addresses on different chains
 */
export const supportedTokens = {
  'ETH': {
    name: 'Ethereum',
    decimals: 18,
    addresses: {
      'ethereum': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ETH
      'base': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ETH
      'arbitrum': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ETH
      'optimism': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ETH
    }
  },
  'USDC': {
    name: 'USD Coin',
    decimals: 6,
    addresses: {
      'ethereum': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      'base': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      'arbitrum': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      'optimism': '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
      'polygon': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      'avalanche': '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
      'bsc': '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      'fantom': '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75'
    }
  },
  'USDT': {
    name: 'Tether USD',
    decimals: 6,
    addresses: {
      'ethereum': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      'arbitrum': '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      'optimism': '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
      'polygon': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      'avalanche': '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
      'bsc': '0x55d398326f99059fF775485246999027B3197955',
      'fantom': '0x049d68029688eAbF473097a2fC38ef61633A3C7A'
    }
  },
  'DAI': {
    name: 'Dai Stablecoin',
    decimals: 18,
    addresses: {
      'ethereum': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      'base': '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
      'arbitrum': '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      'optimism': '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      'polygon': '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      'avalanche': '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70',
      'bsc': '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
      'fantom': '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E'
    }
  }
};

/**
 * Get token contract for a specific token on a chain
 * @param {string} tokenSymbol - Token symbol
 * @param {string} chainName - Chain name
 * @param {ethers.Signer|ethers.Provider} signerOrProvider - Signer or provider
 * @returns {Promise<ethers.Contract>} Token contract
 */
export async function getTokenContract(tokenSymbol, chainName, signerOrProvider) {
  // Normalize token symbol
  const normalizedSymbol = normalizeTokenSymbol(tokenSymbol);
  
  // Check if token is supported
  if (!supportedTokens[normalizedSymbol]) {
    throw new Error(`Unsupported token: ${tokenSymbol}`);
  }
  
  // Get token address for the chain
  const tokenAddresses = supportedTokens[normalizedSymbol].addresses;
  const address = tokenAddresses[chainName.toLowerCase()];
  
  if (!address) {
    throw new Error(`Token ${tokenSymbol} not available on ${chainName}`);
  }
  
  // Check if it's native ETH (special handling)
  if (address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
    // For native ETH, return a minimal ERC20-like interface
    return {
      address,
      decimals: async () => 18,
      symbol: async () => 'ETH',
      balanceOf: async (address) => {
        if (signerOrProvider.provider) {
          return signerOrProvider.provider.getBalance(address);
        } else {
          return signerOrProvider.getBalance(address);
        }
      }
    };
  }
  
  // Create contract with ERC20 ABI
  const abi = [
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function balanceOf(address) view returns (uint256)',
    'function allowance(address, address) view returns (uint256)',
    'function approve(address, uint256) returns (bool)'
  ];
  
  return new ethers.Contract(address, abi, signerOrProvider);
}

/**
 * Parse token amount to wei units
 * @param {string|number} amount - Amount in token units
 * @param {number} decimals - Token decimals
 * @returns {BigNumber} Amount in wei units
 */
export function parseTokenAmount(amount, decimals) {
  return ethers.utils.parseUnits(amount.toString(), decimals);
}

/**
 * Format token amount from wei units
 * @param {BigNumber} amount - Amount in wei units
 * @param {number} decimals - Token decimals
 * @returns {string} Formatted amount
 */
export function formatTokenAmount(amount, decimals) {
  return ethers.utils.formatUnits(amount, decimals);
}

/**
 * Normalize token symbol
 * @param {string} symbol - Token symbol
 * @returns {string} Normalized symbol
 */
export function normalizeTokenSymbol(symbol) {
  return symbol.toUpperCase();
}

/**
 * Check if token allowance is sufficient
 * @param {Object} params - Parameters
 * @param {ethers.Contract} params.tokenContract - Token contract
 * @param {string} params.ownerAddress - Token owner address
 * @param {string} params.spenderAddress - Spender address
 * @param {BigNumber} params.amount - Amount to check
 * @returns {Promise<boolean>} Whether allowance is sufficient
 */
export async function checkAllowance({
  tokenContract,
  ownerAddress,
  spenderAddress,
  amount
}) {
  const allowance = await tokenContract.allowance(ownerAddress, spenderAddress);
  return allowance.gte(amount);
}

export default {
  supportedTokens,
  getTokenContract,
  parseTokenAmount,
  formatTokenAmount,
  normalizeTokenSymbol,
  checkAllowance
}; 