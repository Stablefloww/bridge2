import { useEffect } from 'react'
import { toast } from 'react-toastify'
import { useTransactionStore } from '@/store/transactions'

export const TransactionNotifications = () => {
  const transactions = useTransactionStore((state) => state.transactions)

  useEffect(() => {
    Object.values(transactions).forEach((tx) => {
      if (tx.status === 'pending' && !toast.isActive(tx.hash)) {
        toast.info(`Transaction pending: ${tx.hash}`, {
          toastId: tx.hash,
          autoClose: false
        })
      }
      
      if (tx.status === 'success') {
        toast.update(tx.hash, {
          render: `Transaction succeeded: ${tx.hash}`,
          type: 'success',
          autoClose: 5000
        })
      }
      
      if (tx.status === 'failed') {
        toast.update(tx.hash, {
          render: `Transaction failed: ${tx.hash}`,
          type: 'error',
          autoClose: 5000
        })
      }
    })
  }, [transactions])

  return null
} 