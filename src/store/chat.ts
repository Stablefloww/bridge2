import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface ChatState {
  messages: Message[]
  isProcessing: boolean
  suggestions: string[]
  addMessage: (message: Omit<Message, 'timestamp'>) => void
  setProcessing: (isProcessing: boolean) => void
  setSuggestions: (suggestions: string[]) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      isProcessing: false,
      suggestions: [],
      addMessage: (message) => set((state) => ({
        messages: [...state.messages, { ...message, timestamp: Date.now() }]
      })),
      setProcessing: (isProcessing) => set({ isProcessing }),
      setSuggestions: (suggestions) => set({ suggestions })
    }),
    { name: 'chat-storage' }
  )
) 