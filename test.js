// Import the functions to test
const { 
  normalizeChainName, 
  isValidToken, 
  isChainSupported, 
  isValidBridgeRoute,
  CHAIN_ALIASES,
  SUPPORTED_CHAINS,
  SUPPORTED_TOKENS,
  BRIDGE_ROUTES
} = require('./src/lib/nlp/bridgeNLP');

// Test normalizeChainName function
test('normalizeChainName converts chain aliases to standard names', () => {
  expect(normalizeChainName('eth')).toBe('ethereum');
  expect(normalizeChainName('poly')).toBe('polygon');
  expect(normalizeChainName('arb')).toBe('arbitrum');
  expect(normalizeChainName('op')).toBe('optimism');
});

// Test chain aliases
test('normalizeChainName handles unknown chains', () => {
  expect(normalizeChainName('unknown')).toBe('unknown');
  expect(normalizeChainName('solana')).toBe('solana');
});

// Test CHAIN_ALIASES
test('CHAIN_ALIASES contains expected mappings', () => {
  expect(CHAIN_ALIASES).toHaveProperty('eth', 'ethereum');
  expect(CHAIN_ALIASES).toHaveProperty('poly', 'polygon');
  expect(CHAIN_ALIASES).toHaveProperty('arb', 'arbitrum');
  expect(CHAIN_ALIASES).toHaveProperty('op', 'optimism');
});

// Test isValidToken
test('isValidToken validates tokens correctly', () => {
  expect(isValidToken('ETH')).toBe(true);
  expect(isValidToken('eth')).toBe(true);
  expect(isValidToken('USDC')).toBe(true);
  expect(isValidToken('usdc')).toBe(true);
  expect(isValidToken('UNKNOWN')).toBe(false);
});

// Test SUPPORTED_TOKENS
test('SUPPORTED_TOKENS contains major stablecoins', () => {
  expect(SUPPORTED_TOKENS).toContain('USDC');
  expect(SUPPORTED_TOKENS).toContain('USDT');
  expect(SUPPORTED_TOKENS).toContain('DAI');
});

// Test isChainSupported
test('isChainSupported validates chains correctly', () => {
  expect(isChainSupported('ethereum')).toBe(true);
  expect(isChainSupported('ETH')).toBe(true);
  expect(isChainSupported('base')).toBe(true);
  expect(isChainSupported('polygon')).toBe(true);
  expect(isChainSupported('poly')).toBe(true);
  expect(isChainSupported('unknown')).toBe(false);
});

// Test SUPPORTED_CHAINS
test('SUPPORTED_CHAINS contains major networks', () => {
  expect(SUPPORTED_CHAINS).toContain('ethereum');
  expect(SUPPORTED_CHAINS).toContain('base');
  expect(SUPPORTED_CHAINS).toContain('polygon');
  expect(SUPPORTED_CHAINS).toContain('arbitrum');
  expect(SUPPORTED_CHAINS).toContain('optimism');
});

// Test isValidBridgeRoute
test('isValidBridgeRoute validates routes correctly', () => {
  expect(isValidBridgeRoute('base', 'ethereum', 'ETH')).toBe(true);
  expect(isValidBridgeRoute('base', 'polygon', 'USDC')).toBe(true);
  expect(isValidBridgeRoute('base', 'polygon', 'ETH')).toBe(false);
  expect(isValidBridgeRoute('ethereum', 'base', 'ETH')).toBe(true);
  expect(isValidBridgeRoute('ethereum', 'base', 'DAI')).toBe(false);
});

// Test BRIDGE_ROUTES
test('BRIDGE_ROUTES contains expected paths', () => {
  expect(BRIDGE_ROUTES).toHaveProperty('base.ethereum');
  expect(BRIDGE_ROUTES).toHaveProperty('ethereum.base');
  expect(BRIDGE_ROUTES.base.ethereum).toContain('ETH');
  expect(BRIDGE_ROUTES.ethereum.polygon).toContain('USDC');
}); 