import { ethers } from 'ethers';
import { StargateClient, getStargateChainId } from './stargate';
import { HopClient, getHopChainId } from './hop';
import { AcrossClient, getAcrossChainId } from './across';
import type { BridgeProvider, BridgeRoute, BridgeRouteParams, BridgeTransaction, BridgeExecuteParams } from './types';

// Create a Stargate bridge provider that implements the BridgeProvider interface
class StargateProvider implements BridgeProvider {
  name = 'Stargate';
  
  async getRoute(params: BridgeRouteParams): Promise<BridgeRoute> {
    try {
      // Create a dummy provider just for route calculation
      const provider = new ethers.JsonRpcProvider();
      const signer = provider.getSigner();
      
      // Convert string chain names to Stargate chain IDs
      const srcChainId = getStargateChainId(params.srcChain);
      const dstChainId = getStargateChainId(params.dstChain);
      
      if (!srcChainId || !dstChainId) {
        throw new Error(`Unsupported chain: ${!srcChainId ? params.srcChain : params.dstChain}`);
      }
      
      const client = new StargateClient(signer, srcChainId);
      
      // Get token addresses
      const srcTokenAddress = client.getTokenAddress(params.token, srcChainId);
      const dstTokenAddress = client.getTokenAddress(params.token, dstChainId);
      
      // Convert amount to BigNumber
      const amountBN = ethers.parseUnits(params.amount, 18); // Assuming 18 decimals
      
      // Estimate gas fees
      const gasFeeBN = await client.estimateGasFees({
        srcChainId,
        dstChainId,
        srcToken: params.token,
        dstToken: params.token,
        amount: amountBN,
        minAmount: ethers.ZeroAddress,
        destinationAddress: params.userAddress
      });
      
      // Generate route
      return {
        provider: this.name,
        srcChain: params.srcChain,
        dstChain: params.dstChain,
        token: params.token,
        amount: params.amount,
        estimatedGasFee: ethers.formatEther(gasFeeBN),
        bridgeFee: ethers.formatUnits(amountBN * BigInt(5) / BigInt(1000), 18), // 0.5% fee
        estimatedTime: this.getEstimatedTime(params.srcChain, params.dstChain),
        route: {
          srcTokenAddress,
          dstTokenAddress,
          srcChainId,
          dstChainId
        },
        rawData: {
          provider: 'stargate',
          params: {
            srcChainId,
            dstChainId,
            token: params.token
          }
        }
      };
    } catch (error) {
      console.error('Error getting Stargate route:', error);
      throw error;
    }
  }
  
