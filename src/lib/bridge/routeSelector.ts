import { BridgeRoute } from "@/types"

const routeCache = new Map<string, BridgeRoute>()

export const selectOptimalRoute = (routes: BridgeRoute[]): BridgeRoute => {
  const cacheKey = JSON.stringify(routes)
  if (routeCache.has(cacheKey)) return routeCache.get(cacheKey)!

  const optimal = routes.reduce((prev, current) => 
    parseFloat(prev.fee) < parseFloat(current.fee) ? prev : current
  )
  
  routeCache.set(cacheKey, optimal)
  return optimal
} 