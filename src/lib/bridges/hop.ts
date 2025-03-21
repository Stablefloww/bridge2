import { ethers } from 'ethers';

// Define Hop chain IDs
export const HopChainIds = {
  BASE: 8453,
  ETHEREUM: 1,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  POLYGON: 137,
  ZKSYNC: 324,
  LINEA: 59144,
  SCROLL: 534352
};

// Define Hop supported tokens with their addresses on different chains
export const HopTokenAddresses: Record<string, Record<number, string>> = {
  USDC: {
    [HopChainIds.BASE]: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
    [HopChainIds.ETHEREUM]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    [HopChainIds.ARBITRUM]: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
    [HopChainIds.OPTIMISM]: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
    [HopChainIds.POLYGON]: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    [HopChainIds.ZKSYNC]: '0x3355df6d4c9c3035724fd0e3914de96a5a83aaf4',
    [HopChainIds.LINEA]: '0x176211869ca2b568f2a7d4ee941e073a821ee1ff',
    [HopChainIds.SCROLL]: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4'
  },
  USDT: {
    [HopChainIds.BASE]: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    [HopChainIds.ETHEREUM]: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    [HopChainIds.ARBITRUM]: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    [HopChainIds.OPTIMISM]: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    [HopChainIds.POLYGON]: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    [HopChainIds.ZKSYNC]: '0x493257fd37edb34451f62edf8d2a0c418852ba4c',
    [HopChainIds.LINEA]: '0xa219439258ca9da29e9cc4ce5596924745e12b93',
    [HopChainIds.SCROLL]: '0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df'
  },
  ETH: {
    [HopChainIds.BASE]: '0x0000000000000000000000000000000000000000',
    [HopChainIds.ETHEREUM]: '0x0000000000000000000000000000000000000000',
    [HopChainIds.ARBITRUM]: '0x0000000000000000000000000000000000000000',
    [HopChainIds.OPTIMISM]: '0x0000000000000000000000000000000000000000',
    [HopChainIds.ZKSYNC]: '0x0000000000000000000000000000000000000000',
    [HopChainIds.LINEA]: '0x0000000000000000000000000000000000000000',
    [HopChainIds.SCROLL]: '0x0000000000000000000000000000000000000000'
  }
};

// Hop Bridge addresses per chain and token
export const HopBridgeAddresses: Record<string, Record<number, string>> = {
  USDC: {
    [HopChainIds.BASE]: '0x10b3a1aA4b7d56F7469A68eF5eB596B431c7cDB7',
    [HopChainIds.ETHEREUM]: '0x3666f603Cc164936C1b87e207F36BEBa4AC5f18a',
    [HopChainIds.ARBITRUM]: '0x10b3a1aA4b7d56F7469A68eF5eB596B431c7cDB7',
    [HopChainIds.OPTIMISM]: '0x10b3a1aA4b7d56F7469A68eF5eB596B431c7cDB7',
    [HopChainIds.POLYGON]: '0x10b3a1aA4b7d56F7469A68eF5eB596B431c7cDB7'
  },
  USDT: {
    [HopChainIds.BASE]: '0x2057d7007D1f1d93a327C3214447Dd7868FA0C30',
    [HopChainIds.ETHEREUM]: '0x3E4a3a4796d16c0Cd582C382691998f7c06420B6',
    [HopChainIds.ARBITRUM]: '0x2057d7007D1f1d93a327C3214447Dd7868FA0C30',
    [HopChainIds.OPTIMISM]: '0x2057d7007D1f1d93a327C3214447Dd7868FA0C30',
    [HopChainIds.POLYGON]: '0x2057d7007D1f1d93a327C3214447Dd7868FA0C30'
  },
  ETH: {
    [HopChainIds.BASE]: '0xb8901acB165ed027E32754E0FFe830802919727f',
    [HopChainIds.ETHEREUM]: '0xb8901acB165ed027E32754E0FFe830802919727f',
    [HopChainIds.ARBITRUM]: '0xb8901acB165ed027E32754E0FFe830802919727f',
    [HopChainIds.OPTIMISM]: '0xb8901acB165ed027E32754E0FFe830802919727f',
    [HopChainIds.ZKSYNC]: '0xb8901acB165ed027E32754E0FFe830802919727f',
    [HopChainIds.LINEA]: '0xb8901acB165ed027E32754E0FFe830802919727f',
    [HopChainIds.SCROLL]: '0xb8901acB165ed027E32754E0FFe830802919727f'
  }
};

