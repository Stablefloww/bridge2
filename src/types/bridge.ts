export interface Chain {
  id: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
    address: string;
  };
  logoUrl: string;
}

export interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  chainId: number;
  logoUrl: string;
}

export type BridgeRoute = {
  provider: 'stargate' | 'socket' | 'hyphen'
  sourceChain: string
  destChain: string
  amount: string
  fee: string
  estimatedTime: number
}

export type ChainInfo = {
  chainId: string
  name: string
  logo: string
  rpcUrl: string
  blockExplorer: string
}

export type SimulationResult = {
  success: boolean
  gasUsed: string
  error?: string
}

export interface BridgeStep {
  type: 'approve' | 'bridge' | 'claim';
  description: string;
  estimatedGas: string;
  data: any;
}

export type NLPResult = {
  originalCommand: string
  interpretedCommand: string
  confidence: number
  sourceChain?: string
  destinationChain?: string
  token?: string
  amount?: string
  missingFields: string[]
} 