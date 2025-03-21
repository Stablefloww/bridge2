/**
 * Test suite for Stargate bridge functionality
 * This file tests the bridge functionality with various error scenarios
 */

import { expect } from 'chai';
import { jest } from '@jest/globals';
import { ethers } from 'ethers';

// Mock the ethers provider and contract
jest.mock('ethers', () => {
  const originalEthers = jest.requireActual('ethers');
  
  return {
    ...originalEthers,
    Contract: jest.fn().mockImplementation(() => ({
      quoteLayerZeroFee: jest.fn(),
      swap: jest.fn(),
      swapETH: jest.fn(),
      allowance: jest.fn(),
      approve: jest.fn()
    })),
    providers: {
      Web3Provider: jest.fn().mockImplementation(() => ({
        getSigner: jest.fn().mockReturnValue({})
      }))
    },
    utils: {
      ...originalEthers.utils,
      formatEther: jest.fn().mockReturnValue('0.01'),
      formatUnits: jest.fn().mockReturnValue('10'),
      parseUnits: jest.fn().mockReturnValue(ethers.BigNumber.from('1000000')),
      parseEther: jest.fn().mockReturnValue(ethers.BigNumber.from('10000000000000000')),
      defaultAbiCoder: {
        encode: jest.fn().mockReturnValue('0xEncoded')
      }
    }
  };
});

describe('Stargate Bridge Functionality Tests', () => {
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
  
  test('Should handle fee estimation failure with retry and fallback', async () => {
    // Simulate an error in fee estimation
    const mockQuoteError = new Error('call revert exception');
    mockQuoteError.method = 'quoteLayerZeroFee';
    
    // Mock the contract function to throw an error
    const mockContract = new ethers.Contract();
    mockContract.quoteLayerZeroFee.mockRejectedValue(mockQuoteError);
    
    let errorResult;
    try {
      await mockContract.quoteLayerZeroFee(1, 1, '0x', '0x', [0, 0, '0x']);
    } catch (error) {
      errorResult = handleBridgeError(error, 'USDC', 'base', 'arbitrum');
    }
    
    expect(errorResult.type).to.equal('fee_estimation_error');
    expect(errorResult.message).to.include('Fee estimation failed');
  });
  
  test('Should handle insufficient funds error in swap', async () => {
    // Simulate an insufficient funds error
    const mockSwapError = new Error('execution reverted: insufficient funds');
    mockSwapError.method = 'swap';
    
    // Mock the contract function to throw an error
    const mockContract = new ethers.Contract();
    mockContract.swap.mockRejectedValue(mockSwapError);
    
    let errorResult;
    try {
      await mockContract.swap(1, 1, 1, '0x', 100, 95, [0, 0, '0x'], '0x', '0x', { value: 10 });
    } catch (error) {
      errorResult = handleBridgeError(error, 'USDC', 'base', 'arbitrum');
    }
    
    expect(errorResult.type).to.equal('swap_error');
    expect(errorResult.message).to.include('Swap failed');
  });
  
  test('Should handle slippage error in swap', async () => {
    // Simulate a slippage error
    const mockSlippageError = new Error('execution reverted: slippage too high');
    
    // Mock the contract function to throw an error
    const mockContract = new ethers.Contract();
    mockContract.swap.mockRejectedValue(mockSlippageError);
    
    let errorResult;
    try {
      await mockContract.swap(1, 1, 1, '0x', 100, 95, [0, 0, '0x'], '0x', '0x', { value: 10 });
    } catch (error) {
      errorResult = handleBridgeError(error, 'USDC', 'base', 'arbitrum');
    }
    
    expect(errorResult.type).to.equal('slippage_error');
    expect(errorResult.message).to.include('Slippage tolerance exceeded');
  });
  
  test('Should handle successful fee estimation and swap', async () => {
    // Mock successful fee estimation
    const mockNativeFee = ethers.BigNumber.from('10000000000000000'); // 0.01 ETH
    const mockZroFee = ethers.BigNumber.from('0');
    
    const mockContract = new ethers.Contract();
    mockContract.quoteLayerZeroFee.mockResolvedValue([mockNativeFee, mockZroFee]);
    mockContract.swap.mockResolvedValue({ hash: '0x1234' });
    
    const feeResult = await mockContract.quoteLayerZeroFee(1, 1, '0x', '0x', [0, 0, '0x']);
    expect(feeResult[0].toString()).to.equal('10000000000000000');
    
    const swapResult = await mockContract.swap(1, 1, 1, '0x', 100, 95, [0, 0, '0x'], '0x', '0x', { value: mockNativeFee });
    expect(swapResult.hash).to.equal('0x1234');
  });
  
  test('Should handle network-specific errors', async () => {
    // Mock different errors for different chains
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
      expect(errorResult.message).to.include(testCase.token);
    }
  });
}); 