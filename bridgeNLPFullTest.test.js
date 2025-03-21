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

test('normalizeChainName works correctly', () => {
  expect(normalizeChainName('eth')).toBe('ethereum');
  expect(normalizeChainName('ETH')).toBe('ethereum');
  expect(normalizeChainName('poly')).toBe('polygon');
  expect(normalizeChainName('arb')).toBe('arbitrum');
  expect(normalizeChainName('op')).toBe('optimism');
  expect(normalizeChainName('unknown')).toBe('unknown');
});

test('isValidToken works correctly', () => {
  expect(isValidToken('ETH')).toBe(true);
  expect(isValidToken('eth')).toBe(true);
  expect(isValidToken('USDC')).toBe(true);
  expect(isValidToken('usdc')).toBe(true);
  expect(isValidToken('UNKNOWN')).toBe(false);
});

test('isChainSupported works correctly', () => {
  expect(isChainSupported('ethereum')).toBe(true);
  expect(isChainSupported('ETH')).toBe(true);
  expect(isChainSupported('base')).toBe(true);
  expect(isChainSupported('polygon')).toBe(true);
  expect(isChainSupported('poly')).toBe(true);
  expect(isChainSupported('unknown')).toBe(false);
});

test('isValidBridgeRoute works correctly', () => {
  expect(isValidBridgeRoute('base', 'ethereum', 'ETH')).toBe(true);
  expect(isValidBridgeRoute('base', 'polygon', 'USDC')).toBe(true);
  expect(isValidBridgeRoute('base', 'polygon', 'ETH')).toBe(false);
  expect(isValidBridgeRoute('ethereum', 'base', 'ETH')).toBe(true);
  expect(isValidBridgeRoute('ethereum', 'base', 'DAI')).toBe(false);
}); 