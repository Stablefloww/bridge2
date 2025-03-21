// Import functions to test
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

describe('Bridge NLP Utils', () => {
  describe('normalizeChainName', () => {
    test('converts aliases to standard names', () => {
      expect(normalizeChainName('ethereum')).toBe('Ethereum');
      expect(normalizeChainName('eth')).toBe('Ethereum');
      expect(normalizeChainName('base')).toBe('Base');
      expect(normalizeChainName('arbitrum')).toBe('Arbitrum');
      expect(normalizeChainName('arb')).toBe('Arbitrum');
    });
    
    test('handles case sensitivity', () => {
      expect(normalizeChainName('ETHEREUM')).toBe('Ethereum');
      expect(normalizeChainName('Ethereum')).toBe('Ethereum');
      expect(normalizeChainName('ETH')).toBe('Ethereum');
    });
    
    test('returns original name for unknown chains', () => {
      expect(normalizeChainName('unknown')).toBe('unknown');
      expect(normalizeChainName('solana')).toBe('solana');
    });
  });
  
  describe('isValidToken', () => {
    test('validates supported tokens', () => {
      expect(isValidToken('USDC')).toBe(true);
      expect(isValidToken('ETH')).toBe(true);
      expect(isValidToken('usdt')).toBe(true);
    });
    
    test('rejects unsupported tokens', () => {
      expect(isValidToken('INVALID')).toBe(false);
      expect(isValidToken('SOL')).toBe(false);
      expect(isValidToken('')).toBe(false);
    });
    
    test('handles case sensitivity', () => {
      expect(isValidToken('usdc')).toBe(true);
      expect(isValidToken('Usdc')).toBe(true);
    });
  });
  
  describe('isChainSupported', () => {
    test('validates supported chains', () => {
      expect(isChainSupported('Ethereum')).toBe(true);
      expect(isChainSupported('Base')).toBe(true);
      expect(isChainSupported('Optimism')).toBe(true);
    });
    
    test('validates chains using aliases', () => {
      expect(isChainSupported('eth')).toBe(true);
      expect(isChainSupported('arb')).toBe(true);
    });
    
    test('rejects unsupported chains', () => {
      expect(isChainSupported('Solana')).toBe(false);
      expect(isChainSupported('Bitcoin')).toBe(false);
      expect(isChainSupported('')).toBe(false);
    });
  });
  
  describe('isValidBridgeRoute', () => {
    test('validates supported routes', () => {
      expect(isValidBridgeRoute('Ethereum', 'Arbitrum')).toBe(true);
      expect(isValidBridgeRoute('Base', 'Optimism')).toBe(true);
    });
    
    test('validates routes using aliases', () => {
      expect(isValidBridgeRoute('eth', 'arb')).toBe(true);
      expect(isValidBridgeRoute('base', 'op')).toBe(true);
    });
    
    test('rejects unsupported routes', () => {
      expect(isValidBridgeRoute('Ethereum', 'Solana')).toBe(false);
      expect(isValidBridgeRoute('Ethereum', 'Ethereum')).toBe(false);
      expect(isValidBridgeRoute('', 'Arbitrum')).toBe(false);
    });
  });

  describe('Constants', () => {
    test('CHAIN_ALIASES contains expected mappings', () => {
      expect(CHAIN_ALIASES).toBeDefined();
      expect(CHAIN_ALIASES.eth).toBe('Ethereum');
      expect(CHAIN_ALIASES.arb).toBe('Arbitrum');
    });

    test('SUPPORTED_CHAINS contains expected chains', () => {
      expect(SUPPORTED_CHAINS).toBeDefined();
      expect(SUPPORTED_CHAINS).toContain('Ethereum');
      expect(SUPPORTED_CHAINS).toContain('Arbitrum');
    });

    test('SUPPORTED_TOKENS contains expected tokens', () => {
      expect(SUPPORTED_TOKENS).toBeDefined();
      expect(SUPPORTED_TOKENS).toContain('USDC');
      expect(SUPPORTED_TOKENS).toContain('ETH');
    });

    test('BRIDGE_ROUTES contains expected route mappings', () => {
      expect(BRIDGE_ROUTES).toBeDefined();
      expect(BRIDGE_ROUTES.Ethereum).toBeDefined();
      expect(BRIDGE_ROUTES.Ethereum).toContain('Arbitrum');
    });
  });
}); 