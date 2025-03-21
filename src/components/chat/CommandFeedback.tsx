'use client';

import React from 'react';
import { useBridgeStore } from '@/store/bridge';
import { Button } from '@/components/ui/Button';

/**
 * A component that shows the system's interpretation of the user's command
 * and allows the user to confirm or reject it.
 */
export const CommandFeedback: React.FC = () => {
  const { 
    commandInterpretation, 
    sourceChain,
    destChain,
    token,
    amount,
    error,
    setError,
    reset
  } = useBridgeStore();

  // If no interpretation or already has an error, don't show feedback
  if (!commandInterpretation || error) {
    return null;
  }

  const handleConfirm = () => {
    // If we have all required parameters, proceed
    if (destChain && token && amount) {
      // In a real app, we would navigate to confirmation screen
      console.log('Confirmed command:', { sourceChain, destChain, token, amount });
    } else {
      setError('Cannot proceed with incomplete command');
    }
  };

  const handleReject = () => {
    // Reset the bridge state
    reset();
    setError('Command was cancelled. Please try again.');
  };

  return (
    <div className="bg-surface dark:bg-surface-dark p-4 rounded-md shadow-sm mt-4">
      <h4 className="text-base font-medium text-text-primary dark:text-text-primary-dark mb-2">
        I understood your command:
      </h4>
      <p className="text-text-secondary dark:text-text-secondary-dark mb-4">
        {commandInterpretation}
      </p>

      <div className="flex items-center space-x-3">
        <Button variant="primary" onClick={handleConfirm}>
          That's correct
        </Button>
        <Button variant="outline" onClick={handleReject}>
          No, try again
        </Button>
      </div>
    </div>
  );
}; 