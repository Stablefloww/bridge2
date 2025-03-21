import { ethers } from 'ethers'
import { useTransactionStore } from '@/store/transactions'

export const cancelTransaction = async (tx: BridgeTransaction) => {
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const signer = provider.getSigner()
  
  const cancelTx = await signer.sendTransaction({
    to: tx.from,
    value: 0,
    gasPrice: tx.gasPrice ? tx.gasPrice * 1.2 : undefined,
    nonce: tx.nonce
  })
  
  useTransactionStore.getState().updateStatus(tx.hash, 'cancelled')
  return cancelTx.hash
} 