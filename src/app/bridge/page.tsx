'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBridge } from '@/hooks/useBridge';
import { useBridgeStore } from '@/store/bridge';
import { WalletConnectButton } from '@/components/wallet/WalletConnectButton';
import { Button } from '@/components/ui/Button';

export default function BridgePage() {
  const router = useRouter();
  const { reset } = useBridgeStore();
  const {
    sourceChain,
    destChain,
    token,
    amount,
    routes,
    selectedRoute,
    isLoadingRoutes,
    isFetchingRoutes,
    transactionStatus,
    transactionHash,
    isExecuting,
    bridgeError,
    selectRoute,
    executeBridgeTransaction
  } = useBridge();

  // Reset bridge state when leaving the page
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  // Redirect to home if no token/amount is set
  useEffect(() => {
    if (!token || !amount || !destChain) {
      router.push('/');
    }
  }, [token, amount, destChain, router]);

  if (!token || !amount || !destChain) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-4xl flex justify-between items-center mb-8">
        <h1 className="text-h2 md:text-h1 font-bold text-text-primary dark:text-text-primary-dark">
          Bridge Details
        </h1>
        <WalletConnectButton />
      </header>

      <div className="w-full max-w-4xl">
        <div className="bg-surface dark:bg-surface-dark rounded-lg p-6 mb-6 border border-border dark:border-border-dark">
          <h2 className="text-h3 mb-4">Transaction Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-text-secondary dark:text-text-secondary-dark mb-1">From</p>
              <p className="font-medium">{sourceChain}</p>
            </div>
            <div>
              <p className="text-text-secondary dark:text-text-secondary-dark mb-1">To</p>
              <p className="font-medium">{destChain}</p>
            </div>
            <div>
              <p className="text-text-secondary dark:text-text-secondary-dark mb-1">Amount</p>
              <p className="font-medium">{amount} {token}</p>
            </div>
            <div>
              <p className="text-text-secondary dark:text-text-secondary-dark mb-1">Status</p>
              <p className="font-medium capitalize">{transactionStatus}</p>
            </div>
          </div>
        </div>

        {isLoadingRoutes && (
          <div className="text-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Finding the best routes...</p>
          </div>
        )}

        {routes.length > 0 && (
          <div className="bg-surface dark:bg-surface-dark rounded-lg p-6 mb-6 border border-border dark:border-border-dark">
            <h2 className="text-h3 mb-4">Available Routes</h2>
            <div className="space-y-4">
              {routes.map((route, index) => (
                <div 
                  key={`${route.provider}-${index}`}
                  className={`p-4 border rounded-md cursor-pointer transition-colors ${
                    selectedRoute === route 
                      ? 'border-primary bg-primary/5 dark:border-primary-dark dark:bg-primary-dark/5' 
                      : 'border-border dark:border-border-dark hover:border-primary dark:hover:border-primary-dark'
                  }`}
                  onClick={() => selectRoute(route)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">{route.provider}</h3>
                    <span className="text-sm text-text-secondary dark:text-text-secondary-dark">
                      Est. Time: {Math.round(route.estimatedTime / 60)} min
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-text-secondary dark:text-text-secondary-dark">You send</p>
                      <p>{route.fromAmount} {route.fromToken.symbol}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-text-secondary dark:text-text-secondary-dark">You receive</p>
                      <p>{route.toAmount} {route.toToken.symbol}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-text-secondary dark:text-text-secondary-dark">
                    Gas fee: ~{route.estimatedGasFee} ETH
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {bridgeError && (
          <div className="bg-error/10 dark:bg-error-dark/10 border border-error dark:border-error-dark rounded-lg p-4 mb-6">
            <p className="text-error dark:text-error-dark">{bridgeError}</p>
          </div>
        )}

        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
          >
            Back
          </Button>
          <Button
            onClick={executeBridgeTransaction}
            disabled={!selectedRoute || isExecuting || transactionStatus !== 'idle'}
            isLoading={isExecuting}
          >
            {transactionStatus === 'idle' ? 'Execute Bridge' : 'Processing...'}
          </Button>
        </div>

        {transactionHash && (
          <div className="mt-6 p-4 bg-secondary/10 dark:bg-secondary-dark/10 border border-secondary dark:border-secondary-dark rounded-lg">
            <h3 className="font-medium mb-2">Transaction Hash</h3>
            <p className="font-mono text-sm break-all">{transactionHash}</p>
          </div>
        )}
      </div>
    </main>
  );
} 