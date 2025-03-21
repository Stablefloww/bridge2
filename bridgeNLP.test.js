const { normalizeChainName, CHAIN_ALIASES } = require('./natural-bridge/src/lib/nlp/bridgeNLP');

describe('Chain name normalization', () => {
  test('normalizeChainName should convert aliases to standard names', () => {
    expect(normalizeChainName('eth')).toBe('ethereum');
    expect(normalizeChainName('ETH')).toBe('ethereum');
    expect(normalizeChainName('poly')).toBe('polygon');
    expect(normalizeChainName('arb')).toBe('arbitrum');
    expect(normalizeChainName('op')).toBe('optimism');
  });

  test('normalizeChainName should return original name if no alias is found', () => {
    expect(normalizeChainName('unknown')).toBe('unknown');
    expect(normalizeChainName('solana')).toBe('solana');
  });
});

describe('Chain Aliases', () => {
  test('CHAIN_ALIASES should contain expected mappings', () => {
    expect(CHAIN_ALIASES).toHaveProperty('eth', 'ethereum');
    expect(CHAIN_ALIASES).toHaveProperty('poly', 'polygon');
    expect(CHAIN_ALIASES).toHaveProperty('arb', 'arbitrum');
    expect(CHAIN_ALIASES).toHaveProperty('op', 'optimism');
  });
}); 