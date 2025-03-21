import { useWalletStore } from '@/store/wallet'
import { Skeleton } from '@eth-optimism/ui-components'

export const BalanceDisplay = () => {
  const { balances, status } = useWalletStore()
  
  return (
    <div className="flex flex-col gap-2 p-4 bg-card rounded-lg">
      <h3 className="text-sm font-semibold">Balances</h3>
      {status === 'loading' ? (
        <Skeleton className="h-4 w-[200px]" />
      ) : (
        Object.entries(balances).map(([token, balance]) => (
          <div key={token} className="flex justify-between">
            <span>{token}</span>
            <span>{balance}</span>
          </div>
        ))
      )}
    </div>
  )
} 