'use client';

import { cn } from "@/lib/utils"
import { Message } from "@/types/chat"

export const ChatMessage = ({ message }: { message: Message }) => (
  <div className={cn(
    "p-4 rounded-lg max-w-[80%]",
    message.role === 'user' 
      ? "ml-auto bg-primary text-primary-foreground" 
      : "bg-muted"
  )}>
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>{message.role === 'user' ? 'You' : 'Assistant'}</span>
      <span className="text-xs opacity-50">
        {new Date(message.timestamp).toLocaleTimeString()}
      </span>
    </div>
    <p className="mt-1">{message.content}</p>
  </div>
) 