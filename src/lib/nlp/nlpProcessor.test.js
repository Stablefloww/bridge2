import nlpProcessor from './nlpProcessor.js';

const { processCommand, generateClarification } = nlpProcessor;

describe('NLP Processor', () => {
  describe('processCommand', () => {
    it('should correctly identify a bridge intent', async () => {
      const result = await processCommand('Bridge 100 USDC from Base to Ethereum');
      expect(result.intent).toBe('bridge');
      expect(result.params.amount).toBe('100');
      expect(result.params.token).toBe('usdc');
      expect(result.params.sourceChain).toBe('base');
      expect(result.params.destChain).toBe('ethereum');
    });
    
    it('should identify a bridge intent with simpler command', async () => {
      const result = await processCommand('Send 0.5 ETH to Arbitrum');
      expect(result.intent).toBe('bridge');
      expect(result.params.token).toBe('eth');
      expect(result.params.amount).toBe('0.5');
      expect(result.params.destChain).toBe('arbitrum');
      // Source chain defaults to base
      expect(result.params.sourceChain).toBe('base');
    });
    
    it('should identify a balance check intent', async () => {
      const result = await processCommand('Check my ETH balance on Base');
      expect(result.intent).toBe('balance_check');
      expect(result.params.token).toBe('eth');
      expect(result.params.chain).toBe('base');
    });
    
    it('should handle token info requests', async () => {
      const result = await processCommand('What tokens are supported?');
      expect(result.intent).toBe('token_info');
      expect(result.tokens).toBeDefined();
      expect(result.tokens.length).toBeGreaterThan(0);
    });
    
    it('should handle chain info requests', async () => {
      const result = await processCommand('What chains are available?');
      expect(result.intent).toBe('chain_info');
      expect(result.chains).toBeDefined();
      expect(result.chains.length).toBeGreaterThan(0);
    });
  });
  
  describe('generateClarification', () => {
    it('should generate clarification questions for missing amount', () => {
      const extractionResult = {
        intent: 'bridge',
        params: {
          token: 'eth',
          sourceChain: 'base',
          destChain: 'ethereum'
        }
      };
      
      const clarification = generateClarification(extractionResult);
      expect(clarification.needsClarification).toBe(true);
      expect(clarification.missingParams).toContain('amount');
      expect(clarification.questions.length).toBeGreaterThan(0);
    });
    
    it('should generate clarification questions for missing destination', () => {
      const extractionResult = {
        intent: 'bridge',
        params: {
          amount: '100',
          token: 'usdc',
          sourceChain: 'base'
        }
      };
      
      const clarification = generateClarification(extractionResult);
      expect(clarification.needsClarification).toBe(true);
      expect(clarification.missingParams).toContain('destination chain');
      expect(clarification.questions.length).toBeGreaterThan(0);
    });
    
    it('should not generate clarification for complete parameters', () => {
      const extractionResult = {
        intent: 'bridge',
        params: {
          amount: '100',
          token: 'usdc',
          sourceChain: 'base',
          destChain: 'ethereum'
        }
      };
      
      const clarification = generateClarification(extractionResult);
      expect(clarification.needsClarification).toBe(false);
    });
  });
}); 