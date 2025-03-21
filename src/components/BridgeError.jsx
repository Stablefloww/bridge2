import React from 'react';

const BridgeError = ({ error, onClose }) => {
  // Parse the error message to extract important information
  const parseError = (errorMessage) => {
    if (!errorMessage) return { message: 'Unknown error' };
    
    // Check for Stargate allowance error
    if (errorMessage.includes('call revert exception') && errorMessage.includes('method="allowance(address,address)"')) {
      return {
        type: 'allowance_error',
        message: 'Token Approval Required',
        details: {
          errorCode: 'CALL_EXCEPTION',
          errorType: 'Token Approval'
        }
      };
    }
    
    // Check for insufficient funds error
    if (errorMessage.includes('Insufficient funds for gas fees')) {
      const parts = errorMessage.match(/You have ([\d\.]+) ETH but need ([\d\.]+) ETH \(([\d\.]+) for bridge fees \+ ~([\d\.]+) for transaction gas\)/);
      
      if (parts) {
        return {
          type: 'insufficient_funds',
          message: 'Insufficient funds for gas fees',
          details: {
            currentBalance: parts[1],
            totalNeeded: parts[2],
            bridgeFee: parts[3],
            txGas: parts[4],
            token: 'ETH'
          }
        };
      }
    }
    
    // Check for insufficient token balance
    if (errorMessage.includes('Insufficient') && errorMessage.includes('balance')) {
      const parts = errorMessage.match(/Insufficient ([A-Z0-9\.]+) balance\. You have ([\d\.]+) but need ([\d\.]+)/);
      
      if (parts) {
        return {
          type: 'insufficient_balance',
          message: `Insufficient ${parts[1]} balance`,
          details: {
            token: parts[1],
            currentBalance: parts[2],
            needed: parts[3]
          }
        };
      }
    }
    
    // Check for token fee-specific errors
    if (errorMessage.includes('Insufficient') && errorMessage.includes('for transaction with token fees')) {
      const balanceMatch = errorMessage.match(/You have ([\d\.]+) ([A-Z0-9\.]+) but need ([\d\.]+) ([A-Z0-9\.]+)/);
      const detailsMatch = errorMessage.match(/\(([\d\.]+) for bridge amount \+ ([\d\.]+) for fee\)/);
      const shortfallMatch = errorMessage.match(/Shortfall: ([\d\.]+) ([A-Z0-9\.]+)/);
      
      if (balanceMatch && detailsMatch && shortfallMatch) {
        return {
          type: 'insufficient_token_fees',
          message: `Insufficient ${balanceMatch[2]} for transaction with token fees`,
          details: {
            token: balanceMatch[2],
            currentBalance: balanceMatch[1],
            totalNeeded: balanceMatch[3],
            bridgeAmount: detailsMatch[1],
            tokenFee: detailsMatch[2],
            shortfall: shortfallMatch[1]
          }
        };
      }
    }
    
    // Check for ETH needed for token fee approval
    if (errorMessage.includes('Insufficient ETH for token approval')) {
      const parts = errorMessage.match(/You have ([\d\.]+) ETH but need approximately ([\d\.]+) ETH for approval/);
      
      if (parts) {
        return {
          type: 'insufficient_eth_for_approval',
          message: 'Insufficient ETH for token approval',
          details: {
            currentBalance: parts[1],
            neededForApproval: parts[2]
          }
        };
      }
    }
    
    // Default error parsing
    return {
      type: 'general',
      message: errorMessage
    };
  };
  
  // Parse the error
  const parsedError = parseError(error);
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <h3 className="text-lg font-medium text-red-800">{parsedError.message}</h3>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      
      <div className="mt-2">
        {parsedError.type === 'allowance_error' && (
          <div className="mt-2 space-y-2 text-sm text-red-700">
            <p>Your tokens need to be approved before bridging</p>
            <div className="bg-white rounded p-3 border border-red-100">
              <p>This error occurs when the bridge contract doesn't have permission to use your tokens.</p>
              <p className="mt-2">To fix this:</p>
              <ol className="list-decimal pl-5 mt-1 space-y-1">
                <li>You need to approve the bridge contract to use your USDT tokens</li>
                <li>This requires a separate transaction before the bridge transaction</li>
                <li>Please try again and confirm the approval transaction when prompted</li>
              </ol>
            </div>
            <div className="bg-yellow-50 p-3 rounded border border-yellow-100 mt-2">
              <p className="font-medium">Note: You'll need to complete two transactions</p>
              <p>1. Token approval transaction (one-time per token)</p>
              <p>2. Bridge transaction</p>
            </div>
          </div>
        )}
        
        {parsedError.type === 'insufficient_funds' && (
          <div className="mt-2 space-y-2 text-sm text-red-700">
            <p>You need more ETH to complete this transaction</p>
            <div className="bg-white rounded p-3 border border-red-100">
              <div className="grid grid-cols-2 gap-2">
                <div>Current balance:</div>
                <div className="text-right font-mono">{parsedError.details.currentBalance} ETH</div>
                
                <div>Required for bridge:</div>
                <div className="text-right font-mono">{parsedError.details.bridgeFee} ETH</div>
                
                <div>Required for gas:</div>
                <div className="text-right font-mono">{parsedError.details.txGas} ETH</div>
                
                <div className="font-semibold">Total needed:</div>
                <div className="text-right font-mono font-semibold">{parsedError.details.totalNeeded} ETH</div>
                
                <div className="font-semibold text-red-600">Shortfall:</div>
                <div className="text-right font-mono font-semibold text-red-600">
                  {(parseFloat(parsedError.details.totalNeeded) - parseFloat(parsedError.details.currentBalance)).toFixed(6)} ETH
                </div>
              </div>
            </div>
            <p className="text-sm mt-2">
              Options:
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Add more ETH to your wallet</li>
                <li>Try using a token payment for gas</li>
                <li>Bridge a smaller amount</li>
              </ul>
            </p>
          </div>
        )}
        
        {parsedError.type === 'insufficient_balance' && (
          <div className="mt-2 space-y-2 text-sm text-red-700">
            <p>You don't have enough {parsedError.details.token} for this transaction</p>
            <div className="bg-white rounded p-3 border border-red-100">
              <div className="grid grid-cols-2 gap-2">
                <div>Current balance:</div>
                <div className="text-right font-mono">{parsedError.details.currentBalance} {parsedError.details.token}</div>
                
                <div>Amount needed:</div>
                <div className="text-right font-mono">{parsedError.details.needed} {parsedError.details.token}</div>
                
                <div className="font-semibold text-red-600">Shortfall:</div>
                <div className="text-right font-mono font-semibold text-red-600">
                  {(parseFloat(parsedError.details.needed) - parseFloat(parsedError.details.currentBalance)).toFixed(6)} {parsedError.details.token}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {parsedError.type === 'insufficient_token_fees' && (
          <div className="mt-2 space-y-2 text-sm text-red-700">
            <p>You don't have enough {parsedError.details.token} to pay for the transaction and fees</p>
            <div className="bg-white rounded p-3 border border-red-100">
              <div className="grid grid-cols-2 gap-2">
                <div>Current balance:</div>
                <div className="text-right font-mono">{parsedError.details.currentBalance} {parsedError.details.token}</div>
                
                <div>Bridge amount:</div>
                <div className="text-right font-mono">{parsedError.details.bridgeAmount} {parsedError.details.token}</div>
                
                <div>Token fee:</div>
                <div className="text-right font-mono">{parsedError.details.tokenFee} {parsedError.details.token}</div>
                
                <div className="font-semibold">Total needed:</div>
                <div className="text-right font-mono font-semibold">{parsedError.details.totalNeeded} {parsedError.details.token}</div>
                
                <div className="font-semibold text-red-600">Shortfall:</div>
                <div className="text-right font-mono font-semibold text-red-600">
                  {parsedError.details.shortfall} {parsedError.details.token}
                </div>
              </div>
            </div>
            <p className="text-sm mt-2">
              Options:
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Add more {parsedError.details.token} to your wallet</li>
                <li>Bridge a smaller amount</li>
                <li>Try using standard bridge without token fees</li>
              </ul>
            </p>
          </div>
        )}
        
        {parsedError.type === 'insufficient_eth_for_approval' && (
          <div className="mt-2 space-y-2 text-sm text-red-700">
            <p>You need a small amount of ETH for the approval transaction</p>
            <div className="bg-white rounded p-3 border border-red-100">
              <div className="grid grid-cols-2 gap-2">
                <div>Current ETH balance:</div>
                <div className="text-right font-mono">{parsedError.details.currentBalance} ETH</div>
                
                <div>Needed for approval:</div>
                <div className="text-right font-mono">{parsedError.details.neededForApproval} ETH</div>
                
                <div className="font-semibold text-red-600">Shortfall:</div>
                <div className="text-right font-mono font-semibold text-red-600">
                  {(parseFloat(parsedError.details.neededForApproval) - parseFloat(parsedError.details.currentBalance)).toFixed(6)} ETH
                </div>
              </div>
            </div>
            <p className="text-sm mt-2">
              Even when using token fees for bridge costs, you still need a small amount of ETH to approve the token transfer.
            </p>
          </div>
        )}
        
        {parsedError.type === 'general' && (
          <p className="text-sm text-red-700">{parsedError.message}</p>
        )}
      </div>
    </div>
  );
};

export default BridgeError; 