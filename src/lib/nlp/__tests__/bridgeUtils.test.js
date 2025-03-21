import { 
  normalizeChainName, 
  isValidToken, 
  isChainSupported, 
  isValidBridgeRoute,
  CHAIN_ALIASES,
  SUPPORTED_CHAINS,
  SUPPORTED_TOKENS,
  BRIDGE_ROUTES
} from '../bridgeNLP';

// Test normalizeChainName function
describe('normalizeChainName', () => {
  test('converts aliases to standard names', () => {
    expect(normalizeChainName('eth')).toBe('ethereum');
    expect(normalizeChainName('poly')).toBe('polygon');
    expect(normalizeChainName('arb')).toBe('arbitrum');
    expect(normalizeChainName('op')).toBe('optimism');
  });
  
  test('handles case sensitivity', () => {
    expect(normalizeChainName('ETH')).toBe('ethereum');
    expect(normalizeChainName('Eth')).toBe('ethereum');
  });
  
  test('returns original name in lowercase for unknown chains', () => {
    expect(normalizeChainName('unknown')).toBe('unknown');
    expect(normalizeChainName('solana')).toBe('solana');
  });
});

// Test isValidToken function
describe('isValidToken', () => {
  test('validates supported tokens', () => {
    expect(isValidToken('USDC')).toBe(true);
    expect(isValidToken('ETH')).toBe(true);
    expect(isValidToken('USDT')).toBe(true);
    expect(isValidToken('DAI')).toBe(true);
  });
  
  test('rejects unsupported tokens', () => {
    expect(isValidToken('INVALID')).toBe(false);
    expect(isValidToken('SOL')).toBe(false);
    expect(isValidToken('')).toBe(false);
  });
  
  test('handles case sensitivity', () => {
    expect(isValidToken('usdc')).toBe(true);
    expect(isValidToken('Usdc')).toBe(true);
    expect(isValidToken('eth')).toBe(true);
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

// Test isChainSupported function
describe('isChainSupported', () => {
  test('validates supported chains', () => {
    expect(isChainSupported('ethereum')).toBe(true);
    expect(isChainSupported('base')).toBe(true);
    expect(isChainSupported('polygon')).toBe(true);
  });
  
  test('validates chains using aliases', () => {
    expect(isChainSupported('eth')).toBe(true);
    expect(isChainSupported('arb')).toBe(true);
    expect(isChainSupported('poly')).toBe(true);
  });
  
  test('rejects unsupported chains', () => {
    expect(isChainSupported('solana')).toBe(false);
    expect(isChainSupported('bitcoin')).toBe(false);
    expect(isChainSupported('')).toBe(false);
  });
});

// Test isValidBridgeRoute function
describe('isValidBridgeRoute', () => {
  test('validates supported routes for specific tokens', () => {
    expect(isValidBridgeRoute('ethereum', 'base', 'ETH')).toBe(true);
    expect(isValidBridgeRoute('ethereum', 'arbitrum', 'USDC')).toBe(true);
    expect(isValidBridgeRoute('base', 'optimism', 'USDC')).toBe(true);
  });
  
  test('validates routes using aliases', () => {
    expect(isValidBridgeRoute('eth', 'base', 'ETH')).toBe(true);
    expect(isValidBridgeRoute('base', 'op', 'USDC')).toBe(true);
  });
  
  test('handles token case sensitivity', () => {
    expect(isValidBridgeRoute('ethereum', 'base', 'eth')).toBe(true);
    expect(isValidBridgeRoute('ethereum', 'base', 'usdc')).toBe(true);
  });
  
  test('rejects unsupported routes', () => {
    expect(isValidBridgeRoute('ethereum', 'solana', 'ETH')).toBe(false);
    expect(isValidBridgeRoute('ethereum', 'ethereum', 'ETH')).toBe(false);
    expect(isValidBridgeRoute('', 'arbitrum', 'ETH')).toBe(false);
  });
  
  test('rejects supported routes with unsupported tokens', () => {
    // DAI is not supported on the ethereum -> arbitrum route
    expect(isValidBridgeRoute('ethereum', 'arbitrum', 'DAI')).toBe(false);
  });
});

// Test exported constants
describe('Constants', () => {
  test('CHAIN_ALIASES contains expected mappings', () => {
    expect(CHAIN_ALIASES).toBeDefined();
    expect(CHAIN_ALIASES.eth).toBe('ethereum');
    expect(CHAIN_ALIASES.arb).toBe('arbitrum');
  });

  test('SUPPORTED_CHAINS contains expected chains', () => {
    expect(SUPPORTED_CHAINS).toBeDefined();
    expect(SUPPORTED_CHAINS).toContain('ethereum');
    expect(SUPPORTED_CHAINS).toContain('base');
  });

  test('SUPPORTED_TOKENS contains expected tokens', () => {
    expect(SUPPORTED_TOKENS).toBeDefined();
    expect(SUPPORTED_TOKENS).toContain('USDC');
    expect(SUPPORTED_TOKENS).toContain('ETH');
  });

  test('BRIDGE_ROUTES contains expected route mappings', () => {
    expect(BRIDGE_ROUTES).toBeDefined();
    expect(BRIDGE_ROUTES.ethereum).toBeDefined();
    if (BRIDGE_ROUTES.ethereum && BRIDGE_ROUTES.ethereum.base) {
      expect(BRIDGE_ROUTES.ethereum.base).toContain('ETH');
    }
  });
}); 