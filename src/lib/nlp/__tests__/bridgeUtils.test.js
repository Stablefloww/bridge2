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
    expect(normalizeChainName('eth').toLowerCase()).toBe('ethereum');
    expect(normalizeChainName('poly').toLowerCase()).toBe('polygon');
    expect(normalizeChainName('arb').toLowerCase()).toBe('arbitrum');
    expect(normalizeChainName('op').toLowerCase()).toBe('optimism');
  });
  
  test('handles case sensitivity', () => {
    expect(normalizeChainName('ETH').toLowerCase()).toBe('ethereum');
    expect(normalizeChainName('Eth').toLowerCase()).toBe('ethereum');
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
    // Convert all entries to lowercase for case-insensitive comparison
    const lowerCaseChains = SUPPORTED_CHAINS.map(chain => chain.toLowerCase());
    expect(lowerCaseChains).toContain('ethereum');
    expect(lowerCaseChains).toContain('base');
    expect(lowerCaseChains).toContain('polygon');
    expect(lowerCaseChains).toContain('arbitrum');
    expect(lowerCaseChains).toContain('optimism');
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
    // Handle both lowercase and capitalized formats
    let base, ethereum, polygon;
    
    if (BRIDGE_ROUTES.base) {
      base = 'base';
      ethereum = 'ethereum';
      polygon = 'polygon';
    } else if (BRIDGE_ROUTES.Base) {
      base = 'Base';
      ethereum = 'Ethereum';
      polygon = 'Polygon';
    } else {
      // One of the formats must exist
      expect(BRIDGE_ROUTES.base || BRIDGE_ROUTES.Base).toBeDefined();
    }
    
    expect(BRIDGE_ROUTES[base][ethereum] || BRIDGE_ROUTES[base.toLowerCase()][ethereum.toLowerCase()]).toBeDefined();
    expect(BRIDGE_ROUTES[ethereum][base] || BRIDGE_ROUTES[ethereum.toLowerCase()][base.toLowerCase()]).toBeDefined();

    // Check tokens on routes
    const baseToEth = BRIDGE_ROUTES[base][ethereum] || BRIDGE_ROUTES[base.toLowerCase()][ethereum.toLowerCase()];
    const ethToBase = BRIDGE_ROUTES[ethereum][base] || BRIDGE_ROUTES[ethereum.toLowerCase()][base.toLowerCase()];
    const ethToPoly = BRIDGE_ROUTES[ethereum][polygon] || BRIDGE_ROUTES[ethereum.toLowerCase()][polygon.toLowerCase()];
    
    expect(baseToEth).toContain('ETH');
    expect(ethToPoly).toContain('USDC');
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
    // Case-insensitive check for 'eth' key mapping to some form of 'ethereum'
    expect(CHAIN_ALIASES.eth.toLowerCase()).toBe('ethereum');
    expect(CHAIN_ALIASES.arb.toLowerCase()).toBe('arbitrum');
  });

  test('SUPPORTED_CHAINS contains expected chains', () => {
    expect(SUPPORTED_CHAINS).toBeDefined();
    // Convert to lowercase for case-insensitive comparison
    const lowerCaseChains = SUPPORTED_CHAINS.map(chain => chain.toLowerCase());
    expect(lowerCaseChains).toContain('ethereum');
    expect(lowerCaseChains).toContain('base');
  });

  test('SUPPORTED_TOKENS contains expected tokens', () => {
    expect(SUPPORTED_TOKENS).toBeDefined();
    expect(SUPPORTED_TOKENS).toContain('USDC');
    expect(SUPPORTED_TOKENS).toContain('ETH');
  });

  test('BRIDGE_ROUTES contains expected route mappings', () => {
    expect(BRIDGE_ROUTES).toBeDefined();
    
    // Handle both lowercase and capitalized formats
    let ethereum, base;
    
    if (BRIDGE_ROUTES.ethereum) {
      ethereum = 'ethereum';
      base = 'base';
    } else if (BRIDGE_ROUTES.Ethereum) {
      ethereum = 'Ethereum';
      base = 'Base';
    } else {
      // One of the formats must exist
      expect(BRIDGE_ROUTES.ethereum || BRIDGE_ROUTES.Ethereum).toBeDefined();
      return;
    }
    
    expect(BRIDGE_ROUTES[ethereum]).toBeDefined();
    
    if (BRIDGE_ROUTES[ethereum] && BRIDGE_ROUTES[ethereum][base]) {
      expect(BRIDGE_ROUTES[ethereum][base]).toContain('ETH');
    }
  });
}); 