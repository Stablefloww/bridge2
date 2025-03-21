import { jest } from '@jest/globals';
import { isGaslessSupported, estimateGaslessTransactionCost, executeBridgeWithGasAbstraction } from './biconomy.js';
import { ethers } from 'ethers';

// Mock Biconomy
jest.mock('@biconomy/mexa', () => {
  return {
    Biconomy: jest.fn().mockImplementation(() => {
      return {
        onEvent: jest.fn((eventName, callback) => {
          if (eventName === 'txHashGenerated') {
            callback({ transactionHash: '0xmocktxhash' });
          }
          if (eventName === 'txMined') {
            callback({ transactionHash: '0xmocktxhash' });
          }
        }),
        getERC20ForwarderClient: jest.fn(() => ({
          req: jest.fn(),
          getDataToSign: jest.fn(() => ({
            data: 'mockData',
            getNonce: jest.fn().mockResolvedValue('1'),
            getWalletClient: jest.fn(),
          })),
          getDomainSeperator: jest.fn(() => 'mockDomain'),
          executeMetaTransaction: jest.fn().mockResolvedValue({ hash: '0xmockhash' }),
        })),
      };
    }),
  };
});

// Mock ethers
jest.mock('ethers', () => {
  return {
    Contract: jest.fn(() => ({
      address: '0xmockcontract',
      interface: {
        encodeFunctionData: jest.fn(() => '0xmockdata'),
      },
    })),
    Wallet: jest.fn(() => ({
      address: '0xmockwallet',
      signMessage: jest.fn(() => 'mocksignature'),
    })),
    JsonRpcProvider: jest.fn(() => ({
      getNetwork: jest.fn(() => ({ chainId: 1 })),
      estimateGas: jest.fn(() => ethers.BigNumber.from('100000')),
      getGasPrice: jest.fn(() => ethers.BigNumber.from('20000000000')),
    })),
    utils: {
      parseUnits: jest.fn((value) => ethers.BigNumber.from(value)),
      formatUnits: jest.fn((value) => '0.01'),
      keccak256: jest.fn(() => '0xmockhash'),
      defaultAbiCoder: {
        encode: jest.fn(() => '0xmockencoded'),
      },
      splitSignature: jest.fn(() => ({
        v: 28,
        r: '0xmockr',
        s: '0xmocks',
      })),
    },
    BigNumber: {
      from: jest.fn((value) => ({
        mul: jest.fn(() => ({ div: jest.fn(() => ({ toString: () => '1000000000000000' })) })),
        toString: () => value.toString(),
      })),
    },
  };
});

describe('Biconomy Gas Abstraction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('isGaslessSupported should check if a token on a chain supports gas abstraction', () => {
    // Test for supported tokens/chains
    expect(isGaslessSupported('base', 'USDC')).toBe(true);
    expect(isGaslessSupported('ethereum', 'USDC')).toBe(true);
    
    // Test for unsupported tokens/chains
    expect(isGaslessSupported('fantom', 'XYZ')).toBe(false);
    expect(isGaslessSupported('nonexistentchain', 'USDC')).toBe(false);
  });

  test('estimateGaslessTransactionCost should calculate gas costs', async () => {
    const mockProvider = new ethers.JsonRpcProvider();
    const mockContract = new ethers.Contract();
    
    const estimate = await estimateGaslessTransactionCost({
      chainName: 'base',
      tokenSymbol: 'USDC',
      provider: mockProvider,
      contract: mockContract,
      method: 'approve',
      params: ['0xspender', '1000000'],
    });
    
    expect(estimate).toBeDefined();
    expect(estimate.gasAmount).toBeDefined();
    expect(estimate.gasCostInToken).toBeDefined();
    expect(estimate.gasCostInNative).toBeDefined();
  });

  test('executeBridgeWithGasAbstraction should execute transaction with Biconomy', async () => {
    const mockWallet = new ethers.Wallet();
    const mockContract = new ethers.Contract();
    
    const result = await executeBridgeWithGasAbstraction({
      chainName: 'base',
      contract: mockContract,
      method: 'approve',
      params: ['0xspender', '1000000'],
      wallet: mockWallet,
    });
    
    expect(result).toBeDefined();
    expect(result.transactionHash).toBeDefined();
    expect(result.transactionHash).toBe('0xmocktxhash');
  });

  test('executeBridgeWithGasAbstraction should throw error for unsupported chain', async () => {
    const mockWallet = new ethers.Wallet();
    const mockContract = new ethers.Contract();
    
    await expect(
      executeBridgeWithGasAbstraction({
        chainName: 'nonexistentchain',
        contract: mockContract,
        method: 'approve',
        params: ['0xspender', '1000000'],
        wallet: mockWallet,
      })
    ).rejects.toThrow('Gas abstraction not supported for chain: nonexistentchain');
  });

  test('executeBridgeWithGasAbstraction should handle errors during execution', async () => {
    // Mock implementation that throws an error
    const mockErrorBiconomy = {
      onEvent: jest.fn(),
      getERC20ForwarderClient: jest.fn(() => {
        throw new Error('Biconomy error');
      }),
    };
    
    // Override the mock implementation for this test
    jest.mock('@biconomy/mexa', () => {
      return {
        Biconomy: jest.fn().mockImplementation(() => mockErrorBiconomy),
      };
    });
    
    const mockWallet = new ethers.Wallet();
    const mockContract = new ethers.Contract();
    
    await expect(
      executeBridgeWithGasAbstraction({
        chainName: 'base',
        contract: mockContract,
        method: 'approve',
        params: ['0xspender', '1000000'],
        wallet: mockWallet,
      })
    ).rejects.toThrow();
  });
}); 