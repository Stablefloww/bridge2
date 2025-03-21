import { create } from 'zustand';
import { type WalletState } from '@/types/wallet';

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  chainId: null,
  balances: {},
  isConnected: false,
  isLoading: false,
  status: 'disconnected',
  balance: {},
  error: undefined,
  
  // Actions
  connect: async (connector) => {
    set({ status: 'connecting', isLoading: true });
    try {
      const { account, chain } = await connector.connect();
      set({
        address: account,
        chainId: chain.id,
        isConnected: true,
        status: 'connected',
        error: undefined,
        isLoading: false
      });
    } catch (error) {
      set({ status: 'error', error: error.message, isLoading: false });
    }
  },
  
  disconnect: () => {
    set({
      address: null,
      chainId: null,
      balances: {},
      isConnected: false,
      status: 'disconnected',
      isLoading: false
    });
  },
  
  updateBalances: (balances) => set({ balances }),
  
  handleChainChanged: (chainId) => set({ chainId }),
  
  handleAccountsChanged: (accounts) => {
    if (accounts.length === 0) {
      set({ status: 'disconnected', address: null, isConnected: false });
    } else {
      set({ address: accounts[0], isConnected: true });
    }
  },
  
  setAddress: (address) => set({ address }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setChainId: (chainId) => set({ chainId }),
  setBalance: (token, amount) => set(state => ({
    balance: {
      ...state.balance,
      [token]: amount
    }
  })),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error })
})); 