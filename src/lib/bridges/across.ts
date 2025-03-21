import { ethers } from 'ethers';

// Define Across chain IDs
export const AcrossChainIds = {
  BASE: 8453,
  ETHEREUM: 1,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  POLYGON: 137,
  ZKSYNC: 324,
  LINEA: 59144
};

// Define Across supported tokens with their addresses on different chains
export const AcrossTokenAddresses: Record<string, Record<number, string>> = {
  USDC: {
    [AcrossChainIds.BASE]: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
    [AcrossChainIds.ETHEREUM]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    [AcrossChainIds.ARBITRUM]: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    [AcrossChainIds.OPTIMISM]: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
    [AcrossChainIds.POLYGON]: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    [AcrossChainIds.ZKSYNC]: '0x3355df6d4c9c3035724fd0e3914de96a5a83aaf4',
    [AcrossChainIds.LINEA]: '0x176211869ca2b568f2a7d4ee941e073a821ee1ff'
  },
  USDT: {
    [AcrossChainIds.BASE]: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    [AcrossChainIds.ETHEREUM]: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    [AcrossChainIds.ARBITRUM]: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    [AcrossChainIds.OPTIMISM]: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    [AcrossChainIds.POLYGON]: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    [AcrossChainIds.ZKSYNC]: '0x493257fd37edb34451f62edf8d2a0c418852ba4c',
    [AcrossChainIds.LINEA]: '0xa219439258ca9da29e9cc4ce5596924745e12b93'
  },
  ETH: {
    [AcrossChainIds.BASE]: '0x0000000000000000000000000000000000000000',
    [AcrossChainIds.ETHEREUM]: '0x0000000000000000000000000000000000000000',
    [AcrossChainIds.ARBITRUM]: '0x0000000000000000000000000000000000000000',
    [AcrossChainIds.OPTIMISM]: '0x0000000000000000000000000000000000000000',
    [AcrossChainIds.ZKSYNC]: '0x0000000000000000000000000000000000000000',
    [AcrossChainIds.LINEA]: '0x0000000000000000000000000000000000000000'
  }
};

// Across Bridge addresses per chain
export const AcrossBridgeAddresses: Record<number, string> = {
  [AcrossChainIds.BASE]: '0xe35e9842fceaCA96570B734083f4a58e8F7C5f2A',
  [AcrossChainIds.ETHEREUM]: '0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5',
  [AcrossChainIds.ARBITRUM]: '0xB88690461dDbaB6f04Dfad7df66B7725942FEb9C',
  [AcrossChainIds.OPTIMISM]: '0x6f26Bf09B1C792e3228e5467807a900A503c0281',
  [AcrossChainIds.POLYGON]: '0x69B5c72837769eF1e7C164Abc6515DcFf217F920',
  [AcrossChainIds.ZKSYNC]: '0x4D9079dF4a54EB0E166F974227FEF9F3E52632dC',
  [AcrossChainIds.LINEA]: '0x6f26Bf09B1C792e3228e5467807a900A503c0281'
};

// ABI for Across Bridge
export const AcrossBridgeABI = [
  "function deposit(address recipient, address originToken, uint256 amount, uint256 destinationChainId, uint256 relayerFeePct, uint256 quoteTimestamp, bytes message) external payable",
  "function depositV3(address recipient, address originToken, uint256 amount, uint256 destinationChainId, uint256 exclusiveRelayer, uint256 quoteTimestamp, uint256 fillDeadline, uint256 exclusivityDeadline, bytes referrer, bytes message) external payable returns (uint256 depositId)",
  "function getChainId() external view returns (uint256)",
  "function quoteRelayerFee(address originToken, uint256 amount, uint256 destinationChainId) external view returns (uint256 relayerFee)"
];

// Normalize chain names to Across chain IDs
export function getAcrossChainId(chainName: string): number | null {
  const normalized = chainName.toLowerCase();
  
  if (normalized === 'base') return AcrossChainIds.BASE;
  if (normalized === 'ethereum' || normalized === 'eth') return AcrossChainIds.ETHEREUM;
  if (normalized === 'arbitrum' || normalized === 'arb') return AcrossChainIds.ARBITRUM;
  if (normalized === 'optimism' || normalized === 'op') return AcrossChainIds.OPTIMISM;
  if (normalized === 'polygon' || normalized === 'poly' || normalized === 'matic') return AcrossChainIds.POLYGON;
  if (normalized === 'zksync' || normalized === 'zk') return AcrossChainIds.ZKSYNC;
  if (normalized === 'linea') return AcrossChainIds.LINEA;
  
  return null;
}

