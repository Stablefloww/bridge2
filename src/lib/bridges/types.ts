import { ethers } from 'ethers';

// Basic bridge provider interface
export interface BridgeProvider {
  // Provider name
  name: string;
  
  // Fetch route information
  getRoute(params: BridgeRouteParams): Promise<BridgeRoute>;
  
  // Execute bridge transaction
  executeBridge(params: BridgeExecuteParams): Promise<BridgeTransaction>;
  
  // Check if the provider supports a specific route
  supportsRoute(srcChain: string, dstChain: string, token: string): boolean;
  
  // Get estimated time for a bridge to complete (in minutes)
  getEstimatedTime(srcChain: string, dstChain: string): number;
}

// Parameters to fetch a route
export interface BridgeRouteParams {
  srcChain: string;
  dstChain: string;
  token: string;
  amount: string;
  userAddress: string;
  slippage?: number;
}

// Route information returned by bridge providers
export interface BridgeRoute {
  provider: string;
  srcChain: string;
  dstChain: string;
  token: string;
  amount: string;
  estimatedGasFee: string; // Gas fee in the source chain's native token
  bridgeFee: string;       // Fee charged by the bridge (in the token being bridged)
  estimatedTime: number;   // Estimated time in minutes
  route: {
    srcTokenAddress: string;
    dstTokenAddress: string;
    srcChainId: number;
    dstChainId: number;
  };
  rawData?: any;           // Provider-specific raw data
}

// Parameters to execute a bridge transaction
export interface BridgeExecuteParams {
  provider: string;
  signer: ethers.Signer;
  route: BridgeRoute;
  options?: {
    gasPrice?: string;
    gasLimit?: string;
    slippage?: number;
  };
}

// Bridge transaction result
export interface BridgeTransaction {
  success: boolean;
  transactionHash?: string;
  provider: string;
  error?: string;
  receipt?: ethers.providers.TransactionReceipt;
}

// Score factors for route selection
export interface RouteScore {
  provider: string;
  totalScore: number;
  fees: number;        // Score based on fees (0-10, lower is better)
  time: number;        // Score based on time (0-10, lower is better)
  reliability: number; // Score based on reliability (0-10, higher is better)
  liquidity: number;   // Score based on liquidity (0-10, higher is better)
}

// Cache interface for storing routes
export interface CachedRoute {
  route: BridgeRoute;
  timestamp: number;
  expiresAt: number;
} 