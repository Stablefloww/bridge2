import { create } from 'zustand';
import { type WalletState } from '@/types/wallet';

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  chainId: null,
  balances: {},
  status: 'disconnected',
  error: undefined,
  
  // Actions
  connect: async (connector) => {
    set({ status: 'connecting' });
    try {
      const { account, chain } = await connector.connect();
      set({
        address: account,
        chainId: chain.id,
        status: 'connected',
        error: undefined
      });
    } catch (error) {
      set({ status: 'error', error: error.message });
    }
  },
  
  disconnect: () => {
    set({
      address: null,
      chainId: null,
      balances: {},
      status: 'disconnected'
    });
  },
  
  updateBalances: (balances) => set({ balances }),
  
  handleChainChanged: (chainId) => set({ chainId }),
  
  handleAccountsChanged: (accounts) => {
    if (accounts.length === 0) {
      set({ status: 'disconnected', address: null });
    } else {
      set({ address: accounts[0] });
    }
  },
  
  setAddress: (address) => set({ address })
})); 