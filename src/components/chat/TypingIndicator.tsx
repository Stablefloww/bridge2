export const TypingIndicator = () => (
  <div className="flex items-center gap-2 text-muted-foreground">
    <div className="flex space-x-1">
      <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
      <div className="w-2 h-2 rounded-full bg-current animate-bounce delay-100" />
      <div className="w-2 h-2 rounded-full bg-current animate-bounce delay-200" />
    </div>
    <span className="text-sm">Assistant is thinking...</span>
  </div>
) 