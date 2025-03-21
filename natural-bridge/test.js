// Import the function to test
const { normalizeChainName } = require('./src/lib/nlp/bridgeNLP');

// Simple test for normalizeChainName
test('normalizeChainName converts chain aliases to standard names', () => {
  expect(normalizeChainName('eth')).toBe('ethereum');
});
