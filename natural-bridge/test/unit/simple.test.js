// Simple test file
const { normalizeChainName } = require('../../src/lib/nlp/bridgeNLP');

test('normalizeChainName works', () => {
  expect(normalizeChainName('eth')).toBe('ethereum');
});