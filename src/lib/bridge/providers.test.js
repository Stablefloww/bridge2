import { jest } from '@jest/globals';
import { getBridgeRoutes, executeBridge, calculateStargateFees, getLZChainId, getPoolId } from './providers.js';
import { ethers } from 'ethers';

// Mock ethers
jest.mock('ethers', () => {
  const original = jest.requireActual('ethers');
  return {
    ...original,
    Contract: jest.fn().mockImplementation(() => ({
      quoteLayerZeroFee: jest.fn().mockResolvedValue([
        ethers.utils.parseEther('0.01'), // native fee
        ethers.utils.parseEther('0.005')  // LZ fee
      ]),
      decimals: jest.fn().mockResolvedValue(18),
      token: jest.fn().mockResolvedValue('0xmocktoken'),
      allowance: jest.fn().mockResolvedValue(ethers.utils.parseEther('10')),
      approve: jest.fn().mockResolvedValue({
        wait: jest.fn().mockResolvedValue(true)
      }),
      swap: jest.fn().mockResolvedValue({
        hash: '0xmocktxhash',
        wait: jest.fn().mockResolvedValue({ transactionHash: '0xmocktxhash' })
      }),
      getPool: jest.fn().mockResolvedValue('0xmockpool')
    })),
    utils: {
      parseEther: jest.fn(amount => ({ toString: () => amount })),
      parseUnits: jest.fn((amount, decimals) => ({ 
        mul: jest.fn(() => ({
          div: jest.fn(() => ethers.utils.parseUnits(amount, decimals))
        })),
        sub: jest.fn(() => ethers.utils.parseUnits(amount, decimals)),
        lt: jest.fn(() => false),
        toString: () => amount
      })),
      formatEther: jest.fn(amount => amount.toString()),
      formatUnits: jest.fn((amount, decimals) => amount.toString()),
      solidityPack: jest.fn(() => '0xmockbytes'),
      defaultAbiCoder: {
        encode: jest.fn(() => '0xmockencoded')
      }
    }
  };
});

// Mock the biconomy integration
jest.mock('../gasless/biconomy', () => ({
  isGaslessSupported: jest.fn(() => true),
  executeBridgeWithGasAbstraction: jest.fn().mockResolvedValue({
    transactionHash: '0xmockgaslesstx'
  })
}));

// Mock token utils
jest.mock('../tokens/tokenUtils', () => ({
  getTokenContract: jest.fn().mockResolvedValue({
    decimals: jest.fn().mockResolvedValue(18),
    address: '0xmocktokenaddress'
  }),
  parseTokenAmount: jest.fn(amount => ({
    mul: jest.fn(() => ({ div: jest.fn(() => '1000000') }))
  })),
  formatTokenAmount: jest.fn(() => '0.01')
}));

describe('Bridge Providers', () => {
  let mockSigner;
  
  beforeEach(() => {
    mockSigner = {
      provider: {
        getNetwork: jest.fn().mockResolvedValue({ chainId: 8453 })
      },
      getAddress: jest.fn().mockResolvedValue('0xmockuser')
    };
    
    jest.clearAllMocks();
  });
  
  describe('Chain and Pool ID Functions', () => {
    test('getLZChainId should return correct Layer Zero chain ID', () => {
      expect(getLZChainId('ethereum')).toBe(101);
      expect(getLZChainId('base')).toBe(184);
      expect(getLZChainId('arbitrum')).toBe(110);
      
      expect(() => getLZChainId('unsupported')).toThrow();
    });
    
    test('getPoolId should return correct pool ID for token on chain', () => {
      expect(getPoolId('ethereum', 'USDC')).toBe(1);
      expect(getPoolId('base', 'ETH')).toBe(13);
      
      expect(() => getPoolId('unsupported', 'USDC')).toThrow();
      expect(() => getPoolId('ethereum', 'UNSUPPORTED')).toThrow();
    });
  });
  
  describe('Fee Calculation', () => {
    test('calculateStargateFees should calculate fees correctly', async () => {
      const fees = await calculateStargateFees({
        sourceChain: 'base',
        destChain: 'ethereum',
        signer: mockSigner,
        amount: '100',
        tokenSymbol: 'USDC'
      });
      
      expect(fees).toBeDefined();
      expect(fees.nativeFee).toBeDefined();
      expect(fees.stargateFee).toBeDefined();
      expect(fees.estimatedTimeMinutes).toBeGreaterThan(0);
    });
    
    test('calculateStargateFees should handle errors', async () => {
      // Override mock to throw error
      ethers.Contract.mockImplementationOnce(() => ({
        quoteLayerZeroFee: jest.fn().mockRejectedValue(new Error('Mock error'))
      }));
      
      await expect(calculateStargateFees({
        sourceChain: 'base',
        destChain: 'ethereum',
        signer: mockSigner,
        amount: '100',
        tokenSymbol: 'USDC'
      })).rejects.toThrow();
    });
  });
  
  describe('Bridge Routes', () => {
    test('getBridgeRoutes should return available routes', async () => {
      const routes = await getBridgeRoutes({
        sourceChain: 'base',
        destChain: 'ethereum',
        tokenSymbol: 'USDC',
        amount: '100',
        signer: mockSigner
      });
      
      expect(routes).toBeDefined();
      expect(routes.length).toBe(1);
      expect(routes[0].provider).toBe('Stargate');
      expect(routes[0].sourceChain).toBe('base');
      expect(routes[0].destChain).toBe('ethereum');
    });
    
    test('getBridgeRoutes should return empty array for unsupported token', async () => {
      const routes = await getBridgeRoutes({
        sourceChain: 'base',
        destChain: 'ethereum',
        tokenSymbol: 'UNSUPPORTED',
        amount: '100',
        signer: mockSigner
      });
      
      expect(routes).toEqual([]);
    });
  });
  
  describe('Bridge Execution', () => {
    test('executeBridge should execute bridge transaction', async () => {
      const result = await executeBridge({
        sourceChain: 'base',
        destChain: 'ethereum',
        tokenSymbol: 'USDC',
        amount: '100',
        signer: mockSigner,
        slippageTolerance: 0.5
      });
      
      expect(result).toBeDefined();
      expect(result.transactionHash).toBeDefined();
      expect(result.sourceChain).toBe('base');
      expect(result.destChain).toBe('ethereum');
    });
    
    test('executeBridge should use gas abstraction when requested', async () => {
      const result = await executeBridge({
        sourceChain: 'base',
        destChain: 'ethereum',
        tokenSymbol: 'USDC',
        amount: '100',
        signer: mockSigner,
        slippageTolerance: 0.5,
        useGasAbstraction: true
      });
      
      expect(result).toBeDefined();
      expect(result.transactionHash).toBe('0xmockgaslesstx');
    });
    
    test('executeBridge should throw for unsupported chains', async () => {
      await expect(executeBridge({
        sourceChain: 'unsupported',
        destChain: 'ethereum',
        tokenSymbol: 'USDC',
        amount: '100',
        signer: mockSigner
      })).rejects.toThrow();
    });
  });
}); 