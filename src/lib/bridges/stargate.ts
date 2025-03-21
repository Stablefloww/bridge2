import { ethers } from 'ethers';

// Define Stargate chain IDs
export const StargateChainIds = {
  BASE: 184,
  ETHEREUM: 101,
  ARBITRUM: 110,
  OPTIMISM: 111,
  POLYGON: 109,
  AVALANCHE: 106,
  BSC: 102,
  ZKSYNC: 195,
  LINEA: 183,
  SCROLL: 196
};

// Define Stargate pool IDs for different tokens
export const StargatePoolIds: Record<string, Record<number, number>> = {
  USDC: {
    [StargateChainIds.BASE]: 1,
    [StargateChainIds.ETHEREUM]: 1,
    [StargateChainIds.ARBITRUM]: 1,
    [StargateChainIds.OPTIMISM]: 1,
    [StargateChainIds.POLYGON]: 1
  },
  USDT: {
    [StargateChainIds.BASE]: 2,
    [StargateChainIds.ETHEREUM]: 2,
    [StargateChainIds.ARBITRUM]: 2,
    [StargateChainIds.OPTIMISM]: 2,
    [StargateChainIds.POLYGON]: 2
  },
  ETH: {
    [StargateChainIds.BASE]: 13,
    [StargateChainIds.ETHEREUM]: 13,
    [StargateChainIds.ARBITRUM]: 13,
    [StargateChainIds.OPTIMISM]: 13,
    [StargateChainIds.LINEA]: 13
  }
};

// Define Stargate supported tokens with their addresses on different chains
export const StargateTokenAddresses: Record<string, Record<number, string>> = {
  USDC: {
    [StargateChainIds.BASE]: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
    [StargateChainIds.ETHEREUM]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    [StargateChainIds.ARBITRUM]: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    [StargateChainIds.OPTIMISM]: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
    [StargateChainIds.POLYGON]: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    [StargateChainIds.AVALANCHE]: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    [StargateChainIds.BSC]: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    [StargateChainIds.ZKSYNC]: '0x3355df6d4c9c3035724fd0e3914de96a5a83aaf4',
    [StargateChainIds.LINEA]: '0x176211869ca2b568f2a7d4ee941e073a821ee1ff',
    [StargateChainIds.SCROLL]: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4'
  },
  USDT: {
    [StargateChainIds.BASE]: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    [StargateChainIds.ETHEREUM]: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    [StargateChainIds.ARBITRUM]: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    [StargateChainIds.OPTIMISM]: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    [StargateChainIds.POLYGON]: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    [StargateChainIds.AVALANCHE]: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
    [StargateChainIds.BSC]: '0x55d398326f99059fF775485246999027B3197955',
    [StargateChainIds.ZKSYNC]: '0x493257fd37edb34451f62edf8d2a0c418852ba4c',
    [StargateChainIds.LINEA]: '0xa219439258ca9da29e9cc4ce5596924745e12b93',
    [StargateChainIds.SCROLL]: '0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df'
  },
  ETH: {
    [StargateChainIds.BASE]: ethers.ZeroAddress,
    [StargateChainIds.ETHEREUM]: ethers.ZeroAddress,
    [StargateChainIds.ARBITRUM]: ethers.ZeroAddress,
    [StargateChainIds.OPTIMISM]: ethers.ZeroAddress,
    [StargateChainIds.LINEA]: ethers.ZeroAddress,
    [StargateChainIds.ZKSYNC]: ethers.ZeroAddress,
    [StargateChainIds.SCROLL]: ethers.ZeroAddress
  }
};

// Stargate Router addresses per chain
export const StargateRouterAddresses: Record<number, string> = {
  [StargateChainIds.BASE]: '0x45f1a95a4d3f3836523f5c83673c797f4d4d263b',
  [StargateChainIds.ETHEREUM]: '0x8731d54E9D02c286767d56ac03e8037C07e01e98',
  [StargateChainIds.ARBITRUM]: '0x53Bf833A5d6c4ddA888F69c22C88C9f356a41614',
  [StargateChainIds.OPTIMISM]: '0xB0D502E938ed5f4df2E681fE6E419ff29631d62b',
  [StargateChainIds.POLYGON]: '0x45A01E4e04F14f7A4a6702c74187c5F6222033cd',
  [StargateChainIds.AVALANCHE]: '0x45A01E4e04F14f7A4a6702c74187c5F6222033cd',
  [StargateChainIds.BSC]: '0x4a364f8c717cAAD9A442737Eb7b8A55cc6cf18D8',
  [StargateChainIds.ZKSYNC]: '0xdD9f477fFeE29851c054619e7019f06BB11e64d7',
  [StargateChainIds.LINEA]: '0x2f6f07cdcf3588944bf4c42ac74ff24bf56e7590',
  [StargateChainIds.SCROLL]: '0xE3b3a464ee575E8E25D2508918383b89c832f275'
};

