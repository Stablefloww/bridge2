export interface WalletInfo {
  address: string;
  chainId: number;
  isConnected: boolean;
  provider: any;
}

export interface TokenBalance {
  token: {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
  };
  balance: string;
  balanceUSD?: string;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  data: string;
  chainId: number;
  nonce: number;
  gasLimit: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  status?: 'pending' | 'success' | 'failed';
  timestamp?: number;
  blockNumber?: number;
}

export interface TransactionReceipt {
  transactionHash: string;
  blockNumber: number;
  blockHash: string;
  status: 'success' | 'failed';
  gasUsed: string;
  effectiveGasPrice: string;
  logs: any[];
}

export interface SigningRequest {
  type: 'transaction' | 'message';
  data: any;
  description: string;
}

export interface WalletState {
  address: string | null
  chainId: number | null
  balances: Record<string, string>
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  error?: string
  connect: (connector: any) => Promise<void>
  disconnect: () => void
  updateBalances: (balances: Record<string, string>) => void
  handleChainChanged: (chainId: number) => void
  handleAccountsChanged: (accounts: string[]) => void
  setAddress: (address: string) => void
}

export type ChainInfo = {
  id: number
  name: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls: string[]
  blockExplorers?: {
    name: string
    url: string
  }[]
} 