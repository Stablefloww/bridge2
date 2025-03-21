'use client';

import * as React from 'react';
import { useBridgeStore } from '../../store/bridge';
import { Button } from '../../components/ui/Button';

// Define a basic interface for the Button if the imported one doesn't have the necessary props
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

// Simple custom button component that accepts the props we need
const CustomButton: React.FC<ButtonProps & {
  variant?: string;
  size?: string;
}> = ({ children, variant, size, onClick, className }) => {
  // Compute class names based on variant and size
  const variantClass = variant === 'outline' ? 'border border-gray-300 text-gray-700' : 'bg-primary text-white';
  const sizeClass = size === 'sm' ? 'px-3 py-1 text-sm' : 'px-4 py-2';
  
  return (
    <button 
      className={`rounded ${variantClass} ${sizeClass} ${className || ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

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
        <CustomButton variant="outline" size="sm" onClick={() => reset()}>
          Try again
        </CustomButton>
      </div>
    </div>
  );
}; 