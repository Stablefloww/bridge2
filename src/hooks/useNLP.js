import { useState, useCallback } from 'react';
import nlpProcessor from '../lib/nlp/nlpProcessor';

/**
 * Hook for processing natural language commands
 */
export function useNLP() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [needsClarification, setNeedsClarification] = useState(false);
  const [clarificationQuestions, setClarificationQuestions] = useState([]);
  
  /**
   * Process a natural language command
   * 
   * @param {string} command - The user's command
   * @returns {Promise<Object>} The processing result
   */
  const processCommand = useCallback(async (command) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Process the command
      const processingResult = await nlpProcessor.processCommand(command);
      
      // Check if we need clarification
      if (!processingResult.success && processingResult.intent === nlpProcessor.INTENT_TYPES.BRIDGE) {
        const clarification = nlpProcessor.generateClarification(processingResult);
        
        if (clarification.needsClarification) {
          setNeedsClarification(true);
          setClarificationQuestions(clarification.questions);
          setResult(null);
          return null;
        }
      }
      
      // Set the result
      setResult(processingResult);
      setNeedsClarification(false);
      setClarificationQuestions([]);
      
      return processingResult;
    } catch (err) {
      setError(err.message || 'An error occurred while processing your command');
      setResult(null);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  /**
   * Handle clarification response
   * 
   * @param {string} response - User's response to clarification
   * @param {string} originalCommand - The original command
   * @returns {Promise<Object>} The updated processing result
   */
  const handleClarification = useCallback(async (response, originalCommand) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Combine the original command with the clarification
      const enhancedCommand = `${originalCommand} ${response}`;
      
      // Process the enhanced command
      const processingResult = await nlpProcessor.processCommand(enhancedCommand);
      
      // Check if we still need clarification
      if (!processingResult.success && processingResult.intent === nlpProcessor.INTENT_TYPES.BRIDGE) {
        const clarification = nlpProcessor.generateClarification(processingResult);
        
        if (clarification.needsClarification) {
          setNeedsClarification(true);
          setClarificationQuestions(clarification.questions);
          setResult(null);
          return null;
        }
      }
      
      // Set the result
      setResult(processingResult);
      setNeedsClarification(false);
      setClarificationQuestions([]);
      
      return processingResult;
    } catch (err) {
      setError(err.message || 'An error occurred while processing your clarification');
      setResult(null);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  /**
   * Reset the NLP state
   */
  const reset = useCallback(() => {
    setIsProcessing(false);
    setResult(null);
    setError(null);
    setNeedsClarification(false);
    setClarificationQuestions([]);
  }, []);
  
  return {
    processCommand,
    handleClarification,
    reset,
    isProcessing,
    result,
    error,
    needsClarification,
    clarificationQuestions
  };
}

export default useNLP; 