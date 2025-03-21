// Chain name normalization
const CHAIN_ALIASES = {
  'eth': 'ethereum',
  'poly': 'polygon',
  'arb': 'arbitrum',
  'op': 'optimism',
  'avax': 'avalanche'
};

// Supported chains and tokens
const SUPPORTED_CHAINS = ['ethereum', 'base', 'polygon', 'arbitrum', 'optimism', 'avalanche'];
const SUPPORTED_TOKENS = ['ETH', 'USDC', 'USDT', 'DAI'];

// Bridge routes configuration based on Stargate documentation
const BRIDGE_ROUTES = {
  'base': {
    'ethereum': ['ETH', 'USDC'],
    'polygon': ['USDC'],
    'arbitrum': ['ETH', 'USDC'],
    'optimism': ['ETH', 'USDC']
  },
  'ethereum': {
    'base': ['ETH', 'USDC'],
    'polygon': ['ETH', 'USDC', 'USDT', 'DAI'],
    'arbitrum': ['ETH', 'USDC', 'USDT'],
    'optimism': ['ETH', 'USDC', 'USDT', 'DAI']
  }
};

/**
 * Normalizes chain names using the aliases dictionary
 */
function normalizeChainName(chain) {
  const lowercaseChain = chain.toLowerCase();
  return CHAIN_ALIASES[lowercaseChain] || lowercaseChain;
}

/**
 * Checks if a token is supported for bridging
 */
function isValidToken(token) {
  return SUPPORTED_TOKENS.includes(token.toUpperCase());
}

/**
 * Checks if a chain is supported for bridging
 */
function isChainSupported(chain) {
  return SUPPORTED_CHAINS.includes(normalizeChainName(chain));
}

/**
 * Checks if a route between chains is supported for the given token
 */
function isValidBridgeRoute(sourceChain, destChain, token) {
  const source = normalizeChainName(sourceChain);
  const dest = normalizeChainName(destChain);
  
  return BRIDGE_ROUTES[source]?.hasOwnProperty(dest) && 
         BRIDGE_ROUTES[source][dest].includes(token.toUpperCase());
}

module.exports = { 
  normalizeChainName, 
  CHAIN_ALIASES,
  SUPPORTED_CHAINS,
  SUPPORTED_TOKENS,
  BRIDGE_ROUTES,
  isValidToken,
  isChainSupported,
  isValidBridgeRoute
};
