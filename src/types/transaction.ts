export type TransactionStatus = 'pending' | 'success' | 'failed'
export type TransactionRecovery = { label: string; action: () => void }

export interface BridgeTransaction {
  hash: string
  from: string
  to: string
  value: string
  gasLimit: number
  gasPrice?: number
  nonce?: number
  status: TransactionStatus
} 