import { useTransactionStore } from '@/store/transactions'

export const SecurityWarnings = ({ transaction }) => {
  const { simulations } = useTransactionStore()
  const simResult = simulations[transaction.hash]
  
  return (
    <div className="space-y-2 text-sm text-yellow-600">
      {simResult?.balanceChanges[transaction.to] && (
        <p>⚠️ This will modify your balance by {simResult.balanceChanges[transaction.to]}</p>
      )}
      
      {transaction.value > 1 && (
        <p>⚠️ Large transaction value detected ({transaction.value} ETH)</p>
      )}
      
      {simResult?.isContract && (
        <p>⚠️ Destination address is a smart contract</p>
      )}
    </div>
  )
} 