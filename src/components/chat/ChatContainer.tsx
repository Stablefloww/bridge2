'use client';

import React, { useEffect, useRef } from 'react';
import { useUIStore } from '@/store/ui';
import { useBridgeStore } from '@/store/bridge';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { CommandFeedback } from './CommandFeedback';
import { ErrorMessage } from './ErrorMessage';

export function ChatContainer() {
  const { chatHistory, addChatMessage } = useUIStore();
  const { 
    commandInterpretation, 
    processingCommand,
    error
  } = useBridgeStore();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);
  
  // Add system response when command is processed
  useEffect(() => {
    if (commandInterpretation && !processingCommand) {
      // Only add the message to chat history if it's an error or clarifying question
      // Otherwise, the CommandFeedback component will handle displaying the interpretation
      if (error || commandInterpretation.includes('?')) {
        addChatMessage('system', commandInterpretation);
      }
    }
  }, [commandInterpretation, processingCommand, error, addChatMessage]);
  
  // Add error message when there's an error
  useEffect(() => {
    if (error && !processingCommand) {
      addChatMessage('system', `Error: ${error}`);
    }
  }, [error, processingCommand, addChatMessage]);
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-text-secondary dark:text-text-secondary-dark">
              <p className="text-lg font-medium mb-2">Welcome to Natural Bridge</p>
              <p className="text-sm">Start by typing a command like "Bridge 100 USDC to Polygon"</p>
            </div>
          </div>
        ) : (
          <>
            {chatHistory.map((msg) => (
              <ChatMessage
                key={msg.id}
                type={msg.type}
                message={msg.message}
                timestamp={msg.timestamp}
              />
            ))}
            
            {/* Show command feedback after the last message */}
            {commandInterpretation && !error && !commandInterpretation.includes('?') && (
              <CommandFeedback />
            )}
            
            {/* Show error message with recovery suggestions if there is an error */}
            {error && <ErrorMessage />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t border-border dark:border-border-dark p-4">
        <ChatInput />
      </div>
    </div>
  );
} 