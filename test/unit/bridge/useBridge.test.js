import { jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react-hooks';

// Mock functions
const mockExecuteBridge = jest.fn();
const mockExecuteStargateBridgeWithTokenFees = jest.fn();
const mockStartBridgeMonitoring = jest.fn();

// Mock the modules
jest.mock('../../../src/lib/bridge/providers', () => ({
  executeBridge: mockExecuteBridge
}));

jest.mock('../../../src/lib/gasless/biconomy', () => ({
  executeStargateBridgeWithTokenFees: mockExecuteStargateBridgeWithTokenFees
}));

jest.mock('../../../src/lib/bridge/monitor', () => ({
  startBridgeMonitoring: mockStartBridgeMonitoring,
  BRIDGE_STATUS: {
    PENDING: 'PENDING',
    SOURCE_CONFIRMED: 'SOURCE_CONFIRMED',
    DESTINATION_PENDING: 'DESTINATION_PENDING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    UNKNOWN: 'UNKNOWN'
  }
}));

// Import the actual module after mocking
import useBridge from '../../../src/hooks/useBridge';

describe('useBridge hook', () => {
  const mockSigner = {
    getAddress: jest.fn().mockResolvedValue('0xmockuseraddress'),
    provider: {
      getNetwork: jest.fn().mockResolvedValue({ chainId: 8453 }) // Base chain ID
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up mock implementations
    mockExecuteBridge.mockResolvedValue({
      transactionHash: '0xmocktransactionhash',
      provider: { network: { chainId: 8453 } }
    });
    
    mockExecuteStargateBridgeWithTokenFees.mockResolvedValue({
      transactionHash: '0xmocktokenfeetransactionhash',
      provider: { network: { chainId: 8453 } }
    });
    
    mockStartBridgeMonitoring.mockReturnValue({
      cancel: jest.fn()
    });
  });

  test('should initialize with default values', () => {
    const { result } = renderHook(() => useBridge(mockSigner));

    expect(result.current.routes).toEqual([]);
    expect(result.current.selectedRoute).toBeNull();
    expect(result.current.isLoadingRoutes).toBe(false);
    expect(result.current.isBridging).toBe(false);
    expect(result.current.bridgeError).toBeNull();
    expect(result.current.useGasAbstraction).toBe(false);
    expect(result.current.useTokenFees).toBe(false);
  });

  test('should toggle useTokenFees state', () => {
    const { result } = renderHook(() => useBridge(mockSigner));
    
    // Initial state should be false
    expect(result.current.useTokenFees).toBe(false);
    
    // Toggle to true
    act(() => {
      result.current.toggleTokenFees();
    });
    
    expect(result.current.useTokenFees).toBe(true);
    
    // Toggle back to false
    act(() => {
      result.current.toggleTokenFees();
    });
    
    expect(result.current.useTokenFees).toBe(false);
  });

  test('should execute bridge with standard method when useTokenFees is false', async () => {
    const { result } = renderHook(() => useBridge(mockSigner));
    
    const bridgeParams = {
      sourceChain: 'base',
      destChain: 'ethereum',
      tokenSymbol: 'USDC',
      amount: '100',
      slippageTolerance: 0.5
    };
    
    await act(async () => {
      await result.current.bridge(bridgeParams);
    });
    
    expect(mockExecuteBridge).toHaveBeenCalledWith({
      sourceChain: 'base',
      destChain: 'ethereum',
      tokenSymbol: 'USDC',
      amount: '100',
      slippageTolerance: 0.5,
      signer: mockSigner,
      useGasAbstraction: false
    });
    
    expect(mockExecuteStargateBridgeWithTokenFees).not.toHaveBeenCalled();
  });

  test('should execute bridge with token fees when useTokenFees is true', async () => {
    const { result } = renderHook(() => useBridge(mockSigner));
    
    // Set useTokenFees to true
    act(() => {
      result.current.toggleTokenFees();
    });
    
    const bridgeParams = {
      sourceChain: 'base',
      destChain: 'ethereum',
      tokenSymbol: 'USDC',
      amount: '100',
      slippageTolerance: 0.5
    };
    
    await act(async () => {
      await result.current.bridge(bridgeParams);
    });
    
    expect(mockExecuteStargateBridgeWithTokenFees).toHaveBeenCalledWith({
      sourceChain: 'base',
      destChain: 'ethereum',
      tokenSymbol: 'USDC',
      amount: '100',
      wallet: mockSigner
    });
    
    expect(mockExecuteBridge).not.toHaveBeenCalled();
  });

  test('should override useTokenFees with parameter if provided', async () => {
    const { result } = renderHook(() => useBridge(mockSigner));
    
    // State is false, but parameter is true
    const bridgeParams = {
      sourceChain: 'base',
      destChain: 'ethereum',
      tokenSymbol: 'USDC',
      amount: '100',
      slippageTolerance: 0.5,
      useTokenFeesParam: true
    };
    
    await act(async () => {
      await result.current.bridge(bridgeParams);
    });
    
    expect(mockExecuteStargateBridgeWithTokenFees).toHaveBeenCalledWith({
      sourceChain: 'base',
      destChain: 'ethereum',
      tokenSymbol: 'USDC',
      amount: '100',
      wallet: mockSigner
    });
    
    expect(mockExecuteBridge).not.toHaveBeenCalled();
  });

  test('should handle bridge errors correctly', async () => {
    const errorMessage = 'Test bridge error';
    mockExecuteBridge.mockRejectedValueOnce(new Error(errorMessage));
    
    const { result } = renderHook(() => useBridge(mockSigner));
    
    const bridgeParams = {
      sourceChain: 'base',
      destChain: 'ethereum',
      tokenSymbol: 'USDC',
      amount: '100'
    };
    
    await act(async () => {
      await result.current.bridge(bridgeParams);
    });
    
    expect(result.current.bridgeError).toBe(`Bridge failed: ${errorMessage}`);
    expect(result.current.isBridging).toBe(false);
  });
}); 