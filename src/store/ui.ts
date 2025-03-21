import { create } from 'zustand';

interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  modalOpen: {
    walletConnect: boolean;
    transactionDetails: boolean;
    settings: boolean;
  };
  chatHistory: {
    id: string;
    type: 'user' | 'system';
    message: string;
    timestamp: number;
  }[];

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSidebarOpen: (open: boolean) => void;
  setModalOpen: (modal: 'walletConnect' | 'transactionDetails' | 'settings', open: boolean) => void;
  addChatMessage: (type: 'user' | 'system', message: string) => void;
  clearChatHistory: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'system',
  sidebarOpen: false,
  modalOpen: {
    walletConnect: false,
    transactionDetails: false,
    settings: false,
  },
  chatHistory: [],

  // Actions
  setTheme: (theme) => set({ theme }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setModalOpen: (modal, open) => set((state) => ({
    modalOpen: {
      ...state.modalOpen,
      [modal]: open
    }
  })),
  addChatMessage: (type, message) => set((state) => ({
    chatHistory: [
      ...state.chatHistory,
      {
        id: crypto.randomUUID(),
        type,
        message,
        timestamp: Date.now()
      }
    ]
  })),
  clearChatHistory: () => set({ chatHistory: [] })
})); 