'use client';

import React from 'react';
import { WagmiProvider } from 'wagmi';
import { ConnectKitProvider } from 'connectkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import our wagmi config
import { config } from '../../../lib/wallet/connectKit';

// Create a client for React Query
const queryClient = new QueryClient();

interface WalletProvidersProps {
  children: any; // Using 'any' as a workaround for ReactNode issues
}

export function WalletProviders({ children }: WalletProvidersProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider theme="auto" mode="light">
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 