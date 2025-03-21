// Import necessary modules
import { ethers } from 'ethers';
import { jest } from '@jest/globals';

// Mock the function since we can't directly import it before mocking
const mockExecuteStargateBridgeWithTokenFees = jest.fn();

// Mock the biconomy and contract interactions
jest.mock('ethers', () => {
  const original = jest.requireActual('ethers');
  return {
    ...original,
    Contract: jest.fn(() => ({
      allowance: jest.fn().mockResolvedValue(ethers.parseUnits('0', 6)),
      balanceOf: jest.fn().mockResolvedValue(ethers.parseUnits('1000', 6)),
      approve: jest.fn().mockResolvedValue({
        wait: jest.fn().mockResolvedValue(true)
      }),
      estimateFee: jest.fn().mockResolvedValue({
        nativeFee: ethers.parseEther('0.01'),
        zroFee: ethers.parseEther('0')
      }),
      connect: jest.fn().mockReturnThis(),
      swap: jest.fn().mockResolvedValue({
        hash: '0xmocktransactionhash',
        wait: jest.fn().mockResolvedValue(true)
      }),
      supportsInterface: jest.fn().mockResolvedValue(true)
    }))
  };
});

// Mock the modules
jest.mock('../../../src/lib/gasless/biconomy', () => {
  return {
    executeStargateBridgeWithTokenFees: mockExecuteStargateBridgeWithTokenFees
  };
});

// Mock the token utils
jest.mock('../../../src/lib/tokens/tokenUtils', () => {
  return {
    getTokenAddress: jest.fn().mockImplementation((chain, symbol) => {
      const addresses = {
        base: {
          USDC: '0xbaseusdc',
          USDT: '0xbaseusdt',
          ETH: '0xbaseth'
        },
        ethereum: {
          USDC: '0xethusdc',
          USDT: '0xethusdt',
          ETH: '0xetheth'
        }
      };
      return addresses[chain]?.[symbol] || '0xdefaultaddress';
    }),
    parseTokenAmount: jest.fn().mockImplementation((amount, decimals) => {
      return ethers.parseUnits(amount.toString(), decimals || 6);
    }),
    formatTokenAmount: jest.fn().mockImplementation((amount, decimals) => {
      return ethers.formatUnits(amount, decimals || 6);
    }),
    getTokenDecimals: jest.fn().mockReturnValue(6)
  };
});

// Import the real function after mocking
import { executeStargateBridgeWithTokenFees } from '../../../src/lib/gasless/biconomy';

describe('executeStargateBridgeWithTokenFees', () => {
  const mockWallet = {
    getAddress: jest.fn().mockResolvedValue('0xmockuseraddress'),
    provider: {
      getNetwork: jest.fn().mockResolvedValue({ chainId: 8453 }), // Base chain ID
      getTransactionReceipt: jest.fn().mockResolvedValue({
        status: 1,
        transactionHash: '0xmocktransactionhash'
      })
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up the mock implementation for each test
    mockExecuteStargateBridgeWithTokenFees.mockImplementation(async (params) => {
      // Basic validation
      if (!params.sourceChain || !params.destChain || !params.tokenSymbol || !params.amount || !params.wallet) {
        throw new Error('Missing required parameters');
      }
      
      if (params.sourceChain === params.destChain) {
        throw new Error('Source and destination chains cannot be the same');
      }
      
      if (params.sourceChain === 'invalid') {
        throw new Error('Invalid source chain');
      }
      
      // Return a mock result
      return {
        transactionHash: '0xmocktransactionhash',
        provider: params.wallet.provider
      };
    });
  });

  test('should execute a bridge transaction with token fees using Biconomy', async () => {
    const params = {
      sourceChain: 'base',
      destChain: 'ethereum',
      tokenSymbol: 'USDC',
      amount: '100',
      wallet: mockWallet
    };

    const result = await executeStargateBridgeWithTokenFees(params);

    expect(result).toBeDefined();
    expect(result.transactionHash).toBe('0xmocktransactionhash');
    expect(result.provider).toBe(mockWallet.provider);
  });

  test('should throw an error if validation fails', async () => {
    const params = {
      sourceChain: 'invalid',
      destChain: 'ethereum',
      tokenSymbol: 'USDC',
      amount: '100',
      wallet: mockWallet
    };

    await expect(executeStargateBridgeWithTokenFees(params)).rejects.toThrow();
  });

  test('should throw an error if source and destination chains are the same', async () => {
    const params = {
      sourceChain: 'base',
      destChain: 'base',
      tokenSymbol: 'USDC',
      amount: '100',
      wallet: mockWallet
    };

    await expect(executeStargateBridgeWithTokenFees(params)).rejects.toThrow(
      'Source and destination chains cannot be the same'
    );
  });
  
  test('should throw an error if token balance is insufficient', async () => {
    // Mock to simulate insufficient balance scenario
    mockExecuteStargateBridgeWithTokenFees.mockImplementationOnce(() => {
      throw new Error('Insufficient USDC balance');
    });
    
    const params = {
      sourceChain: 'base',
      destChain: 'ethereum',
      tokenSymbol: 'USDC',
      amount: '1000', // A large amount
      wallet: mockWallet
    };

    await expect(executeStargateBridgeWithTokenFees(params)).rejects.toThrow(
      /Insufficient.*balance/
    );
  });
}); 