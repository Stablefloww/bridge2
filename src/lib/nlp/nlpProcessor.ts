import type { NLPResult } from '@/types/bridge'

// Simple LRU cache implementation for NLP results
const MAX_CACHE_SIZE = 50
const nlpCache = new Map<string, NLPResult>()

/**
 * Parses natural language commands for bridging transactions
 * Uses caching to improve performance
 */
export const parseCommand = async (command: string): Promise<NLPResult> => {
  // Check cache first
  if (nlpCache.has(command)) {
    return nlpCache.get(command)!
  }
  
  // Start timing
  const startTime = performance.now()
  
  // Simple regex-based parsing
  // In a real application, this would use a proper NLP service or ML model
  const result: NLPResult = {
    originalCommand: command,
    interpretedCommand: command,
    confidence: 0.8,
    missingFields: []
  }
  
  // Parse amount
  const amountMatch = command.match(/(\d+(\.\d+)?)\s*([A-Za-z]{2,6})/i)
  if (amountMatch) {
    result.amount = amountMatch[1]
    result.token = amountMatch[3].toUpperCase()
  } else {
    result.missingFields.push('amount')
  }
  
  // Parse chains
  const destChainMatch = command.match(/to\s+([A-Za-z]+)(\s|$)/i)
  if (destChainMatch) {
    result.destinationChain = normalizeChainName(destChainMatch[1])
  } else {
    result.missingFields.push('destinationChain')
  }
  
  const sourceChainMatch = command.match(/from\s+([A-Za-z]+)(\s|$)/i)
  if (sourceChainMatch) {
    result.sourceChain = normalizeChainName(sourceChainMatch[1])
  } else {
    // Default to Ethereum if not specified
    result.sourceChain = '1' // Ethereum mainnet
  }
  
  // Add to cache, managing size
  if (nlpCache.size >= MAX_CACHE_SIZE) {
    const firstKey = nlpCache.keys().next().value
    nlpCache.delete(firstKey)
  }
  nlpCache.set(command, result)
  
  // Log performance
  const duration = performance.now() - startTime
  console.log(`NLP processing took ${duration}ms`)
  
  return result
}

/**
 * Normalizes chain names to their IDs
 */
const normalizeChainName = (name: string): string => {
  const chainMap: Record<string, string> = {
    'ethereum': '1',
    'eth': '1',
    'polygon': '137',
    'matic': '137',
    'optimism': '10',
    'op': '10',
    'arbitrum': '42161',
    'arb': '42161',
    'base': '8453',
    'avalanche': '43114',
    'avax': '43114',
    'bsc': '56',
    'binance': '56'
  }
  
  const normalized = name.toLowerCase()
  return chainMap[normalized] || normalized
} 