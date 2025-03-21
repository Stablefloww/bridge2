'use client';

import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useBridgeStore } from '@/store/bridge';
import type { 
  BridgeRoute, 
  BridgeRouteParams, 
  BridgeTransaction, 
  CachedRoute,
  RouteScore
} from '@/lib/bridges/types';
import { getStargateClient } from '@/lib/bridges';
import { scoreRoutes } from '@/lib/bridges/scoring';
import { getBridgeProviders } from '@/lib/bridges';
import { useWallet } from '@/hooks/useWallet';

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// In-memory cache for routes
const routeCache: Map<string, CachedRoute> = new Map();

// Generate cache key from route parameters
const getCacheKey = (params: BridgeRouteParams): string => {
  return `${params.srcChain}-${params.dstChain}-${params.token}-${params.amount}`;
};

// Check if a cached route is still valid
const isCacheValid = (cachedRoute: CachedRoute): boolean => {
  return Date.now() < cachedRoute.expiresAt;
};

// Hook for handling bridge routes and transactions
export function useBridge() {
  const { 
    sourceChain, 
    destChain, 
    token, 
    amount,
    setAvailableRoutes,
    availableRoutes,
    selectedRoute,
    setSelectedRoute,
    bridgeStatus,
    setBridgeStatus,
    setError 
  } = useBridgeStore();
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Get all available bridge providers
  const providers = getBridgeProviders();
  
  // Fetch routes from all supported providers
  const fetchRoutes = useCallback(async (params: BridgeRouteParams): Promise<BridgeRoute[]> => {
    try {
      // Check cache first
      const cacheKey = getCacheKey(params);
      const cachedRoute = routeCache.get(cacheKey);
      
      if (cachedRoute && isCacheValid(cachedRoute)) {
        console.log('Using cached route:', cachedRoute.route);
        return [cachedRoute.route];
      }
      
      // Get providers that support the specified route
      const supportedProviders = providers.filter(provider => 
        provider.supportsRoute(params.srcChain, params.dstChain, params.token)
      );
      
      if (supportedProviders.length === 0) {
        throw new Error(`No supported bridge providers found for route: ${params.srcChain} -> ${params.dstChain} for token ${params.token}`);
      }
      
      // Fetch routes from all supported providers in parallel
      const routePromises = supportedProviders.map(provider => {
        return provider.getRoute(params)
          .catch(error => {
            console.error(`Error fetching route from ${provider.name}:`, error);
            return null;
          });
      });
      
      const routes = await Promise.all(routePromises);
      const validRoutes = routes.filter(route => route !== null) as BridgeRoute[];
      
      if (validRoutes.length === 0) {
        throw new Error('No valid routes found from any provider');
      }
      
      // Cache the routes
      validRoutes.forEach(route => {
        routeCache.set(getCacheKey({
          srcChain: route.srcChain,
          dstChain: route.dstChain,
          token: route.token,
          amount: route.amount,
          userAddress: params.userAddress
        }), {
          route,
          timestamp: Date.now(),
          expiresAt: Date.now() + CACHE_DURATION
        });
      });
      
      return validRoutes;
    } catch (error) {
      console.error('Error fetching routes:', error);
      throw error;
    }
  }, [providers]);
  
  // Fetch and score routes when parameters change
  const { data: routes, isLoading: isRoutesLoading, error: routesError, refetch } = useQuery({
    queryKey: ['bridgeRoutes', sourceChain, destChain, token, amount],
    queryFn: async () => {
      if (!sourceChain || !destChain || !token || !amount) {
        return [];
      }
      
      const userAddress = '0x'; // This would come from wallet connection
      
      const routes = await fetchRoutes({
        srcChain: sourceChain,
        dstChain: destChain,
        token,
        amount,
        userAddress
      });
      
      // Score the routes
      const scoredRoutes = scoreRoutes(routes);
      
      // Sort by total score (highest first)
      return scoredRoutes.sort((a, b) => b.totalScore - a.totalScore);
    },
    enabled: Boolean(sourceChain && destChain && token && amount),
    retry: 2,
    staleTime: CACHE_DURATION
  });
  
  // Update available routes in store when routes change
  useEffect(() => {
    if (routes?.length) {
      setAvailableRoutes(routes.map(score => score.route));
      
      // Auto-select the best route if none is selected
      if (!selectedRoute && routes.length > 0) {
        setSelectedRoute(routes[0].route);
      }
    }
  }, [routes, setAvailableRoutes, selectedRoute, setSelectedRoute]);
  
  // Execute bridge transaction
  const bridgeMutation = useMutation({
    mutationFn: async (route: BridgeRoute): Promise<BridgeTransaction> => {
      try {
        // Set bridge status to pending
        setBridgeStatus('pending');
        
        // Get user wallet address
        const { address } = useWallet();
        
        if (!address) {
          throw new Error('Wallet not connected');
        }
        
        // Call our bridge API to execute the transaction with gas abstraction
        const response = await fetch('/api/bridge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceChain: route.srcChain,
            destinationChain: route.dstChain,
            token: route.token,
            amount: route.amount,
            walletAddress: address,
            slippage: 0.5 // Default slippage
          }),
        });
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to execute bridge transaction');
        }
        
        // Return transaction data
        const transaction: BridgeTransaction = {
          success: true,
          transactionHash: data.transactionHash,
          provider: route.provider,
          receipt: {} as any // We don't have a receipt yet
        };
        
        return transaction;
      } catch (error) {
        console.error('Error executing bridge transaction:', error);
        setBridgeStatus('failed');
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(errorMessage);
        throw error;
      }
    },
    onSuccess: () => {
      setBridgeStatus('completed');
    },
    onError: (error: Error) => {
      setBridgeStatus('failed');
      setError(error.message);
    }
  });
  
  // Execute bridge with the selected route
  const executeBridge = useCallback(() => {
    if (!selectedRoute) {
      setError('No route selected');
      return;
    }
    
    bridgeMutation.mutate(selectedRoute);
  }, [selectedRoute, bridgeMutation, setError]);
  
  return {
    fetchRoutes,
    isLoading: isRoutesLoading || bridgeMutation.isPending,
    error: routesError || bridgeMutation.error,
    routes: routes?.map(score => score.route) || [],
    scoredRoutes: routes || [],
    executeBridge,
    bridgeStatus,
    refetchRoutes: refetch
  };
} 