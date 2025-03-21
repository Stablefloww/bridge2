const { normalizeChainName, CHAIN_ALIASES } = require('./bridgeNLP');

test('normalizeChainName should convert aliases to standard names', () => {
  expect(normalizeChainName('eth')).toBe('ethereum');
  expect(normalizeChainName('ETH')).toBe('ethereum');
  expect(normalizeChainName('poly')).toBe('polygon');
  expect(normalizeChainName('arb')).toBe('arbitrum');
});

test('normalizeChainName should return original name if no alias is found', () => {
  expect(normalizeChainName('unknown')).toBe('unknown');
  expect(normalizeChainName('solana')).toBe('solana');
}); 