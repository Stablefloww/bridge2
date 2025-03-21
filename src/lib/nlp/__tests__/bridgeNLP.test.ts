import { processNLPCommand, normalizeChainName, generateClarificationQuestion, SUPPORTED_CHAINS, SUPPORTED_TOKENS, CHAIN_ALIASES } from '../bridgeNLP';
import { getChatCompletion } from '@/lib/ai/openai';
import { generateContent } from '@/lib/ai/gemini';

// Mock the AI services
jest.mock('@/lib/ai/openai');
jest.mock('@/lib/ai/gemini');

describe('Bridge NLP Processing', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.resetAllMocks();
    
    // Setup default mock response for OpenAI
    (getChatCompletion as jest.Mock).mockResolvedValue(`
      {
        "sourceChain": "base",
        "destinationChain": "ethereum",
        "token": "ETH",
        "amount": "0.5",
        "gasPreference": "normal"
      }
    `);
  });
  
  test('should process a complete bridge command successfully', async () => {
    const command = 'Bridge 0.5 ETH to Ethereum';
    const result = await processNLPCommand(command);
    
    expect(result).not.toBeNull();
    expect(result?.sourceChain).toBe('base');
    expect(result?.destinationChain).toBe('ethereum');
    expect(result?.token).toBe('ETH');
    expect(result?.amount).toBe('0.5');
    expect(result?.gasPreference).toBe('normal');
  });
  
  test('should normalize chain names', async () => {
    (getChatCompletion as jest.Mock).mockResolvedValue(`
      {
        "sourceChain": "eth",
        "destinationChain": "poly",
        "token": "USDC",
        "amount": "100",
        "gasPreference": "normal"
      }
    `);
    
    const command = 'Send 100 USDC from Ethereum to Polygon';
    const result = await processNLPCommand(command);
    
    expect(result).not.toBeNull();
    expect(result?.sourceChain).toBe('ethereum');
    expect(result?.destinationChain).toBe('polygon');
  });
  
  test('should handle missing information', async () => {
    (getChatCompletion as jest.Mock).mockResolvedValue(`
      {
        "destinationChain": "arbitrum",
        "token": "USDC",
        "amount": ""
      }
    `);
    
    const command = 'Bridge USDC to Arbitrum';
    const result = await processNLPCommand(command);
    
    // Should return null due to missing amount
    expect(result).toBeNull();
  });
  
  test('should validate token symbols', async () => {
    (getChatCompletion as jest.Mock).mockResolvedValue(`
      {
        "sourceChain": "base",
        "destinationChain": "ethereum",
        "token": "INVALID_TOKEN",
        "amount": "10",
        "gasPreference": "normal"
      }
    `);
    
    const command = 'Bridge 10 INVALID_TOKEN to Ethereum';
    const result = await processNLPCommand(command);
    
    // Should return null due to invalid token
    expect(result).toBeNull();
  });
  
  test('should generate clarification questions for missing parameters', async () => {
    (getChatCompletion as jest.Mock).mockResolvedValue('Which token and how much would you like to bridge to Ethereum?');
    
    const question = await generateClarificationQuestion('Bridge to Ethereum', ['token', 'amount']);
    
    expect(question).toBe('Which token and how much would you like to bridge to Ethereum?');
    expect(getChatCompletion).toHaveBeenCalledWith(expect.stringContaining('token, amount'));
  });
  
  test('should fallback to Gemini if OpenAI fails', async () => {
    (getChatCompletion as jest.Mock).mockRejectedValue(new Error('OpenAI error'));
    (generateContent as jest.Mock).mockResolvedValue(`
      {
        "sourceChain": "base",
        "destinationChain": "optimism",
        "token": "ETH",
        "amount": "1.5",
        "gasPreference": "fast"
      }
    `);
    
    const command = 'Bridge 1.5 ETH to Optimism with fast gas';
    const result = await processNLPCommand(command);
    
    expect(result).not.toBeNull();
    expect(result?.destinationChain).toBe('optimism');
    expect(result?.gasPreference).toBe('fast');
    expect(generateContent).toHaveBeenCalled();
  });
});

describe('bridgeNLP', () => {
  describe('normalizeChainName', () => {
    test('should normalize chain names correctly', () => {
      expect(normalizeChainName('eth')).toBe('ethereum');
      expect(normalizeChainName('ETH')).toBe('ethereum');
      expect(normalizeChainName('poly')).toBe('polygon');
      expect(normalizeChainName('POLY')).toBe('polygon');
      expect(normalizeChainName('arb')).toBe('arbitrum');
      expect(normalizeChainName('OP')).toBe('optimism');
    });

    test('should return the same chain name if not found in aliases', () => {
      expect(normalizeChainName('unknown')).toBe('unknown');
      expect(normalizeChainName('solana')).toBe('solana');
    });

    test('should handle all supported chain aliases', () => {
      // Test all defined aliases
      Object.entries(CHAIN_ALIASES).forEach(([alias, expected]) => {
        expect(normalizeChainName(alias)).toBe(expected);
      });
    });
  });
});

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
  });
}); 