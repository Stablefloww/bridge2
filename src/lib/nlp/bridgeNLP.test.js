import { normalizeChainName, CHAIN_ALIASES } from './bridgeNLP.js';

test('normalizeChainName should convert aliases to standard names', () => {
  expect(normalizeChainName('eth')).toBe('ethereum');
  expect(normalizeChainName('arb')).toBe('arbitrum');
  expect(normalizeChainName('op')).toBe('optimism');
});

describe('Chain name normalization', () => {
  test('Chain aliases mapping', () => {
    expect(CHAIN_ALIASES).toBeDefined();
    expect(CHAIN_ALIASES.eth).toBe('ethereum');
    expect(CHAIN_ALIASES.arb).toBe('arbitrum');
  });
}); 