// ABI for Hop Bridge
export const HopBridgeABI = [
  "function sendToL2(uint256 chainId, address recipient, uint256 amount, uint256 amountOutMin, uint256 deadline, address relayer, uint256 relayerFee) external",
  "function swapAndSend(uint256 chainId, address recipient, uint256 amount, uint256 bonderFee, uint256 amountOutMin, uint256 deadline, uint256 destinationAmountOutMin, uint256 destinationDeadline) external payable",
  "function estimateSendFee(uint256 chainId, address recipient, uint256 amount) external view returns (uint256)"
];

// Normalize chain names to Hop chain IDs
export function getHopChainId(chainName: string): number | null {
  const normalized = chainName.toLowerCase();
  
  if (normalized === 'base') return HopChainIds.BASE;
  if (normalized === 'ethereum' || normalized === 'eth') return HopChainIds.ETHEREUM;
  if (normalized === 'arbitrum' || normalized === 'arb') return HopChainIds.ARBITRUM;
  if (normalized === 'optimism' || normalized === 'op') return HopChainIds.OPTIMISM;
  if (normalized === 'polygon' || normalized === 'poly' || normalized === 'matic') return HopChainIds.POLYGON;
  if (normalized === 'zksync' || normalized === 'zk') return HopChainIds.ZKSYNC;
  if (normalized === 'linea') return HopChainIds.LINEA;
  if (normalized === 'scroll') return HopChainIds.SCROLL;
  
  return null;
}

// Interface for Hop bridge parameters
export interface HopBridgeParams {
  srcChainId: number;
  dstChainId: number;
  token: string;
  amount: ethers.BigNumber;
  recipient: string;
  slippage?: number;
}

// Hop bridge client
export class HopClient {
  private signer: ethers.Signer;
  private srcChainId: number;
  
  constructor(signer: ethers.Signer, srcChainId: number) {
    this.signer = signer;
    this.srcChainId = srcChainId;
  }
  
  // Calculate minimum amount based on slippage
  private calculateMinAmount(amount: ethers.BigNumber, slippage: number = 0.5): ethers.BigNumber {
    // Convert slippage from percentage to decimal (e.g., 0.5% -> 0.005)
    const slippageDecimal = slippage / 100;
    // Calculate minimum amount: amount * (1 - slippage)
    return amount.mul(ethers.BigNumber.from(10000).sub(slippageDecimal * 10000)).div(10000);
  }
  
  // Get bridge contract instance
  private getBridgeContract(token: string): ethers.Contract {
    const tokenUpper = token.toUpperCase();
    const bridgeAddresses = HopBridgeAddresses[tokenUpper];
    
    if (!bridgeAddresses) {
      throw new Error(`Bridge addresses not found for token ${token}`);
    }
    
    const bridgeAddress = bridgeAddresses[this.srcChainId];
    if (!bridgeAddress) {
      throw new Error(`Bridge address not found for token ${token} on chain ID ${this.srcChainId}`);
    }
    
    return new ethers.Contract(bridgeAddress, HopBridgeABI, this.signer);
  }
  
  // Get token address on a specific chain
  public getTokenAddress(token: string, chainId: number): string {
    const tokenAddresses = HopTokenAddresses[token.toUpperCase()];
    if (!tokenAddresses) {
      throw new Error(`Token ${token} not supported`);
    }
    
    const address = tokenAddresses[chainId];
    if (!address) {
      throw new Error(`Token ${token} not available on chain ID ${chainId}`);
    }
    
    return address;
  }
  
  // Estimate fees for the bridge transaction
  public async estimateFees(params: HopBridgeParams): Promise<ethers.BigNumber> {
    try {
      const bridge = this.getBridgeContract(params.token);
      
      // Estimate send fee
      const fee = await bridge.estimateSendFee(
        params.dstChainId,
        params.recipient,
        params.amount
      );
      
      return fee;
    } catch (error) {
      console.error('Error estimating fees:', error);
      throw new Error('Failed to estimate fees');
    }
  }
  
  // Execute the bridge transaction
  public async bridgeTokens(params: HopBridgeParams): Promise<ethers.providers.TransactionResponse> {
    try {
      const bridge = this.getBridgeContract(params.token);
      const minAmount = this.calculateMinAmount(params.amount, params.slippage);
      
      // Current timestamp + 20 minutes for deadline
      const deadline = Math.floor(Date.now() / 1000) + 20 * 60;
      
      if (params.token.toUpperCase() === 'ETH') {
        // For ETH, use swapAndSend with ETH value
        const fee = await this.estimateFees(params);
        
        return await bridge.swapAndSend(
          params.dstChainId,
          params.recipient,
          params.amount,
          ethers.constants.Zero, // bonderFee
          minAmount,
          deadline,
          minAmount, // destinationAmountOutMin
          deadline, // destinationDeadline
          { value: params.amount.add(fee) }
        );
      } else {
        // For other tokens, use sendToL2
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