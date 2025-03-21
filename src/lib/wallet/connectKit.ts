import { createConfig, http } from 'viem';
import { base, mainnet } from 'viem/chains';
import { createConfig as createWagmiConfig } from 'wagmi';
import { connectKit } from 'connectkit';

// Define supported chains for our app
const chains = [base, mainnet];

// Create the wagmi config with our chosen chains and connectors
export const config = createWagmiConfig({
  chains,
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
  },
  connectors: connectKit({
    // You can customize the ConnectKit appearance
    options: {
      // Family Connect Kit options
      // Name shown in the modal
      appName: 'Natural Bridge',
      // Icon shown in the modal
      appIcon: 'https://family.co/logo.png',
    },
  }),
}); 