// ERC20 ABI for token approvals
export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

// ABI for Stargate Router
export const StargateRouterABI = [
  "function swap(uint16 _dstChainId, uint256 _srcPoolId, uint256 _dstPoolId, address payable _refundAddress, uint256 _amountLD, uint256 _minAmountLD, (uint256, uint256) lzTxParams, bytes calldata _to, bytes calldata _payload) external payable",
  "function swapETH(uint16 _dstChainId, address payable _refundAddress, bytes calldata _toAddress, uint256 _amountLD, uint256 _minAmountLD) external payable",
  "function quoteLayerZeroFee(uint16 _dstChainId, uint8 _functionType, bytes calldata _toAddress, bytes calldata _transferAndCallPayload, (uint256, uint256) lzTxParams) external view returns (uint256, uint256)"
];

// Normalize chain names to Stargate chain IDs
export function getStargateChainId(chainName: string): number | null {
  const normalized = chainName.toLowerCase();
  
  if (normalized === 'base') return StargateChainIds.BASE;
  if (normalized === 'ethereum' || normalized === 'eth') return StargateChainIds.ETHEREUM;
  if (normalized === 'arbitrum' || normalized === 'arb') return StargateChainIds.ARBITRUM;
  if (normalized === 'optimism' || normalized === 'op') return StargateChainIds.OPTIMISM;
  if (normalized === 'polygon' || normalized === 'poly' || normalized === 'matic') return StargateChainIds.POLYGON;
  if (normalized === 'avalanche' || normalized === 'avax') return StargateChainIds.AVALANCHE;
  if (normalized === 'bnbchain' || normalized === 'bsc' || normalized === 'binance') return StargateChainIds.BSC;
  if (normalized === 'zksync' || normalized === 'zk') return StargateChainIds.ZKSYNC;
  if (normalized === 'linea') return StargateChainIds.LINEA;
  if (normalized === 'scroll') return StargateChainIds.SCROLL;
  
  return null;
}

// Get Stargate pool ID for a token on a specific chain
export function getStargatePoolId(token: string, chainId: number): number | null {
  const poolIds = StargatePoolIds[token.toUpperCase()];
  if (!poolIds) return null;
  return poolIds[chainId] || null;
}

// Interface for Stargate bridge parameters
export interface StargateSwapParams {
  srcChainId: number;
  dstChainId: number;
  srcToken: string;
  dstToken: string;
  amount: bigint;
  minAmount: bigint;
  destinationAddress: string;
  slippage?: number;
}

// Stargate bridge client
export class StargateClient {
  private signer: ethers.Signer;
  private srcChainId: number;
  
  constructor(signer: ethers.Signer, srcChainId: number) {
    this.signer = signer;
    this.srcChainId = srcChainId;
  }
  
  // Calculate minimum amount based on slippage
  public calculateMinAmount(amount: bigint, slippage: number = 0.5): bigint {
    // Convert slippage from percentage to decimal (e.g., 0.5% -> 0.005)
    const slippageDecimal = slippage / 100;
    // Calculate minimum amount: amount * (1 - slippage)
    const slippageAmount = (amount * BigInt(Math.floor(slippageDecimal * 10000))) / BigInt(10000);
    return amount - slippageAmount;
  }
  
  // Get router contract instance
  public getRouterContract(): ethers.Contract {
    const routerAddress = StargateRouterAddresses[this.srcChainId];
    if (!routerAddress) {
      throw new Error(`Router address not found for chain ID ${this.srcChainId}`);
    }
    
    return new ethers.Contract(routerAddress, StargateRouterABI, this.signer);
  }
  
  // Get token contract instance
  private getTokenContract(tokenAddress: string): ethers.Contract {
    return new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
  }
  
  // Get token address on a specific chain
  public getTokenAddress(token: string, chainId: number): string {
    const tokenAddresses = StargateTokenAddresses[token.toUpperCase()];
    if (!tokenAddresses) {
      throw new Error(`Token ${token} not supported`);
    }
    
    const address = tokenAddresses[chainId];
    if (!address) {
      throw new Error(`Token ${token} not available on chain ID ${chainId}`);
    }
    
    return address;
  }
  
