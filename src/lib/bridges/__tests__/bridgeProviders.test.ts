/// <reference types="jest" />

import { StargateClient } from '../stargate';
import { HopClient } from '../hop';
import { AcrossClient } from '../across';
import { getBridgeProviders } from '../index';
import type { BridgeRouteParams } from '../types';

// Use jest.mock for ethers
jest.mock('ethers');

// Mock the clients to test fallback scenarios
jest.mock('../stargate', () => ({
  StargateClient: jest.fn().mockImplementation(() => ({
    getTokenAddress: jest.fn().mockReturnValue('0x1234567890123456789012345678901234567890'),
    estimateGasFees: jest.fn().mockResolvedValue(10000000000000000n),
    bridgeTokens: jest.fn().mockResolvedValue({ hash: '0x1234' })
  })),
  getStargateChainId: jest.fn().mockImplementation((chain) => {
    const chainMap: Record<string, number> = {
      base: 184,
      ethereum: 101,
      arbitrum: 110,
      optimism: 111
    };
    return chainMap[chain.toLowerCase()] || null;
  })
}));

jest.mock('../hop', () => ({
  HopClient: jest.fn().mockImplementation(() => ({
    getTokenAddress: jest.fn().mockReturnValue('0x1234567890123456789012345678901234567890'),
    estimateFees: jest.fn().mockResolvedValue(10000000000000000n),
    bridgeTokens: jest.fn().mockResolvedValue({ hash: '0x1234' })
  })),
  getHopChainId: jest.fn().mockImplementation((chain) => {
    const chainMap: Record<string, number> = {
      base: 8453,
      ethereum: 1,
      arbitrum: 42161,
      optimism: 10
    };
    return chainMap[chain.toLowerCase()] || null;
  })
}));

jest.mock('../across', () => ({
  AcrossClient: jest.fn().mockImplementation(() => ({
    getTokenAddress: jest.fn().mockReturnValue('0x1234567890123456789012345678901234567890'),
    estimateRelayerFee: jest.fn().mockResolvedValue(10000000000000000n),
    bridgeTokens: jest.fn().mockResolvedValue({ hash: '0x1234' })
  })),
  getAcrossChainId: jest.fn().mockImplementation((chain) => {
    const chainMap: Record<string, number> = {
      base: 8453,
      ethereum: 1,
      arbitrum: 42161,
      optimism: 10
    };
    return chainMap[chain.toLowerCase()] || null;
  })
}));

describe('Bridge Providers with Fallback', () => {
  const routeParams: BridgeRouteParams = {
    srcChain: 'base',
    dstChain: 'ethereum',
    token: 'ETH',
    amount: '0.1',
    userAddress: '0x1234567890123456789012345678901234567890',
    slippage: 0.5
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should fetch routes from all supported providers', async () => {
    const providers = getBridgeProviders();
    
    // Create route promises from all providers
    const routePromises = providers.map(provider => 
      provider.getRoute(routeParams)
    );
    
    // Resolve all route promises
    const routes = await Promise.all(routePromises);
    
    // Verify we got routes from all providers
    expect(routes.length).toBe(providers.length);
    expect(routes.some(route => route.provider === 'Stargate')).toBe(true);
    expect(routes.some(route => route.provider === 'Hop')).toBe(true);
    expect(routes.some(route => route.provider === 'Across')).toBe(true);
  });
  
  test('should handle provider failures and return valid routes from other providers', async () => {
    const providers = getBridgeProviders();
    
    // Mock one provider to fail
    const stargateProvider = providers.find(p => p.name === 'Stargate');
    jest.spyOn(stargateProvider!, 'getRoute').mockRejectedValue(new Error('Provider unavailable'));
    
    // Create route promises with fallback handling
    const routePromises = providers.map(provider => 
      provider.getRoute(routeParams).catch(error => {
        console.error(`Provider ${provider.name} failed:`, error);
        return null; // Return null for failed providers
      })
    );
    
    // Resolve all route promises
    const routes = await Promise.all(routePromises);
    
    // Filter out failed (null) routes
    const validRoutes = routes.filter(route => route !== null);
    
    // Verify fallback worked - we should have routes from the other providers
    expect(validRoutes.length).toBe(providers.length - 1);
    expect(validRoutes.some(route => route?.provider === 'Hop')).toBe(true);
    expect(validRoutes.some(route => route?.provider === 'Across')).toBe(true);
    expect(validRoutes.some(route => route?.provider === 'Stargate')).toBe(false);
  });
  
  test('should support dynamic provider selection based on availability', async () => {
    const providers = getBridgeProviders();
    
    // Mock all providers to fail except one
    const hopProvider = providers.find(p => p.name === 'Hop');
    const stargateProvider = providers.find(p => p.name === 'Stargate');
    const acrossProvider = providers.find(p => p.name === 'Across');
    
    jest.spyOn(stargateProvider!, 'getRoute').mockRejectedValue(new Error('Provider unavailable'));
    jest.spyOn(acrossProvider!, 'getRoute').mockRejectedValue(new Error('Provider unavailable'));
    
    // Create route promises with fallback handling
    const routePromises = providers.map(provider => 
      provider.getRoute(routeParams).catch(error => {
        console.error(`Provider ${provider.name} failed:`, error);
        return null;
      })
    );
    
    // Resolve all route promises
    const routes = await Promise.all(routePromises);
    
    // Filter out failed (null) routes
    const validRoutes = routes.filter(route => route !== null);
    
    // Verify fallback worked - we should have route only from Hop
    expect(validRoutes.length).toBe(1);
    expect(validRoutes[0]?.provider).toBe('Hop');
  });
  
  test('should retry fetching route from a provider on temporary failure', async () => {
    const providers = getBridgeProviders();
    const stargateProvider = providers.find(p => p.name === 'Stargate');
    
    // Mock Stargate to fail on first call but succeed on retry
    let callCount = 0;
    jest.spyOn(stargateProvider!, 'getRoute').mockImplementation(async (params) => {
      callCount++;
      if (callCount === 1) {
        throw new Error('Temporary failure');
      }
      // On retry, return a valid route
      return {
        provider: 'Stargate',
        srcChain: params.srcChain,
        dstChain: params.dstChain,
        token: params.token,
        amount: params.amount,
        estimatedGasFee: '0.01',
        bridgeFee: '0.005',
        estimatedTime: 15,
        route: {
          srcTokenAddress: '0x1234',
          dstTokenAddress: '0x5678',
          srcChainId: 184,
          dstChainId: 101
        }
      };
    });
    
    // First attempt fails
    await expect(stargateProvider!.getRoute(routeParams)).rejects.toThrow('Temporary failure');
    
    // Retry should succeed
    const route = await stargateProvider!.getRoute(routeParams);
    expect(route).not.toBeNull();
    expect(route.provider).toBe('Stargate');
    expect(callCount).toBe(2);
  });
}); 