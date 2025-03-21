/// <reference types="jest" />

import { normalizeChainName, CHAIN_ALIASES } from '../bridgeNLP';

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