  // Check token approval and approve if needed
  private async checkAndApproveToken(
    tokenAddress: string, 
    spenderAddress: string, 
    amount: bigint
  ): Promise<boolean> {
    if (tokenAddress === ethers.ZeroAddress) {
      return true; // ETH doesn't need approval
    }
    
    const tokenContract = this.getTokenContract(tokenAddress);
    const signerAddress = await this.signer.getAddress();
    
    const allowance = await tokenContract.allowance(signerAddress, spenderAddress);
    
    if (allowance < amount) {
      const approveTx = await tokenContract.approve(spenderAddress, amount);
      await approveTx.wait();
    }
    
    return true;
  }
  
  // Estimate gas fees for the bridge transaction
  public async estimateGasFees(params: StargateSwapParams): Promise<bigint> {
    try {
      const router = this.getRouterContract();
      
      // If token is ETH, use swapETH method
      if (params.srcToken.toUpperCase() === 'ETH') {
        const toAddressBytes = ethers.solidityPacked(['address'], [params.destinationAddress]);
        
        const [estimatedFee] = await router.quoteLayerZeroFee(
          params.dstChainId,
          1, // _functionType for swapETH
          toAddressBytes,
          '0x', // empty payload
          [0, 0] // lzTxParams, default value
        );
        
        return estimatedFee;
      } else {
        // For other tokens, use regular swap method
        const srcPoolId = getStargatePoolId(params.srcToken, params.srcChainId);
        const dstPoolId = getStargatePoolId(params.dstToken, params.dstChainId);
        
        if (!srcPoolId || !dstPoolId) {
          throw new Error(`Pool ID not found for ${params.srcToken} on chain ${params.srcChainId} or ${params.dstToken} on chain ${params.dstChainId}`);
        }
        
        const toAddressBytes = ethers.solidityPacked(['address'], [params.destinationAddress]);
        
        const [estimatedFee] = await router.quoteLayerZeroFee(
          params.dstChainId,
          1, // _functionType for swap
          toAddressBytes,
          '0x', // empty payload
          [0, 0] // lzTxParams, default value
        );
        
        return estimatedFee;
      }
    } catch (error) {
      console.error('Error estimating gas fees:', error);
      throw new Error('Failed to estimate gas fees');
    }
  }
  
  // Execute the bridge transaction
  public async bridgeTokens(params: StargateSwapParams): Promise<ethers.TransactionResponse> {
    try {
      const router = this.getRouterContract();
      const minAmount = params.minAmount || this.calculateMinAmount(params.amount, params.slippage);
      
      // If token is ETH, use swapETH method
      if (params.srcToken.toUpperCase() === 'ETH') {
        const toAddressBytes = ethers.solidityPacked(['address'], [params.destinationAddress]);
        const estimatedFee = await this.estimateGasFees(params);
        
        return await router.swapETH(
          params.dstChainId,
          params.destinationAddress, // refund address
          toAddressBytes,
          params.amount,
          minAmount,
          { value: params.amount + estimatedFee }
        );
      } else {
        // For ERC20 tokens, use regular swap method
        const srcPoolId = getStargatePoolId(params.srcToken, params.srcChainId);
        const dstPoolId = getStargatePoolId(params.dstToken, params.dstChainId);
        
        if (!srcPoolId || !dstPoolId) {
          throw new Error(`Pool ID not found for ${params.srcToken} on chain ${params.srcChainId} or ${params.dstToken} on chain ${params.dstChainId}`);
        }
        
        const tokenAddress = this.getTokenAddress(params.srcToken, params.srcChainId);
        const routerAddress = StargateRouterAddresses[params.srcChainId];
        
        // Approve the token if needed
        await this.checkAndApproveToken(tokenAddress, routerAddress, params.amount);
        
        const toAddressBytes = ethers.solidityPacked(['address'], [params.destinationAddress]);
        const estimatedFee = await this.estimateGasFees(params);
        
        return await router.swap(
          params.dstChainId,
          srcPoolId,
          dstPoolId,
          params.destinationAddress, // refund address
          params.amount,
          minAmount,
          [0, 0], // lzTxParams, default value
          toAddressBytes,
          '0x', // empty payload
          { value: estimatedFee }
        );
      }
    } catch (error) {
      console.error('Error bridging tokens:', error);
      throw new Error('Failed to execute bridge transaction');
    }
  }
} 