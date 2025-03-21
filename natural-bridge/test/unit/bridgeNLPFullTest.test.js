// Simple test file
const { normalizeChainName } = require('../../src/lib/nlp/bridgeNLP');

describe('Bridge NLP Utils', () => {
  test('normalizeChainName converts aliases', () => {
    expect(normalizeChainName('ethereum')).toBe('ethereum');
    expect(normalizeChainName('ETH')).toBe('ethereum');
  });
});