// Interface for Across bridge parameters
export interface AcrossBridgeParams {
  srcChainId: number;
  dstChainId: number;
  token: string;
  amount: ethers.BigNumber;
  recipient: string;
  relayerFeePct?: number;
}

// Across bridge client
export class AcrossClient {
  private signer: ethers.Signer;
  private srcChainId: number;
  
  constructor(signer: ethers.Signer, srcChainId: number) {
    this.signer = signer;
    this.srcChainId = srcChainId;
  }
  
  // Get bridge contract instance
  private getBridgeContract(): ethers.Contract {
    const bridgeAddress = AcrossBridgeAddresses[this.srcChainId];
    if (!bridgeAddress) {
      throw new Error(`Bridge address not found for chain ID ${this.srcChainId}`);
    }
    
    return new ethers.Contract(bridgeAddress, AcrossBridgeABI, this.signer);
  }
  
  // Get token address on a specific chain
  public getTokenAddress(token: string, chainId: number): string {
    const tokenAddresses = AcrossTokenAddresses[token.toUpperCase()];
    if (!tokenAddresses) {
      throw new Error(`Token ${token} not supported by Across`);
    }
    
    const address = tokenAddresses[chainId];
    if (!address) {
      throw new Error(`Token ${token} not available on chain ID ${chainId} with Across`);
    }
    
    return address;
  }
  
  // Estimate fees for the bridge transaction
  public async estimateRelayerFee(params: AcrossBridgeParams): Promise<ethers.BigNumber> {
    try {
      const bridge = this.getBridgeContract();
      const tokenAddress = this.getTokenAddress(params.token, params.srcChainId);
      
      // Get relayer fee
      const relayerFee = await bridge.quoteRelayerFee(
        tokenAddress,
        params.amount,
        params.dstChainId
      );
      
      return relayerFee;
    } catch (error) {
      console.error('Error estimating relayer fee:', error);
      throw new Error('Failed to estimate relayer fee');
    }
  }
  
  // Estimate time for the bridge to complete
  public estimateBridgeTime(srcChainId: number, dstChainId: number): number {
    // Across typically has these time estimates (in minutes)
    const timeEstimates: Record<string, number> = {
      'ethereum-arbitrum': 15,
      'ethereum-optimism': 15,
      'ethereum-polygon': 30,
      'ethereum-base': 20,
      'arbitrum-ethereum': 15,
      'optimism-ethereum': 15,
      'polygon-ethereum': 30,
      'base-ethereum': 20,
      'default': 30 // Default estimate for any other pair
    };
    
    // Create a key to look up the time estimate
    const key1 = `${this.getChainName(srcChainId)}-${this.getChainName(dstChainId)}`;
    const key2 = `${this.getChainName(dstChainId)}-${this.getChainName(srcChainId)}`;
    
    return timeEstimates[key1] || timeEstimates[key2] || timeEstimates.default;
  }
  
  // Helper to get chain name from ID
  private getChainName(chainId: number): string {
    for (const [key, value] of Object.entries(AcrossChainIds)) {
      if (value === chainId) return key.toLowerCase();
    }
    return 'unknown';
  }
  
  // Execute the bridge transaction
  public async bridgeTokens(params: AcrossBridgeParams): Promise<ethers.providers.TransactionResponse> {
    try {
      const bridge = this.getBridgeContract();
      const tokenAddress = this.getTokenAddress(params.token, params.srcChainId);
      
      // Current timestamp for quote timestamp
      const quoteTimestamp = Math.floor(Date.now() / 1000);
      
      // Get relayer fee percent (basis points)
      const relayerFeePct = params.relayerFeePct ? 
        Math.floor(params.relayerFeePct * 100) :  // Convert percent to basis points
        0.1 * 100; // Default 0.1%
      
      if (params.token.toUpperCase() === 'ETH') {
        // For ETH, use deposit with ETH value
        return await bridge.deposit(
          params.recipient,
          tokenAddress,
          params.amount,
          params.dstChainId,
          relayerFeePct,
          quoteTimestamp,
          '0x', // Empty message
          { value: params.amount }
        );
      } else {
        // For other tokens, use deposit without ETH value
        // This would require approving the token first, which is not handled here
        // Additional implementation needed for ERC20 token approval
        throw new Error('ERC20 token bridging not implemented yet');
      }
    } catch (error) {
      console.error('Error bridging tokens:', error);
      throw new Error('Failed to execute bridge transaction');
    }
  }
} 