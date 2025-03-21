import { createConfig, http } from 'viem';
import { base, mainnet } from 'viem/chains';
import { createConfig as createWagmiConfig } from 'wagmi';
import { injected, walletConnect } from '@wagmi/connectors';
import { ConnectKitProvider, ConnectKitButton } from 'connectkit';

// Define supported chains for our app
const chains = [base, mainnet] as const;

// Create the wagmi config with our chosen chains and connectors
export const config = createWagmiConfig({
  chains,
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
  },
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
    })
  ],
});

/**
 * Hook to get the connected wallet address and connection state
 * @returns Object with wallet address and connection functions
 */
export function useWallet() {
  // This is a placeholder for now - we'll replace this with the actual hook from wagmi
  return {
    address: null,
    isConnected: false,
    isConnecting: false,
    connect: () => {},
    disconnect: () => {},
  };
} 