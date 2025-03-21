// Simple test file
import { normalizeChainName } from '../bridgeNLP';

test('normalizeChainName works', () => {
  expect(normalizeChainName('eth')).toBe('ethereum');
}); 