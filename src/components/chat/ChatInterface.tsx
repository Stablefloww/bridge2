import { useChatStore } from "@/store/chat"
import { ChatMessage } from "./ChatMessage"
import { TypingIndicator } from "./TypingIndicator"
import { SuggestionChips } from "./SuggestionChips"

export const ChatInterface = () => {
  const { messages, isProcessing, suggestions } = useChatStore()

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.timestamp} message={message} />
        ))}
        {isProcessing && <TypingIndicator />}
      </div>
      
      <SuggestionChips />
    </div>
  )
} 