  async executeBridge(params: BridgeExecuteParams): Promise<BridgeTransaction> {
    try {
      const { signer, route } = params;
      
      // In a real implementation, this would use the route data to execute the bridge
      // For now, just return a mock transaction
      return {
        success: true,
        transactionHash: '0x' + Math.random().toString(16).slice(2),
        provider: this.name
      };
    } catch (error) {
      console.error('Error executing Stargate bridge:', error);
      return {
        success: false,
        provider: this.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  supportsRoute(srcChain: string, dstChain: string, token: string): boolean {
    const srcChainId = getStargateChainId(srcChain);
    const dstChainId = getStargateChainId(dstChain);
    
    // Check if both chains are supported
    if (!srcChainId || !dstChainId) {
      return false;
    }
    
    // Check if token is supported (simplified check)
    const supportedTokens = ['ETH', 'USDC', 'USDT'];
    return supportedTokens.includes(token.toUpperCase());
  }
  
  getEstimatedTime(srcChain: string, dstChain: string): number {
    // Estimate time in minutes based on chain pair
    // These are rough estimates
    const timeMap: Record<string, number> = {
      'ethereum-arbitrum': 10,
      'ethereum-optimism': 10,
      'ethereum-base': 15,
      'base-ethereum': 15,
      'arbitrum-ethereum': 10,
      'optimism-ethereum': 10
    };
    
    const key = `${srcChain.toLowerCase()}-${dstChain.toLowerCase()}`;
    return timeMap[key] || 20; // Default to 20 minutes
  }
}

// Create a Hop bridge provider that implements the BridgeProvider interface
class HopProvider implements BridgeProvider {
  name = 'Hop';
  
  async getRoute(params: BridgeRouteParams): Promise<BridgeRoute> {
    try {
      // Create a dummy provider just for route calculation
      const provider = new ethers.providers.JsonRpcProvider();
      const signer = provider.getSigner();
      
      // Convert string chain names to Hop chain IDs
      const srcChainId = getHopChainId(params.srcChain);
      const dstChainId = getHopChainId(params.dstChain);
      
      if (!srcChainId || !dstChainId) {
        throw new Error(`Unsupported chain: ${!srcChainId ? params.srcChain : params.dstChain}`);
      }
      
      const client = new HopClient(signer, srcChainId);
      
      // Get token addresses
      const srcTokenAddress = client.getTokenAddress(params.token, srcChainId);
      const dstTokenAddress = client.getTokenAddress(params.token, dstChainId);
      
      // Convert amount to BigNumber
      const amountBN = ethers.utils.parseUnits(params.amount, 18); // Assuming 18 decimals
      
      // Estimate gas fees
      const gasFeeBN = await client.estimateFees({
        srcChainId,
        dstChainId,
        token: params.token,
        amount: amountBN,
        recipient: params.userAddress
      });
      
      // Generate route
      return {
        provider: this.name,
        srcChain: params.srcChain,
        dstChain: params.dstChain,
        token: params.token,
        amount: params.amount,
        estimatedGasFee: ethers.utils.formatEther(gasFeeBN),
        bridgeFee: ethers.utils.formatUnits(amountBN.mul(4).div(1000), 18), // 0.4% fee
        estimatedTime: this.getEstimatedTime(params.srcChain, params.dstChain),
        route: {
          srcTokenAddress,
          dstTokenAddress,
          srcChainId,
          dstChainId
        },
        rawData: {
          provider: 'hop',
          params: {
            srcChainId,
            dstChainId,
            token: params.token
          }
        }
      };
    } catch (error) {
      console.error('Error getting Hop route:', error);
      throw error;
    }
  }
  
  async executeBridge(params: BridgeExecuteParams): Promise<BridgeTransaction> {
    try {
      const { signer, route } = params;
      
      // In a real implementation, this would use the route data to execute the bridge
      // For now, just return a mock transaction
      return {
        success: true,
        transactionHash: '0x' + Math.random().toString(16).slice(2),
        provider: this.name
      };
    } catch (error) {
      console.error('Error executing Hop bridge:', error);
      return {
        success: false,
        provider: this.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  supportsRoute(srcChain: string, dstChain: string, token: string): boolean {
    const srcChainId = getHopChainId(srcChain);
    const dstChainId = getHopChainId(dstChain);
    
    // Check if both chains are supported
    if (!srcChainId || !dstChainId) {
      return false;
    }
    
    // Check if token is supported (simplified check)
    const supportedTokens = ['ETH', 'USDC', 'USDT'];
    return supportedTokens.includes(token.toUpperCase());
  }
  
  getEstimatedTime(srcChain: string, dstChain: string): number {
    // Estimate time in minutes based on chain pair
    const timeMap: Record<string, number> = {
      'ethereum-arbitrum': 12,
      'ethereum-optimism': 12,
      'ethereum-base': 18,
      'base-ethereum': 18,
      'arbitrum-ethereum': 12,
      'optimism-ethereum': 12
    };
    
    const key = `${srcChain.toLowerCase()}-${dstChain.toLowerCase()}`;
    return timeMap[key] || 25; // Default to 25 minutes
  }
}

// Create an Across bridge provider that implements the BridgeProvider interface
class AcrossProvider implements BridgeProvider {
  name = 'Across';
  
  async getRoute(params: BridgeRouteParams): Promise<BridgeRoute> {
    try {
      // Create a dummy provider just for route calculation
      const provider = new ethers.providers.JsonRpcProvider();
      const signer = provider.getSigner();
      
      // Convert string chain names to Across chain IDs
      const srcChainId = getAcrossChainId(params.srcChain);
      const dstChainId = getAcrossChainId(params.dstChain);
      
      if (!srcChainId || !dstChainId) {
        throw new Error(`Unsupported chain: ${!srcChainId ? params.srcChain : params.dstChain}`);
      }
      
      const client = new AcrossClient(signer, srcChainId);
      
      // Get token addresses
      const srcTokenAddress = client.getTokenAddress(params.token, srcChainId);
      const dstTokenAddress = client.getTokenAddress(params.token, dstChainId);
      
      // Convert amount to BigNumber
      const amountBN = ethers.utils.parseUnits(params.amount, 18); // Assuming 18 decimals
      
      // Estimate relayer fee
      const relayerFeeBN = await client.estimateRelayerFee({
        srcChainId,
        dstChainId,
        token: params.token,
        amount: amountBN,
        recipient: params.userAddress
      });
      
      // Generate route
      return {
        provider: this.name,
        srcChain: params.srcChain,
        dstChain: params.dstChain,
        token: params.token,
        amount: params.amount,
        estimatedGasFee: ethers.utils.formatEther(relayerFeeBN),
        bridgeFee: ethers.utils.formatUnits(amountBN.mul(3).div(1000), 18), // 0.3% fee
        estimatedTime: this.getEstimatedTime(params.srcChain, params.dstChain),
        route: {
          srcTokenAddress,
          dstTokenAddress,
          srcChainId,
          dstChainId
        },
        rawData: {
          provider: 'across',
          params: {
            srcChainId,
            dstChainId,
            token: params.token
          }
        }
      };
    } catch (error) {
      console.error('Error getting Across route:', error);
      throw error;
    }
  }
  
  async executeBridge(params: BridgeExecuteParams): Promise<BridgeTransaction> {
    try {
      const { signer, route } = params;
      
      // In a real implementation, this would use the route data to execute the bridge
      // For now, just return a mock transaction
      return {
        success: true,
        transactionHash: '0x' + Math.random().toString(16).slice(2),
        provider: this.name
      };
    } catch (error) {
      console.error('Error executing Across bridge:', error);
      return {
        success: false,
        provider: this.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  supportsRoute(srcChain: string, dstChain: string, token: string): boolean {
    const srcChainId = getAcrossChainId(srcChain);
    const dstChainId = getAcrossChainId(dstChain);
    
    // Check if both chains are supported
    if (!srcChainId || !dstChainId) {
      return false;
    }
    
    // Check if token is supported (simplified check)
    const supportedTokens = ['ETH', 'USDC', 'USDT'];
    return supportedTokens.includes(token.toUpperCase());
  }
  
  getEstimatedTime(srcChain: string, dstChain: string): number {
    return 15; // Most Across bridges take around 15 minutes
  }
}

// Export a function to get a Stargate client instance
export function getStargateClient(signer: ethers.Signer, chainId: number): StargateClient {
  return new StargateClient(signer, chainId);
}

// Export a function to get a Hop client instance
export function getHopClient(signer: ethers.Signer, chainId: number): HopClient {
  return new HopClient(signer, chainId);
}

// Export a function to get an Across client instance
export function getAcrossClient(signer: ethers.Signer, chainId: number): AcrossClient {
  return new AcrossClient(signer, chainId);
}

// Export a function to get all bridge providers
export function getBridgeProviders(): BridgeProvider[] {
  return [
    new StargateProvider()
  ];
} 