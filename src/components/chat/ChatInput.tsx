'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNLP } from '@/hooks/useNLP';
import { useBridgeStore } from '@/store/bridge';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isDisabled?: boolean;
}

export function ChatInput({ onSendMessage, isDisabled = false }: ChatInputProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  
  const { 
    processUserCommand, 
    isProcessing 
  } = useNLP();
  
  const { 
    setSourceChain, 
    setDestChain, 
    setToken, 
    setAmount,
    setCommandInterpretation,
    commandInterpretation,
    error
  } = useBridgeStore();
  
  // Auto focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // Auto resize textarea based on content
  const handleInput = () => {
    const textarea = inputRef.current;
    if (!textarea) return;
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    // Set the height to scrollHeight to fit the content
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    handleInput();
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isDisabled || isProcessing) return;
    
    const userMessage = input.trim();
    onSendMessage(userMessage);
    setInput('');
    
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    
    // Process the command with NLP
    try {
      await processUserCommand(userMessage);
      
      // If no errors and we have the information needed, navigate to bridge page
      if (!error && commandInterpretation) {
        // Give a small delay to allow the interpretation to be displayed
        setTimeout(() => {
          router.push('/bridge');
        }, 1500);
      }
    } catch (err) {
      console.error('Error processing command:', err);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter without Shift
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex items-end border-t border-border dark:border-border-dark p-3">
      <textarea
        ref={inputRef}
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Enter a bridge command (e.g., 'Send 100 USDC to Arbitrum')"
        className="w-full resize-none bg-background dark:bg-background-dark border border-border dark:border-border-dark rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark min-h-[40px] max-h-[120px]"
        rows={1}
        disabled={isDisabled || isProcessing}
      />
      <button
        type="submit"
        disabled={isDisabled || isProcessing || !input.trim()}
        className="ml-2 px-4 py-2 h-10 bg-primary dark:bg-primary-dark text-white rounded-md hover:bg-primary/90 dark:hover:bg-primary-dark/90 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        ) : (
          <span>Send</span>
        )}
      </button>
    </form>
  );
} 