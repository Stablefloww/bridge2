'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { ProcessCommandResponse, CommandEntity } from '@/types/nlp';
import { useBridgeStore } from '@/store/bridge';
import { processNLPCommand, generateClarificationQuestion, BridgeCommand } from '@/lib/nlp/bridgeNLP';

// Enhanced NLP processing function using our AI models
const processCommand = async (command: string): Promise<ProcessCommandResponse> => {
  try {
    // Process the command using our AI service
    const result = await processNLPCommand(command);
    
    if (!result) {
      return {
        success: false,
        analysis: {
          intent: { type: 'unknown', confidence: 0 },
          entities: [],
          originalText: command,
          normalizedText: command.toLowerCase(),
          missingInformation: ['Could not process command'],
          ambiguities: [],
          confidence: 0
        },
        interpretation: 'I could not understand your command. Please try rephrasing it.',
        error: 'Failed to process command'
      };
    }
    
    // Convert the BridgeCommand to our CommandAnalysis format
    const entities: CommandEntity[] = [];
    
    // Add source chain if present
    if (result.sourceChain) {
      entities.push({
        type: 'chain',
        value: result.sourceChain,
        confidence: 0.9,
        role: 'source'
      });
    }
    
    // Add destination chain
    entities.push({
      type: 'chain',
      value: result.destinationChain,
      confidence: 0.95,
      role: 'destination'
    });
    
    // Add token
    entities.push({
      type: 'token',
      value: result.token,
      confidence: 0.95
    });
    
    // Add amount
    entities.push({
      type: 'amount',
      value: result.amount,
      confidence: 0.95
    });
    
    // Determine missing information
    const missingInformation: string[] = [];
    if (!result.destinationChain) missingInformation.push('destination chain');
    if (!result.token) missingInformation.push('token');
    if (!result.amount) missingInformation.push('amount');
    
    // Generate interpretation
    const interpretation = `Bridge ${result.amount} ${result.token} from ${result.sourceChain || 'Base'} to ${result.destinationChain}${
      result.gasPreference !== 'normal' ? ` with ${result.gasPreference} gas` : ''
    }`;
    
    return {
      success: missingInformation.length === 0,
      analysis: {
        intent: { type: 'bridge', confidence: 0.95 },
        entities,
        originalText: command,
        normalizedText: command.toLowerCase(),
        missingInformation,
        ambiguities: [],
        confidence: 0.9
      },
      interpretation: missingInformation.length === 0 ? interpretation : await generateClarificationQuestion(command, missingInformation),
      error: missingInformation.length > 0 ? 'Missing required information' : undefined
    };
  } catch (error) {
    console.error('Error processing command:', error);
    return {
      success: false,
      analysis: {
        intent: { type: 'unknown', confidence: 0 },
        entities: [],
        originalText: command,
        normalizedText: command.toLowerCase(),
        missingInformation: [],
        ambiguities: [],
        confidence: 0
      },
      interpretation: 'An error occurred while processing your command. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export function useNLP() {
  const [command, setCommand] = useState('');
  const { 
    setSourceChain, 
    setDestChain, 
    setToken, 
    setAmount, 
    setCommandInterpretation, 
    setProcessingCommand,
    setError
  } = useBridgeStore();
  
  const mutation = useMutation({
    mutationFn: processCommand,
    onMutate: () => {
      setProcessingCommand(true);
      setError(null);
    },
    onSuccess: (data) => {
      if (data.success) {
        // Extract information from the analysis
        const sourceEntity = data.analysis.entities.find(e => e.type === 'chain' && e.role === 'source');
        const destEntity = data.analysis.entities.find(e => e.type === 'chain' && e.role === 'destination');
        const tokenEntity = data.analysis.entities.find(e => e.type === 'token');
        const amountEntity = data.analysis.entities.find(e => e.type === 'amount');
        
        // Update the bridge store
        if (sourceEntity) setSourceChain(sourceEntity.value);
        if (destEntity) setDestChain(destEntity.value);
        if (tokenEntity) setToken(tokenEntity.value);
        if (amountEntity) setAmount(amountEntity.value);
        
        setCommandInterpretation(data.interpretation);
      } else {
        setError(data.error || 'Unknown error processing command');
        
        // Still set the interpretation for feedback
        if (data.interpretation) {
          setCommandInterpretation(data.interpretation);
        }
      }
    },
    onError: (error: Error) => {
      setError(error.message);
    },
    onSettled: () => {
      setProcessingCommand(false);
    }
  });
  
  const processUserCommand = (userCommand: string) => {
    setCommand(userCommand);
    mutation.mutate(userCommand);
  };
  
  return {
    command,
    processUserCommand,
    isProcessing: mutation.isPending,
    error: mutation.error?.message,
    result: mutation.data
  };
} 