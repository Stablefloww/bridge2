const { 
  normalizeChainName, 
  isValidToken, 
  isChainSupported, 
  isValidBridgeRoute,
  SUPPORTED_CHAINS,
  SUPPORTED_TOKENS,
  BRIDGE_ROUTES
} = require('./src/lib/nlp/bridgeNLP');

describe('Token validation', () => {
  test('isValidToken should validate supported tokens', () => {
    expect(isValidToken('ETH')).toBe(true);
    expect(isValidToken('eth')).toBe(true);
    expect(isValidToken('USDC')).toBe(true);
    expect(isValidToken('usdc')).toBe(true);
    expect(isValidToken('UNKNOWN')).toBe(false);
  });

  test('SUPPORTED_TOKENS should include major stablecoins', () => {
    expect(SUPPORTED_TOKENS).toContain('USDC');
    expect(SUPPORTED_TOKENS).toContain('USDT');
    expect(SUPPORTED_TOKENS).toContain('DAI');
  });
});

describe('Chain support', () => {
  test('isChainSupported should check if a chain is supported', () => {
    expect(isChainSupported('ethereum')).toBe(true);
    expect(isChainSupported('ETH')).toBe(true);
    expect(isChainSupported('base')).toBe(true);
    expect(isChainSupported('polygon')).toBe(true);
    expect(isChainSupported('poly')).toBe(true);
    expect(isChainSupported('unknown')).toBe(false);
  });

  test('SUPPORTED_CHAINS should include major networks', () => {
    expect(SUPPORTED_CHAINS).toContain('ethereum');
    expect(SUPPORTED_CHAINS).toContain('base');
    expect(SUPPORTED_CHAINS).toContain('polygon');
    expect(SUPPORTED_CHAINS).toContain('arbitrum');
    expect(SUPPORTED_CHAINS).toContain('optimism');
  });
});

describe('Route validation', () => {
  test('isValidBridgeRoute should check if a route is supported', () => {
    expect(isValidBridgeRoute('base', 'ethereum', 'ETH')).toBe(true);
    expect(isValidBridgeRoute('base', 'polygon', 'USDC')).toBe(true);
    expect(isValidBridgeRoute('base', 'polygon', 'ETH')).toBe(false);
    expect(isValidBridgeRoute('ethereum', 'base', 'ETH')).toBe(true);
    expect(isValidBridgeRoute('ethereum', 'base', 'DAI')).toBe(false);
  });

  test('BRIDGE_ROUTES should be defined for major paths', () => {
    expect(BRIDGE_ROUTES).toHaveProperty('base.ethereum');
    expect(BRIDGE_ROUTES).toHaveProperty('ethereum.base');
    expect(BRIDGE_ROUTES.base.ethereum).toContain('ETH');
    expect(BRIDGE_ROUTES.ethereum.polygon).toContain('USDC');
  });
}); 