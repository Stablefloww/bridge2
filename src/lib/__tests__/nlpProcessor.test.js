import { processCommand } from '../nlp/nlpProcessor.js';

describe('NLP Command Processor', () => {
  test('should extract bridge intent with full parameters', async () => {
    const command = 'Bridge 100 USDC from Base to Ethereum';
    const result = await processCommand(command);
    
    expect(result.intent).toBe('BRIDGE');
    expect(result.params.sourceChain).toBe('Base');
    expect(result.params.destChain).toBe('Ethereum');
    expect(result.params.tokenSymbol).toBe('USDC');
    expect(result.params.amount).toBe('100');
    expect(result.needsClarification).toBe(false);
  });
  
  test('should extract bridge intent with missing destination', async () => {
    const command = 'Bridge 50 ETH from Ethereum';
    const result = await processCommand(command);
    
    expect(result.intent).toBe('BRIDGE');
    expect(result.params.sourceChain).toBe('Ethereum');
    expect(result.params.tokenSymbol).toBe('ETH');
    expect(result.params.amount).toBe('50');
    expect(result.needsClarification).toBe(true);
    expect(result.clarificationQuestions[0]).toContain('destination chain');
  });
  
  test('should extract get routes intent', async () => {
    const command = 'What are the routes to bridge 50 ETH from Ethereum to Base?';
    const result = await processCommand(command);
    
    expect(result.intent).toBe('GET_BRIDGE_ROUTES');
    expect(result.params.sourceChain).toBe('Ethereum');
    expect(result.params.destChain).toBe('Base');
    expect(result.params.tokenSymbol).toBe('ETH');
    expect(result.params.amount).toBe('50');
    expect(result.needsClarification).toBe(false);
  });
  
  test('should extract check balance intent', async () => {
    const command = 'Check my balance on Base';
    const result = await processCommand(command);
    
    expect(result.intent).toBe('CHECK_BALANCE');
    expect(result.params.chain).toBe('Base');
    expect(result.needsClarification).toBe(false);
  });
  
  test('should extract check token balance intent', async () => {
    const command = 'What is my USDC balance on Arbitrum?';
    const result = await processCommand(command);
    
    expect(result.intent).toBe('CHECK_BALANCE');
    expect(result.params.chain).toBe('Arbitrum');
    expect(result.params.tokenSymbol).toBe('USDC');
    expect(result.needsClarification).toBe(false);
  });
  
  test('should extract token info intent', async () => {
    const command = 'Tell me about USDC token';
    const result = await processCommand(command);
    
    expect(result.intent).toBe('TOKEN_INFO');
    expect(result.params.tokenSymbol).toBe('USDC');
    expect(result.needsClarification).toBe(false);
  });
  
  test('should extract token info with chain intent', async () => {
    const command = 'Is DAI available on Base?';
    const result = await processCommand(command);
    
    expect(result.intent).toBe('TOKEN_INFO');
    expect(result.params.tokenSymbol).toBe('DAI');
    expect(result.params.chain).toBe('Base');
    expect(result.needsClarification).toBe(false);
  });
  
  test('should handle ambiguous commands', async () => {
    const command = 'Bridge some tokens';
    const result = await processCommand(command);
    
    expect(result.intent).toBe('BRIDGE');
    expect(result.needsClarification).toBe(true);
    expect(result.clarificationQuestions.length).toBeGreaterThan(0);
  });
  
  test('should normalize token symbols', async () => {
    const command = 'Bridge 100 USDC.e from Base to Ethereum';
    const result = await processCommand(command);
    
    expect(result.intent).toBe('BRIDGE');
    expect(result.params.tokenSymbol).toBe('USDC.e');
    expect(result.needsClarification).toBe(false);
  });
  
  test('should handle custom amounts with decimals', async () => {
    const command = 'Bridge 0.5 ETH from Base to Arbitrum';
    const result = await processCommand(command);
    
    expect(result.intent).toBe('BRIDGE');
    expect(result.params.amount).toBe('0.5');
    expect(result.params.tokenSymbol).toBe('ETH');
    expect(result.needsClarification).toBe(false);
  });
}); 