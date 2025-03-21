/**
 * Test suite for Stargate bridge functionality
 * This file tests the bridge functionality with various error scenarios
 */

import { expect } from 'chai';

describe('Bridge Error Handling Tests', () => {
  // Helper function to simulate error handling in the real application
  function handleBridgeError(error, token, sourceChain, destChain) {
    // Extract the method name if available
    let methodName = "unknown";
    if (error.method) {
      methodName = error.method;
    } else if (error.message && error.message.includes('method="')) {
      const methodMatch = error.message.match(/method="([^"]+)"/);
      if (methodMatch && methodMatch[1]) {
        methodName = methodMatch[1];
      }
    }
    
    // Handle different error types
    if (methodName.includes('quoteLayerZeroFee')) {
      return {
        type: 'fee_estimation_error',
        message: `Fee estimation failed for ${token} from ${sourceChain} to ${destChain}`
      };
    }
    
    if (methodName.includes('swap') || methodName.includes('swapETH')) {
      return {
        type: 'swap_error',
        message: `Swap failed for ${token} from ${sourceChain} to ${destChain}`
      };
    }
    
    // Check for other specific error messages
    if (error.message) {
      if (error.message.includes('insufficient funds')) {
        return {
          type: 'insufficient_funds',
          message: 'Insufficient funds for transaction'
        };
      }
      
      if (error.message.includes('slippage') || 
          error.message.includes('TRANSFER_AMOUNT_EXCEEDS') ||
          error.message.includes('execution reverted')) {
        return {
          type: 'slippage_error',
          message: 'Slippage tolerance exceeded'
        };
      }
    }
    
    // Default error
    return {
      type: 'unknown_error',
      message: error.message || 'Unknown error'
    };
  }
  
  test('Should properly identify fee estimation errors', () => {
    const mockQuoteError = new Error('call revert exception');
    mockQuoteError.method = 'quoteLayerZeroFee';
    
    const errorResult = handleBridgeError(mockQuoteError, 'USDC', 'base', 'arbitrum');
    
    expect(errorResult.type).to.equal('fee_estimation_error');
    expect(errorResult.message).to.include('Fee estimation failed');
  });
  
  test('Should properly identify insufficient funds errors', () => {
    const mockError = new Error('execution reverted: insufficient funds');
    
    const errorResult = handleBridgeError(mockError, 'USDC', 'base', 'arbitrum');
    
    expect(errorResult.type).to.equal('insufficient_funds');
    expect(errorResult.message).to.include('Insufficient funds');
  });
  
  test('Should properly identify slippage errors', () => {
    const mockError = new Error('execution reverted: slippage too high');
    
    const errorResult = handleBridgeError(mockError, 'USDC', 'base', 'arbitrum');
    
    expect(errorResult.type).to.equal('slippage_error');
    expect(errorResult.message).to.include('Slippage tolerance exceeded');
  });
  
  test('Should handle swap method errors', () => {
    const mockError = new Error('Transaction failed');
    mockError.method = 'swap';
    
    const errorResult = handleBridgeError(mockError, 'USDC', 'base', 'arbitrum');
    
    expect(errorResult.type).to.equal('swap_error');
    expect(errorResult.message).to.include('Swap failed');
  });
  
  test('Should handle swapETH method errors', () => {
    const mockError = new Error('Transaction failed');
    mockError.method = 'swapETH';
    
    const errorResult = handleBridgeError(mockError, 'ETH', 'ethereum', 'optimism');
    
    expect(errorResult.type).to.equal('swap_error');
    expect(errorResult.message).to.include('Swap failed');
  });
  
  test('Should handle network-specific errors', () => {
    // Different error patterns for different chains
    const testCases = [
      {
        sourceChain: 'base',
        destChain: 'arbitrum',
        token: 'USDC',
        error: new Error('missing revert data in call exception')
      },
      {
        sourceChain: 'ethereum',
        destChain: 'optimism',
        token: 'ETH',
        error: new Error('transaction reverted without a reason string')
      },
      {
        sourceChain: 'base',
        destChain: 'polygon',
        token: 'USDT',
        error: new Error('call revert exception')
      }
    ];
    
    for (const testCase of testCases) {
      const errorResult = handleBridgeError(
        testCase.error, 
        testCase.token, 
        testCase.sourceChain, 
        testCase.destChain
      );
      
      expect(errorResult).to.be.an('object');
      // The default unknown error type just returns the original error message
      // Test that we always get a response object with expected properties
      expect(errorResult).to.have.property('type');
      expect(errorResult).to.have.property('message');
      
      if (errorResult.type === 'swap_error' || errorResult.type === 'fee_estimation_error') {
        // For known error types, we expect the token in the message
        expect(errorResult.message).to.include(testCase.token);
      }
    }
  });
}); 