'use client';

import * as React from 'react';
import { cn } from "../../lib/utils"

interface ChatMessageProps {
  type: 'user' | 'system';
  message: string;
  timestamp: number;
  key?: string;
}

export const ChatMessage = ({ type, message, timestamp }: ChatMessageProps) => (
  <div className={cn(
    "p-4 rounded-lg max-w-[80%]",
    type === 'user' 
      ? "ml-auto bg-primary text-primary-foreground" 
      : "bg-muted"
  )}>
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>{type === 'user' ? 'You' : 'Assistant'}</span>
      <span className="text-xs opacity-50">
        {new Date(timestamp).toLocaleTimeString()}
      </span>
    </div>
    <p className="mt-1">{message}</p>
  </div>
) 