'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BridgeRoute } from '@/lib/bridges/types';

// Define the bridge store state
interface BridgeState {
  // Bridge parameters
  sourceChain: string;
  destChain: string;
  token: string;
  amount: string;
  
  // Available routes and selection
  availableRoutes: BridgeRoute[];
  selectedRoute: BridgeRoute | null;
  
  // Bridge status
  bridgeStatus: 'idle' | 'pending' | 'completed' | 'failed';
  transactionHash: string | null;
  error: string | null;
  
  // Command interpretation from NLP
  commandInterpretation: string | null;
  processingCommand: boolean;
  
  // Route cache
  routeCache: {
    [key: string]: {
      routes: BridgeRoute[];
      timestamp: number;
      expiresAt: number;
    }
  };
  
  // Actions
  setSourceChain: (chain: string) => void;
  setDestChain: (chain: string) => void;
  setToken: (token: string) => void;
  setAmount: (amount: string) => void;
  setAvailableRoutes: (routes: BridgeRoute[]) => void;
  setSelectedRoute: (route: BridgeRoute | null) => void;
  setBridgeStatus: (status: 'idle' | 'pending' | 'completed' | 'failed') => void;
  setTransactionHash: (hash: string | null) => void;
  setError: (error: string | null) => void;
  setCommandInterpretation: (interpretation: string | null) => void;
  setProcessingCommand: (processing: boolean) => void;
  setCachedRoutes: (cacheKey: string, routes: BridgeRoute[], expirationMs: number) => void;
  getCachedRoutes: (cacheKey: string) => BridgeRoute[] | null;
  clearCache: () => void;
  reset: () => void;
}

// Create the bridge store with persistence
export const useBridgeStore = create<BridgeState>()(
  persist(
    (set, get) => ({
      // Initial state
      sourceChain: 'base',
      destChain: '',
      token: '',
      amount: '',
      availableRoutes: [],
      selectedRoute: null,
      bridgeStatus: 'idle',
      transactionHash: null,
      error: null,
      commandInterpretation: null,
      processingCommand: false,
      routeCache: {},
      
      // Actions
      setSourceChain: (chain) => set({ sourceChain: chain }),
      setDestChain: (chain) => set({ destChain: chain }),
      setToken: (token) => set({ token }),
      setAmount: (amount) => set({ amount }),
      setAvailableRoutes: (routes) => set({ availableRoutes: routes }),
      setSelectedRoute: (route) => set({ selectedRoute: route }),
      setBridgeStatus: (status) => set({ bridgeStatus: status }),
      setTransactionHash: (hash) => set({ transactionHash: hash }),
      setError: (error) => set({ error }),
      setCommandInterpretation: (interpretation) => set({ commandInterpretation: interpretation }),
      setProcessingCommand: (processing) => set({ processingCommand: processing }),
      
      // Caching functions
      setCachedRoutes: (cacheKey, routes, expirationMs = 5 * 60 * 1000) => {
        const routeCache = { ...get().routeCache };
        routeCache[cacheKey] = {
          routes,
          timestamp: Date.now(),
          expiresAt: Date.now() + expirationMs
        };
        set({ routeCache });
      },
      
      getCachedRoutes: (cacheKey) => {
        const cachedData = get().routeCache[cacheKey];
        if (!cachedData) return null;
        
        // Check if cache is still valid
        if (Date.now() > cachedData.expiresAt) {
          // Cache expired, remove it
          const routeCache = { ...get().routeCache };
          delete routeCache[cacheKey];
          set({ routeCache });
          return null;
        }
        
        return cachedData.routes;
      },
      
      clearCache: () => set({ routeCache: {} }),
      
      // Reset the bridge form
      reset: () => set({ 
        destChain: '',
        token: '',
        amount: '',
        availableRoutes: [],
        selectedRoute: null,
        bridgeStatus: 'idle',
        transactionHash: null,
        error: null,
        commandInterpretation: null
      })
    }),
    {
      name: 'bridge-storage',
      // Only persist certain fields
      partialize: (state) => ({
        sourceChain: state.sourceChain,
        routeCache: state.routeCache
      })
    }
  )
); 