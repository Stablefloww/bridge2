'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WalletConnectButton } from '@/components/wallet/WalletConnectButton';
import { Button } from '@/components/ui/Button';
import { useWallet } from '@/hooks/useWallet';

// Mock transaction data
const mockTransactions = [
  {
    id: '1',
    hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    fromChain: 'Base',
    toChain: 'Polygon',
    token: 'USDC',
    amount: '100',
    status: 'success',
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
  },
  {
    id: '2',
    hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    fromChain: 'Base',
    toChain: 'Arbitrum',
    token: 'ETH',
    amount: '0.5',
    status: 'success',
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
  },
  {
    id: '3',
    hash: '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
    fromChain: 'Base',
    toChain: 'Optimism',
    token: 'USDT',
    amount: '50',
    status: 'pending',
    timestamp: Date.now() - 1000 * 60 * 10, // 10 minutes ago
  },
];

export default function HistoryPage() {
  const router = useRouter();
  const { isConnected } = useWallet();
  const [transactions, setTransactions] = useState<typeof mockTransactions>([]);

  // Simulate loading transaction history
  useEffect(() => {
    if (isConnected) {
      // In a real app, we would fetch from an API or indexer
      setTimeout(() => {
        setTransactions(mockTransactions);
      }, 1000);
    }
  }, [isConnected]);

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-4xl flex justify-between items-center mb-8">
        <h1 className="text-h2 md:text-h1 font-bold text-text-primary dark:text-text-primary-dark">
          Transaction History
        </h1>
        <WalletConnectButton />
      </header>

      <div className="w-full max-w-4xl">
        {!isConnected ? (
          <div className="bg-surface dark:bg-surface-dark rounded-lg p-8 text-center border border-border dark:border-border-dark">
            <p className="mb-4">Connect your wallet to view transaction history</p>
            <WalletConnectButton />
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-surface dark:bg-surface-dark rounded-lg p-8 text-center border border-border dark:border-border-dark">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading transaction history...</p>
          </div>
        ) : (
          <div className="bg-surface dark:bg-surface-dark rounded-lg border border-border dark:border-border-dark overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border dark:border-border-dark">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider">
                      Token
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider">
                      From → To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary dark:text-text-secondary-dark uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-border-dark">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-surface/50 dark:hover:bg-surface-dark/50">
                      <td className="px-6 py-4">
                        <div className="font-medium">{tx.amount} {tx.token}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div>{tx.fromChain} → {tx.toChain}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary dark:text-text-secondary-dark">
                        {formatDate(tx.timestamp)}
                      </td>
                      <td className="px-6 py-4">
                        <span 
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tx.status === 'success' 
                              ? 'bg-secondary/10 text-secondary dark:bg-secondary-dark/10 dark:text-secondary-dark' 
                              : tx.status === 'pending'
                                ? 'bg-warning/10 text-warning dark:bg-warning-dark/10 dark:text-warning-dark'
                                : 'bg-error/10 text-error dark:bg-error-dark/10 dark:text-error-dark'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6">
          <Button variant="outline" onClick={() => router.push('/')}>
            Back to Home
          </Button>
        </div>
      </div>
    </main>
  );
} 