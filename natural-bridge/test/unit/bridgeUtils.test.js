// Import functions to test
const { 
  normalizeChainName, 
  isValidToken,
  isChainSupported,
  isValidBridgeRoute,
  CHAIN_ALIASES,
  SUPPORTED_CHAINS,
  SUPPORTED_TOKENS,
  BRIDGE_ROUTES
} = require('../../src/lib/nlp/bridgeNLP');

// Test normalizeChainName function
describe('normalizeChainName', () => {
  test('converts aliases to standard names', () => {
    expect(normalizeChainName('eth')).toBe('ethereum');
    expect(normalizeChainName('poly')).toBe('polygon');
    expect(normalizeChainName('arb')).toBe('arbitrum');
  });
  
  test('handles case sensitivity', () => {
    expect(normalizeChainName('ETH')).toBe('ethereum');
    expect(normalizeChainName('Eth')).toBe('ethereum');
  });
});

// Test isValidToken function
describe('isValidToken', () => {
  test('validates supported tokens', () => {
    expect(isValidToken('USDC')).toBe(true);
    expect(isValidToken('ETH')).toBe(true);
  });
  
  test('rejects unsupported tokens', () => {
    expect(isValidToken('INVALID')).toBe(false);
    expect(isValidToken('SOL')).toBe(false);
  });
});
// Test isChainSupported function
describe('isChainSupported', () => {
  test('validates supported chains', () => {
    expect(isChainSupported('ethereum')).toBe(true);
    expect(isChainSupported('base')).toBe(true);
  });
  
  test('validates chains using aliases', () => {
    expect(isChainSupported('eth')).toBe(true);
    expect(isChainSupported('arb')).toBe(true);
  });
  
  test('rejects unsupported chains', () => {
    expect(isChainSupported('solana')).toBe(false);
  });
});

// Test isValidBridgeRoute function
describe('isValidBridgeRoute', () => {
  test('validates supported routes for specific tokens', () => {
    expect(isValidBridgeRoute('ethereum', 'base', 'ETH')).toBe(true);
    expect(isValidBridgeRoute('ethereum', 'arbitrum', 'USDC')).toBe(true);
  });
  
  test('rejects unsupported routes', () => {
    expect(isValidBridgeRoute('ethereum', 'solana', 'ETH')).toBe(false);
    expect(isValidBridgeRoute('ethereum', 'ethereum', 'ETH')).toBe(false);
  });
});

// Test constants
describe('Constants', () => {
  test('CHAIN_ALIASES contains expected mappings', () => {
    expect(CHAIN_ALIASES).toBeDefined();
    expect(CHAIN_ALIASES.eth).toBe('ethereum');
  });

  test('SUPPORTED_CHAINS contains expected chains', () => {
    expect(SUPPORTED_CHAINS).toBeDefined();
    expect(SUPPORTED_CHAINS).toContain('ethereum');
  });

  test('SUPPORTED_TOKENS contains expected tokens', () => {
    expect(SUPPORTED_TOKENS).toBeDefined();
    expect(SUPPORTED_TOKENS).toContain('USDC');
  });
});