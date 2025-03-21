import { ethers } from 'ethers';

/**
 * Convert a human-readable amount to wei (or equivalent smallest unit)
 * 
 * @param {string|number} amount - Amount in human-readable format
 * @param {number} decimals - Token decimals
 * @returns {string} Amount in wei as a string
 */
export function parseTokenAmount(amount, decimals = 18) {
  try {
    return ethers.parseUnits(amount.toString(), decimals).toString();
  } catch (error) {
    throw new Error(`Failed to parse amount: ${error.message}`);
  }
}

/**
 * Convert wei (or equivalent smallest unit) to human-readable format
 * 
 * @param {string|bigint} amount - Amount in wei
 * @param {number} decimals - Token decimals
 * @param {number} displayDecimals - Number of decimals to display
 * @returns {string} Human-readable amount
 */
export function formatTokenAmount(amount, decimals = 18, displayDecimals = 4) {
  try {
    const formatted = ethers.formatUnits(amount, decimals);
    
    // Format to specified number of decimal places
    const parts = formatted.split('.');
    if (parts.length === 2) {
      const integerPart = parts[0];
      let decimalPart = parts[1];
      
      if (decimalPart.length > displayDecimals) {
        decimalPart = decimalPart.substring(0, displayDecimals);
      }
      
      // Remove trailing zeros
      while (decimalPart.length > 0 && decimalPart.endsWith('0')) {
        decimalPart = decimalPart.substring(0, decimalPart.length - 1);
      }
      
      if (decimalPart.length > 0) {
        return `${integerPart}.${decimalPart}`;
      }
      
      return integerPart;
    }
    
    return formatted;
  } catch (error) {
    throw new Error(`Failed to format amount: ${error.message}`);
  }
}

/**
 * Normalizes token symbols to standard format
 * 
 * @param {string} symbol - Token symbol to normalize
 * @returns {string} Normalized token symbol
 */
export function normalizeTokenSymbol(symbol) {
  if (!symbol) return '';
  
  // Convert to uppercase
  symbol = symbol.toUpperCase();
  
  // Handle common variations
  const symbolMap = {
    'ETH': 'ETH',
    'WETH': 'ETH',
    'ETHER': 'ETH',
    'ETHEREUM': 'ETH',
    
    'USDC': 'USDC',
    'USDC.E': 'USDC',
    'USDCE': 'USDC',
    
    'USDT': 'USDT',
    'TETHER': 'USDT',
    
    'BTC': 'BTC',
    'BITCOIN': 'BTC',
    'WBTC': 'BTC',
    
    'DAI': 'DAI'
  };
  
  return symbolMap[symbol] || symbol;
}

/**
 * Gets standard token contract ABI for ERC20 tokens
 * 
 * @returns {Array} ERC20 token ABI
 */
export function getERC20Abi() {
  return [
    // Read-only functions
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function balanceOf(address owner) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    
    // Write functions
    'function approve(address spender, uint256 value) returns (bool)',
    'function transfer(address to, uint256 value) returns (bool)',
    'function transferFrom(address from, address to, uint256 value) returns (bool)',
    
    // Events
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)'
  ];
}

/**
 * Checks if an address has sufficient allowance for a specific token and spender
 * 
 * @param {Object} params - Parameters
 * @param {string} params.tokenAddress - Token contract address
 * @param {string} params.owner - Token owner address
 * @param {string} params.spender - Address to check allowance for
 * @param {string|bigint} params.amount - Required amount
 * @param {Object} params.provider - Ethers provider
 * @returns {Promise<boolean>} True if allowance is sufficient
 */
export async function hasEnoughAllowance({ tokenAddress, owner, spender, amount, provider }) {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, getERC20Abi(), provider);
    const allowance = await tokenContract.allowance(owner, spender);
    return BigInt(allowance) >= BigInt(amount);
  } catch (error) {
    console.error('Error checking allowance:', error);
    return false;
  }
}

/**
 * Approves a spender to use tokens
 * 
 * @param {Object} params - Parameters
 * @param {string} params.tokenAddress - Token contract address
 * @param {string} params.spender - Address to approve
 * @param {string|bigint} params.amount - Amount to approve
 * @param {Object} params.signer - Ethers signer
 * @returns {Promise<Object>} Transaction receipt
 */
export async function approveToken({ tokenAddress, spender, amount, signer }) {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, getERC20Abi(), signer);
    const tx = await tokenContract.approve(spender, amount);
    return await tx.wait();
  } catch (error) {
    throw new Error(`Approval failed: ${error.message}`);
  }
} 