import React, { useState, useEffect } from 'react'
import { parseCommand } from "@/lib/nlp/nlpProcessor"
import { getRoutes } from "@/lib/bridge/providers"
import { trackPerformance } from "@/lib/monitoring/sentry"
import { BridgeLoadingSkeleton } from "@/components/common/LoadingSkeleton"
import { initStargate, initSocket, simulateAndOptimize } from '@/lib/bridge/contracts'
import { useAccount } from "wagmi"
import { initBiconomy } from "@/lib/biconomy/provider"
import type { BridgeRoute } from "@/types/bridge"

export const BridgeInterface = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [command, setCommand] = useState('')
  const { address: userAddress } = useAccount()

  const handleSubmit = async () => {
    if (!command) return
    
    setIsLoading(true)
    const startTime = performance.now()
    
    try {
      // 1. Parse command with caching (implemented in nlpProcessor)
      const parsed = await parseCommand(command)
      trackPerformance('nlp_parsing', performance.now() - startTime, { command })
      
      // 2. Get routes with batch processing
      const routeStartTime = performance.now()
      const routes = await getRoutes(parsed)
      trackPerformance('route_calculation', performance.now() - routeStartTime, { 
        source: parsed.sourceChain,
        dest: parsed.destChain 
      })
      
      // 3. Select optimal route
      const selected = selectOptimalRoute(routes)
      
      // 4. Execute bridge with transaction simulation
      await executeBridge(selected)
      
      trackPerformance('bridge_processing', performance.now() - startTime, {
        source: parsed.sourceChain,
        dest: parsed.destChain
      })
    } finally {
      setIsLoading(false)
    }
  }

  const executeBridge = async (route: BridgeRoute) => {
    if (!userAddress) return
    
    // Get transaction data based on provider
    let txData
    if (route.provider === 'stargate') {
      const stargate = initStargate(route.sourceChain)
      txData = await stargate.swap({
        amount: route.amount,
        destChain: route.destChain,
        recipient: userAddress
      })
    } else {
      const socket = initSocket()
      txData = await socket.bridge({
        amount: route.amount,
        sourceChain: route.sourceChain,
        destChain: route.destChain,
        recipient: userAddress
      })
    }
    
    // Simulate transaction using Tenderly
    const simulationResult = await simulateAndOptimize({
      from: userAddress,
      to: txData.to,
      data: txData.data,
      value: txData.value
    }, route.sourceChain)
    
    // Execute via Biconomy if simulation succeeded
    if (simulationResult.success) {
      const biconomy = await initBiconomy(Number(route.sourceChain))
      const userOp = await biconomy.buildUserOp([txData])
      return biconomy.sendUserOp(userOp)
    } else {
      throw new Error(`Transaction simulation failed: ${simulationResult.error}`)
    }
  }

  const selectOptimalRoute = (routes: BridgeRoute[]) => {
    return routes.reduce((prev, current) => 
      parseFloat(prev.fee) < parseFloat(current.fee) ? prev : current
    )
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      {isLoading ? <BridgeLoadingSkeleton /> : (
        <>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Enter bridge command (e.g. Send 100 USDC to Polygon)"
            className="w-full p-2 border rounded mb-4"
          />
          <button 
            onClick={handleSubmit}
            className="w-full bg-blue-500 text-white p-2 rounded"
          >
            Submit
          </button>
        </>
      )}
    </div>
  )
} 