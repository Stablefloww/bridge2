import { ethers } from 'ethers';
import { 
  getBridgeRoutes, 
  calculateStargateFees, 
  getLZChainId, 
  getPoolId 
} from '../bridge/providers.js';

describe('Bridge Providers', () => {
  // Mock provider and signer for testing
  let provider;
  let signer;
  
  beforeEach(() => {
    // Create a mock provider and wallet
    provider = new ethers.JsonRpcProvider();
    
    // Create a random wallet
    const wallet = ethers.Wallet.createRandom();
    signer = wallet.connect(provider);
    
    // Mock provider methods that might be called
    provider.getNetwork = jest.fn().mockResolvedValue({ chainId: 8453 }); // Base
    provider.getBalance = jest.fn().mockResolvedValue(ethers.parseEther('10'));
  });
  
  test('getLZChainId should return correct chain ID for supported chains', () => {
    expect(getLZChainId('Ethereum')).toBe(101);
    expect(getLZChainId('Base')).toBe(184);
    expect(getLZChainId('Arbitrum')).toBe(110);
    expect(getLZChainId('Optimism')).toBe(111);
    
    // Should throw for unsupported chain
    expect(() => getLZChainId('Nonsense Chain')).toThrow();
  });
  
  test('getPoolId should return correct pool ID for tokens on chains', () => {
    expect(getPoolId('USDC', 'Ethereum')).toBe(1);
    expect(getPoolId('USDC', 'Base')).toBe(1);
    expect(getPoolId('ETH', 'Ethereum')).toBe(13);
    expect(getPoolId('ETH', 'Base')).toBe(13);
    
    // Should throw for unsupported token
    expect(() => getPoolId('UNKNOWN', 'Ethereum')).toThrow();
  });
  
  test('calculateStargateFees should calculate fees correctly', async () => {
    // Mock implementation of calculateStargateFees
    // In a real test, you would need to mock the contract calls
    
    const fees = await calculateStargateFees({
      sourceChain: 'Base',
      destChain: 'Ethereum',
      tokenSymbol: 'USDC',
      amount: '100',
      signer
    });
    
    // Validate fee structure
    expect(fees).toHaveProperty('bridgeFee');
    expect(fees).toHaveProperty('gasFee');
    expect(fees).toHaveProperty('totalFee');
    
    // Fees should be positive numbers
    expect(parseFloat(fees.bridgeFee)).toBeGreaterThan(0);
    expect(parseFloat(fees.gasFee)).toBeGreaterThan(0);
    expect(parseFloat(fees.totalFee)).toBeGreaterThan(0);
  });
  
  test('getBridgeRoutes should return routes for valid parameters', async () => {
    // Mock implementation of getBridgeRoutes
    // In a real test, you would need to mock contract calls
    
    const routes = await getBridgeRoutes({
      sourceChain: 'Base',
      destChain: 'Ethereum',
      tokenSymbol: 'USDC',
      amount: '100',
      signer
    });
    
    // Validate route structure
    expect(Array.isArray(routes)).toBe(true);
    expect(routes.length).toBeGreaterThan(0);
    
    const route = routes[0];
    expect(route).toHaveProperty('provider');
    expect(route).toHaveProperty('sourceChain');
    expect(route).toHaveProperty('destChain');
    expect(route).toHaveProperty('token');
    expect(route).toHaveProperty('amount');
    expect(route).toHaveProperty('estimatedGas');
    expect(route).toHaveProperty('bridgeFee');
    expect(route).toHaveProperty('estimatedTime');
    
    // Specific values
    expect(route.provider).toBe('Stargate');
    expect(route.sourceChain).toBe('Base');
    expect(route.destChain).toBe('Ethereum');
    expect(route.token).toBe('USDC');
  });
  
  test('getBridgeRoutes should throw for unsupported chains', async () => {
    await expect(
      getBridgeRoutes({
        sourceChain: 'Nonsense Chain',
        destChain: 'Ethereum',
        tokenSymbol: 'USDC',
        amount: '100',
        signer
      })
    ).rejects.toThrow();
  });
  
  test('getBridgeRoutes should throw for unsupported tokens', async () => {
    await expect(
      getBridgeRoutes({
        sourceChain: 'Base',
        destChain: 'Ethereum',
        tokenSymbol: 'NONSENSETOKEN',
        amount: '100',
        signer
      })
    ).rejects.toThrow();
  });
}); 