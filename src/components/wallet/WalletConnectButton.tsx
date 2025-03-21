'use client';

import React from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/Button';
import { ConnectKitButton } from 'connectkit';

export function WalletConnectButton() {
  const { address, isConnected, isLoading } = useWallet();
  
  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  // Use ConnectKit's button for wallet connection
  return (
    <ConnectKitButton.Custom>
      {({ isConnected, isConnecting, show, address, ensName }) => {
        if (isConnected && address) {
          return (
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-primary dark:text-text-primary-dark">
                {ensName || formatAddress(address)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={show}
              >
                Manage
              </Button>
            </div>
          );
        }
        
        return (
          <Button
            onClick={show}
            isLoading={isConnecting}
          >
            Connect Wallet
          </Button>
        );
      }}
    </ConnectKitButton.Custom>
  );
} 