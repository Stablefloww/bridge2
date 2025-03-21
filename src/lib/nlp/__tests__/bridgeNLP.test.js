import { 
  processNLPCommand, 
  normalizeChainName, 
  normalizeTokenName, 
  extractAmount, 
  extractGasPreference,
  isValidToken,
  isChainSupported,
  isValidBridgeRoute
} from '../bridgeNLP.js';

describe('Bridge NLP Functions', () => {
  describe('normalizeChainName', () => {
    it('should normalize various versions of chain names', () => {
      expect(normalizeChainName('base')).toBe('base');
      expect(normalizeChainName('Base Network')).toBe('base');
      expect(normalizeChainName('ETH')).toBe('ethereum');
      expect(normalizeChainName('Ethereum')).toBe('ethereum');
      expect(normalizeChainName('ARB')).toBe('arbitrum');
      expect(normalizeChainName('Arbitrum One')).toBe('arbitrum');
      expect(normalizeChainName('OP')).toBe('optimism');
      expect(normalizeChainName('Optimism')).toBe('optimism');
    });
    
    it('should return null for unknown chains', () => {
      expect(normalizeChainName('unknown chain')).toBeNull();
    });
    
    it('should handle edge cases', () => {
      expect(normalizeChainName('')).toBeNull();
      expect(normalizeChainName(null)).toBeNull();
      expect(normalizeChainName(undefined)).toBeNull();
    });
  });
  
  describe('normalizeTokenName', () => {
    it('should normalize various versions of token names', () => {
      expect(normalizeTokenName('ETH')).toBe('ETH');
      expect(normalizeTokenName('ether')).toBe('ETH');
      expect(normalizeTokenName('USDC')).toBe('USDC');
      expect(normalizeTokenName('usdc')).toBe('USDC');
      expect(normalizeTokenName('usdt')).toBe('USDT');
      expect(normalizeTokenName('Tether')).toBe('USDT');
    });
    
    it('should return null for unknown tokens', () => {
      expect(normalizeTokenName('unknown token')).toBeNull();
    });
    
    it('should handle edge cases', () => {
      expect(normalizeTokenName('')).toBeNull();
      expect(normalizeTokenName(null)).toBeNull();
      expect(normalizeTokenName(undefined)).toBeNull();
    });
  });
  
  describe('isValidToken', () => {
    it('should validate supported tokens', () => {
      expect(isValidToken('ETH')).toBe(true);
      expect(isValidToken('usdc')).toBe(true);
      expect(isValidToken('Tether')).toBe(true);
      expect(isValidToken('dai')).toBe(true);
    });
    
    it('should reject unsupported tokens', () => {
      expect(isValidToken('BTC')).toBe(false);
      expect(isValidToken('UNKNOWN')).toBe(false);
    });
    
    it('should handle edge cases', () => {
      expect(isValidToken('')).toBe(false);
      expect(isValidToken(null)).toBe(false);
      expect(isValidToken(undefined)).toBe(false);
    });
  });
  
  describe('isChainSupported', () => {
    it('should validate supported chains', () => {
      expect(isChainSupported('ethereum')).toBe(true);
      expect(isChainSupported('base')).toBe(true);
      expect(isChainSupported('ARB')).toBe(true);
      expect(isChainSupported('Optimism')).toBe(true);
    });
    
    it('should reject unsupported chains', () => {
      expect(isChainSupported('solana')).toBe(false);
      expect(isChainSupported('bitcoin')).toBe(false);
    });
    
    it('should handle edge cases', () => {
      expect(isChainSupported('')).toBe(false);
      expect(isChainSupported(null)).toBe(false);
      expect(isChainSupported(undefined)).toBe(false);
    });
  });
  
  describe('isValidBridgeRoute', () => {
    it('should validate supported routes', () => {
      expect(isValidBridgeRoute('ethereum', 'base', 'ETH')).toBe(true);
      expect(isValidBridgeRoute('base', 'optimism', 'USDC')).toBe(true);
      expect(isValidBridgeRoute('ethereum', 'arbitrum', 'USDC')).toBe(true);
    });
    
    it('should reject unsupported routes', () => {
      expect(isValidBridgeRoute('ethereum', 'ethereum', 'ETH')).toBe(false); // Same source and destination
      expect(isValidBridgeRoute('base', 'arbitrum', 'DAI')).toBe(false); // Token not supported on route
      expect(isValidBridgeRoute('solana', 'base', 'ETH')).toBe(false); // Chain not supported
    });
    
    it('should handle edge cases', () => {
      expect(isValidBridgeRoute('', 'base', 'ETH')).toBe(false);
      expect(isValidBridgeRoute('ethereum', '', 'ETH')).toBe(false);
      expect(isValidBridgeRoute('ethereum', 'base', '')).toBe(false);
      expect(isValidBridgeRoute(null, 'base', 'ETH')).toBe(false);
      expect(isValidBridgeRoute('ethereum', null, 'ETH')).toBe(false);
      expect(isValidBridgeRoute('ethereum', 'base', null)).toBe(false);
    });
  });
  
  describe('extractAmount', () => {
    it('should extract amount from string', () => {
      expect(extractAmount('Send 100 USDC to Arbitrum')).toBe('100');
      expect(extractAmount('Bridge 10.5 ETH from Ethereum to Base')).toBe('10.5');
      expect(extractAmount('Transfer my 0.05 ETH to Optimism')).toBe('0.05');
    });
    
    it('should return null if no amount is found', () => {
      expect(extractAmount('Bridge USDC from Base to Arbitrum')).toBeNull();
    });
    
    it('should handle edge cases', () => {
      expect(extractAmount('')).toBeNull();
      expect(extractAmount(null)).toBeNull();
      expect(extractAmount(undefined)).toBeNull();
    });
  });
  
  describe('extractGasPreference', () => {
    it('should extract fast gas preference', () => {
      expect(extractGasPreference('with fast gas')).toBe('fast');
      expect(extractGasPreference('using quick transaction')).toBe('fast');
      expect(extractGasPreference('rapid bridge')).toBe('fast');
    });
    
    it('should extract slow gas preference', () => {
      expect(extractGasPreference('with slow gas')).toBe('slow');
      expect(extractGasPreference('cheap transaction')).toBe('slow');
      expect(extractGasPreference('using economical fees')).toBe('slow');
    });
    
    it('should default to normal gas preference', () => {
      expect(extractGasPreference('transfer ETH to Base')).toBe('normal');
      expect(extractGasPreference('with normal gas')).toBe('normal');
    });
    
    it('should handle edge cases', () => {
      expect(extractGasPreference('')).toBe('normal');
      expect(extractGasPreference(null)).toBe('normal');
      expect(extractGasPreference(undefined)).toBe('normal');
    });
  });
  
  describe('processNLPCommand', () => {
    it('should process simple bridge commands', async () => {
      const result = await processNLPCommand('Send 100 USDC to Arbitrum');
      expect(result).toBeTruthy();
      expect(result.sourceChain).toBe('base'); // Default source is Base
      expect(result.destinationChain).toBe('arbitrum');
      expect(result.token).toBe('USDC');
      expect(result.amount).toBe('100');
      expect(result.gasPreference).toBe('normal');
    });
    
    it('should process commands with explicit source chain', async () => {
      const result = await processNLPCommand('Bridge 10 ETH from Ethereum to Optimism');
      expect(result).toBeTruthy();
      expect(result.sourceChain).toBe('ethereum');
      expect(result.destinationChain).toBe('optimism');
      expect(result.token).toBe('ETH');
      expect(result.amount).toBe('10');
    });
    
    it('should process commands with gas preferences', async () => {
      const result = await processNLPCommand('Send 50 USDT to Polygon with fast gas');
      expect(result).toBeTruthy();
      expect(result.destinationChain).toBe('polygon');
      expect(result.token).toBe('USDT');
      expect(result.amount).toBe('50');
      expect(result.gasPreference).toBe('fast');
    });
    
    it('should handle incomplete commands', async () => {
      const result = await processNLPCommand('Send USDC to Arbitrum');
      expect(result).toBeTruthy();
      expect(result.destinationChain).toBe('arbitrum');
      expect(result.token).toBe('USDC');
      expect(result.amount).toBeNull();
    });
    
    it('should handle token aliases', async () => {
      const result = await processNLPCommand('Send 5 ether to Base');
      expect(result).toBeTruthy();
      expect(result.destinationChain).toBe('base');
      expect(result.token).toBe('ETH');
      expect(result.amount).toBe('5');
    });
    
    it('should handle edge cases', async () => {
      expect(await processNLPCommand('')).toBeNull();
      expect(await processNLPCommand(null)).toBeNull();
      expect(await processNLPCommand(undefined)).toBeNull();
    });
  });
}); 