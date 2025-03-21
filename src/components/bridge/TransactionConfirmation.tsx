import { useEffect, useState } from 'react'
import { useWalletStore } from '@/store/wallet'
import { Button } from '@eth-optimism/ui-components'
import { toast } from 'react-toastify'
import { initBiconomy } from '@/lib/biconomy/provider'
import { simulateTransaction } from '@/services/tenderly'
import { calculateSlippage } from '@/lib/security'

export const TransactionConfirmation = ({ transaction, onClose }) => {
  const [isLoading, setIsLoading] = useState(false)
  const { address } = useWalletStore()
  const [simulation, setSimulation] = useState<SimulationResult | null>(null)

  const handleConfirm = async () => {
    try {
      setIsLoading(true)
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const smartAccount = await initBiconomy(provider)
      
      const txResponse = await smartAccount.sendTransaction({
        to: transaction.to,
        data: transaction.data,
        value: transaction.value,
        gasLimit: transaction.gasLimit
      })
      
      toast.success('Transaction submitted!')
      onClose()
    } catch (error) {
      toast.error(`Transaction failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const runSimulation = async () => {
      const simResult = await simulateTransaction(transaction)
      setSimulation(simResult)
      
      if (!simResult.success) {
        toast.error(`Transaction simulation failed: ${simResult.error}`)
      }
    }
    
    runSimulation()
  }, [transaction])

  const minAmount = calculateSlippage(transaction.value, 0.5) // 0.5% slippage
  if (simulation?.balanceChanges[transaction.to] < minAmount) {
    toast.error('Slippage exceeds allowed threshold')
    return
  }

  return (
    <div className="flex flex-col gap-4 p-6 bg-card rounded-lg">
      <h3 className="text-lg font-semibold">Confirm Transaction</h3>
      
      <div className="space-y-2">
        <p>From: {address}</p>
        <p>To: {transaction.to}</p>
        <p>Value: {transaction.value} ETH</p>
        <p>Gas Limit: {transaction.gasLimit}</p>
      </div>

      <Button 
        onClick={handleConfirm}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Processing...' : 'Confirm Transaction'}
      </Button>
    </div>
  )
} 