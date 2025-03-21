import { useChatStore } from "@/store/chat"

export const SuggestionChips = () => {
  const { suggestions, setSuggestions, addMessage } = useChatStore()
  
  const handleSuggestion = (content: string) => {
    addMessage({ role: 'user', content })
    setSuggestions([])
    // TODO: Trigger AI response
  }

  if (!suggestions.length) return null

  return (
    <div className="flex flex-wrap gap-2 p-4 border-t">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          onClick={() => handleSuggestion(suggestion)}
          className="px-3 py-1 text-sm rounded-full bg-muted hover:bg-muted/80 transition"
        >
          {suggestion}
        </button>
      ))}
    </div>
  )
} 