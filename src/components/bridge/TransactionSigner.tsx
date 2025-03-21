import { useSendTransaction, useAccount } from 'wagmi'
import { useWalletStore } from '@/store/wallet'
import { Button } from '@eth-optimism/ui-components'

export const TransactionSigner = ({ transaction }) => {
  const { address } = useAccount()
  const { data, isLoading, sendTransaction } = useSendTransaction()
  const [txHash, setTxHash] = useState<string>()

  const handleSign = async () => {
    if (!address) return
    
    try {
      const result = await sendTransaction({
        to: transaction.to,
        value: transaction.value,
        data: transaction.data,
        gas: transaction.gasLimit
      })
      
      setTxHash(result.hash)
      useWalletStore.getState().updateTxStatus('pending')
    } catch (error) {
      useWalletStore.getState().updateTxStatus('error', error.message)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <TransactionDetails transaction={transaction} />
      
      <Button 
        onClick={handleSign}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Signing...' : 'Confirm Transaction'}
      </Button>
      
      {txHash && (
        <div className="text-sm text-muted-foreground">
          Transaction Hash: {txHash}
        </div>
      )}
    </div>
  )
} 