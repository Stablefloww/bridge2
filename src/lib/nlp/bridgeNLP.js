// Mapping of chain aliases to normalized names
const CHAIN_ALIASES = {
  'eth': 'ethereum',
  'ether': 'ethereum',
  'ethereum': 'ethereum',
  'arb': 'arbitrum',
  'arbitrum': 'arbitrum',
  'arbitrum one': 'arbitrum',
  'base': 'base',
  'op': 'optimism',
  'optimism': 'optimism',
  'poly': 'polygon',
  'polygon': 'polygon',
  'matic': 'polygon'
};

// List of supported chains
const SUPPORTED_CHAINS = [
  'ethereum',
  'arbitrum',
  'base',
  'optimism',
  'polygon'
];

// Token name normalizations
const TOKEN_ALIASES = {
  'eth': 'ETH',
  'ether': 'ETH',
  'usdc': 'USDC',
  'usdt': 'USDT',
  'tether': 'USDT',
  'dai': 'DAI',
};

// List of supported tokens
const SUPPORTED_TOKENS = [
  'ETH',
  'USDC',
  'USDT',
  'DAI'
];

// Valid bridge routes with supported tokens
const BRIDGE_ROUTES = {
  'ethereum': {
    'base': ['ETH', 'USDC', 'USDT'],
    'arbitrum': ['ETH', 'USDC'],
    'optimism': ['ETH', 'USDC', 'USDT'],
    'polygon': ['ETH', 'USDC', 'USDT']
  },
  'base': {
    'ethereum': ['ETH', 'USDC', 'USDT'],
    'arbitrum': ['USDC', 'USDT'],
    'optimism': ['USDC', 'USDT'],
    'polygon': ['USDC', 'USDT']
  },
  'arbitrum': {
    'ethereum': ['ETH', 'USDC'],
    'base': ['USDC', 'USDT'],
    'optimism': ['USDC'],
    'polygon': ['USDC']
  },
  'optimism': {
    'ethereum': ['ETH', 'USDC', 'USDT'],
    'base': ['USDC', 'USDT'],
    'arbitrum': ['USDC'],
    'polygon': ['USDC']
  },
  'polygon': {
    'ethereum': ['ETH', 'USDC', 'USDT'],
    'base': ['USDC', 'USDT'],
    'arbitrum': ['USDC'],
    'optimism': ['USDC']
  }
};

/**
 * Normalize chain name by converting aliases to standard names
 * @param {string} chainName - The chain name to normalize
 * @returns {string|null} - The normalized chain name or null if not supported
 */
function normalizeChainName(chainName) {
  if (!chainName) return null;
  
  const normalized = chainName.toLowerCase();
  
  // Check if it's a direct match or an alias
  if (CHAIN_ALIASES[normalized]) {
    return CHAIN_ALIASES[normalized];
  }
  
  // Try to match partial names
  for (const [alias, name] of Object.entries(CHAIN_ALIASES)) {
    if (normalized.includes(alias)) {
      return name;
    }
  }
  
  return null;
}

/**
 * Normalize token name by converting aliases to standard names
 * @param {string} tokenName - The token name to normalize
 * @returns {string|null} - The normalized token name or null if not supported
 */
function normalizeTokenName(tokenName) {
  if (!tokenName) return null;
  
  const normalized = tokenName.toLowerCase();
  
  // Check if it's a direct match or an alias
  if (TOKEN_ALIASES[normalized]) {
    return TOKEN_ALIASES[normalized];
  }
  
  // Check if it's already a valid token (case-insensitive)
  for (const token of SUPPORTED_TOKENS) {
    if (token.toLowerCase() === normalized) {
      return token;
    }
  }
  
  return null;
}

/**
 * Check if a token is supported
 * @param {string} token - The token to check
 * @returns {boolean} - Whether the token is supported
 */
function isValidToken(token) {
  if (!token) return false;
  const normalized = normalizeTokenName(token);
  return SUPPORTED_TOKENS.includes(normalized);
}

/**
 * Check if a chain is supported
 * @param {string} chain - The chain to check
 * @returns {boolean} - Whether the chain is supported
 */
function isChainSupported(chain) {
  if (!chain) return false;
  const normalized = normalizeChainName(chain);
  return SUPPORTED_CHAINS.includes(normalized);
}

