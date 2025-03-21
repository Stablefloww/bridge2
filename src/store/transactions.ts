import { create } from 'zustand'

interface TransactionState {
  transactions: Record<string, BridgeTransaction>
  addTransaction: (tx: BridgeTransaction) => void
  updateStatus: (hash: string, status: TransactionStatus) => void
  getRecoveryOptions: (hash: string) => TransactionRecovery[]
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: {},
  
  addTransaction: (tx) => set((state) => ({
    transactions: { ...state.transactions, [tx.hash]: tx }
  })),
  
  updateStatus: (hash, status) => set((state) => ({
    transactions: {
      ...state.transactions,
      [hash]: { ...state.transactions[hash], status }
    }
  })),
  
  getRecoveryOptions: (hash) => {
    const tx = useTransactionStore.getState().transactions[hash]
    if (!tx) return []
    
    return [
      { label: 'Retry with higher gas', action: () => retryTransaction(tx) },
      { label: 'Cancel transaction', action: () => cancelTransaction(tx) }
    ]
  }
})) 