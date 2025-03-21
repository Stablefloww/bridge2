import type { BridgeRoute, NLPResult } from "@/types/bridge"
import { BatchRequest } from "@/lib/utils"
import { getSwapQuote } from "@/services/coinbase"

// Cache for bridge routes
const routeCache = new Map<string, BridgeRoute[]>()

// Batch processor for API requests
const batchProcessor = new BatchRequest(300)

/**
 * Gets bridge routes from multiple providers
 * Uses caching and batching for improved performance
 */
export const getRoutes = async (parsed: NLPResult): Promise<BridgeRoute[]> => {
  if (!parsed.sourceChain || !parsed.destinationChain || !parsed.amount || !parsed.token) {
    throw new Error('Missing required fields for route calculation')
  }
  
  const cacheKey = `${parsed.sourceChain}-${parsed.destinationChain}-${parsed.token}-${parsed.amount}`
  
  // Check cache first
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!
  }
  
  // Start timing
  const startTime = performance.now()
  
  // Use batch processor to group similar requests
  const routes = await batchProcessor.add(
    { 
      sourceChain: parsed.sourceChain, 
      destChain: parsed.destinationChain, 
      token: parsed.token, 
      amount: parsed.amount 
    },
    fetchAllRoutesInBatch
  )
  
  // Add to cache
  routeCache.set(cacheKey, routes)
  
  // Log performance
  const duration = performance.now() - startTime
  console.log(`Route calculation took ${duration}ms`)
  
  return routes
}

/**
 * Batch function to fetch routes from multiple providers
 */
async function fetchAllRoutesInBatch(batchParams: Array<{
  sourceChain: string
  destChain: string
  token: string
  amount: string
}>): Promise<BridgeRoute[][]> {
  // Parallel requests to different bridge providers
  const allResults = await Promise.all(
    batchParams.map(async (params) => {
      const [stargateRoutes, socketRoutes, coinbaseRoutes] = await Promise.all([
        fetchStargateRoutes(params),
        fetchSocketRoutes(params),
        fetchCoinbaseRoutes(params)
      ])
      
      return [...stargateRoutes, ...socketRoutes, ...coinbaseRoutes]
    })
  )
  
  return allResults
}

/**
 * Fetches routes from Stargate (mocked for now)
 */
async function fetchStargateRoutes(params: {
  sourceChain: string
  destChain: string
  token: string
  amount: string
}): Promise<BridgeRoute[]> {
  // In a real app, this would call the actual Stargate API
  await new Promise(resolve => setTimeout(resolve, 400))
  
  return [{
    provider: 'stargate',
    sourceChain: params.sourceChain,
    destChain: params.destChain,
    amount: params.amount,
    fee: (Number(params.amount) * 0.003).toString(), // 0.3% fee
    estimatedTime: 180 // 3 minutes
  }]
}

/**
 * Fetches routes from Socket (mocked for now)
 */
async function fetchSocketRoutes(params: {
  sourceChain: string
  destChain: string
  token: string
  amount: string
}): Promise<BridgeRoute[]> {
  // In a real app, this would call the actual Socket API
  await new Promise(resolve => setTimeout(resolve, 500))
  
  return [{
    provider: 'socket',
    sourceChain: params.sourceChain,
    destChain: params.destChain,
    amount: params.amount,
    fee: (Number(params.amount) * 0.005).toString(), // 0.5% fee
    estimatedTime: 120 // 2 minutes
  }]
}

/**
 * Fetches routes from Coinbase (using real API)
 */
async function fetchCoinbaseRoutes(params: {
  sourceChain: string
  destChain: string
  token: string
  amount: string
}): Promise<BridgeRoute[]> {
  try {
    // Get quote from Coinbase API
    const quote = await getSwapQuote({
      fromChainId: params.sourceChain,
      toChainId: params.destChain,
      fromToken: params.token,
      toToken: params.token,
      amount: params.amount
    })
    
    return [{
      provider: 'hyphen', // Coinbase uses Hyphen bridge
      sourceChain: params.sourceChain,
      destChain: params.destChain,
      amount: params.amount,
      fee: quote.fee || (Number(params.amount) * 0.001).toString(), // Fallback to 0.1% fee
      estimatedTime: 60 // 1 minute
    }]
  } catch (error) {
    console.error('Error fetching Coinbase routes:', error)
    // Return empty array if Coinbase fails
    return []
  }
} 