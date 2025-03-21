'use client';

import React from 'react';
import { useBridgeStore } from '@/store/bridge';
import { Button } from '@/components/ui/Button';

/**
 * Component to display error messages with recovery suggestions
 */
export const ErrorMessage: React.FC = () => {
  const { error, reset } = useBridgeStore();

  if (!error) {
    return null;
  }

  // Determine if we should suggest specific recovery actions
  const suggestRecovery = !error.includes('cancelled');

  return (
    <div className="bg-error bg-opacity-10 p-4 rounded-md shadow-sm mt-4 border border-error/30">
      <h4 className="text-base font-medium text-error mb-2">
        Error
      </h4>
      <p className="text-text-primary dark:text-text-primary-dark mb-4">
        {error}
      </p>

      {suggestRecovery && (
        <div className="space-y-2">
          <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
            Try one of these instead:
          </p>
          <ul className="list-disc list-inside text-sm text-text-secondary dark:text-text-secondary-dark space-y-1 ml-2">
            <li>"Bridge 0.5 ETH to Optimism"</li>
            <li>"Send 100 USDC to Arbitrum"</li>
            <li>"Transfer 50 DAI from Base to Polygon"</li>
          </ul>
        </div>
      )}

      <div className="mt-4">
        <Button variant="outline" size="sm" onClick={() => reset()}>
          Try again
        </Button>
      </div>
    </div>
  );
}; 