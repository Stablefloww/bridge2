// Import the function to test
const { normalizeChainName } = require('./src/lib/nlp/bridgeNLP');

// Simple test for normalizeChainName
test('normalizeChainName converts chain aliases to standard names', () => {
  expect(normalizeChainName('eth')).toBe('ethereum');
  expect(normalizeChainName('poly')).toBe('polygon');
  expect(normalizeChainName('arb')).toBe('arbitrum');
  expect(normalizeChainName('op')).toBe('optimism');
});

test('normalizeChainName preserves unknown chain names', () => {
  expect(normalizeChainName('unknown')).toBe('unknown');
  expect(normalizeChainName('solana')).toBe('solana');
}); 