/**
 * Check if a bridge route is valid for a given token
 * @param {string} sourceChain - The source chain
 * @param {string} destinationChain - The destination chain
 * @param {string} token - The token to bridge
 * @returns {boolean} - Whether the bridge route is valid
 */
function isValidBridgeRoute(sourceChain, destinationChain, token) {
  if (!sourceChain || !destinationChain || !token) {
    return false;
  }
  
  const normalizedSource = normalizeChainName(sourceChain);
  const normalizedDest = normalizeChainName(destinationChain);
  const normalizedToken = normalizeTokenName(token);
  
  if (!normalizedSource || !normalizedDest || !normalizedToken) {
    return false;
  }
  
  if (normalizedSource === normalizedDest) {
    return false;
  }
  
  if (!BRIDGE_ROUTES[normalizedSource]) {
    return false;
  }
  
  if (!BRIDGE_ROUTES[normalizedSource][normalizedDest]) {
    return false;
  }
  
  return BRIDGE_ROUTES[normalizedSource][normalizedDest].includes(normalizedToken);
}

/**
 * Extract amount from a string
 * @param {string} text - The text to extract amount from
 * @returns {string|null} - The extracted amount or null if not found
 */
function extractAmount(text) {
  if (!text) return null;
  const amountRegex = /(\d+\.?\d*|\.\d+)/;
  const match = text.match(amountRegex);
  return match ? match[1] : null;
}

/**
 * Extract gas preference from a string
 * @param {string} text - The text to extract gas preference from
 * @returns {string} - The gas preference (fast, normal, slow)
 */
function extractGasPreference(text) {
  if (!text) return 'normal';
  const lowercaseText = text.toLowerCase();
  
  if (lowercaseText.includes('fast') || 
      lowercaseText.includes('quick') || 
      lowercaseText.includes('rapid')) {
    return 'fast';
  }
  
  if (lowercaseText.includes('slow') || 
      lowercaseText.includes('cheap') || 
      lowercaseText.includes('economical')) {
    return 'slow';
  }
  
  return 'normal';
}

/**
 * Process a natural language command for bridging
 * @param {string} command - The natural language command
 * @returns {Object|null} - The processed command parameters or null if invalid
 */
async function processNLPCommand(command) {
  if (!command) return null;
  
  const lowercaseCmd = command.toLowerCase();
  let sourceChain = 'base'; // Default source chain
  let destinationChain = null;
  let token = null;
  let amount = null;
  
  // Extract destination chain
  for (const chain of SUPPORTED_CHAINS) {
    const chainRegex = new RegExp(`to\\s+${chain}|to\\s+${CHAIN_ALIASES[chain]}`, 'i');
    if (lowercaseCmd.match(chainRegex)) {
      destinationChain = chain;
      break;
    }
  }
  
  // Extract source chain
  for (const chain of SUPPORTED_CHAINS) {
    const chainRegex = new RegExp(`from\\s+${chain}|from\\s+${CHAIN_ALIASES[chain]}`, 'i');
    if (lowercaseCmd.match(chainRegex)) {
      sourceChain = chain;
      break;
    }
  }
  
  // Extract token
  for (const supportedToken of SUPPORTED_TOKENS) {
    if (lowercaseCmd.includes(supportedToken.toLowerCase())) {
      token = supportedToken;
      break;
    }
  }
  
  // Check token aliases
  if (!token) {
    for (const [alias, standardToken] of Object.entries(TOKEN_ALIASES)) {
      if (lowercaseCmd.includes(alias.toLowerCase())) {
        token = standardToken;
        break;
      }
    }
  }
  
  // Extract amount
  amount = extractAmount(command);
  
  // Extract gas preference
  const gasPreference = extractGasPreference(command);
  
  // Build the result
  const result = {
    sourceChain,
    destinationChain,
    token,
    amount,
    gasPreference
  };
  
  return result;
}

export {
  normalizeChainName,
  normalizeTokenName,
  isValidToken,
  isChainSupported,
  isValidBridgeRoute,
  extractAmount,
  extractGasPreference,
  processNLPCommand,
  CHAIN_ALIASES,
  SUPPORTED_CHAINS,
  SUPPORTED_TOKENS,
  BRIDGE_ROUTES
}; 