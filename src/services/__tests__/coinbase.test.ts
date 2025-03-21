import { createHmac } from 'crypto'
import axios from 'axios'
import { getBalances, getSwapQuote, executeSwap } from '../coinbase'

// Mock axios
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

// Mock crypto
jest.mock('crypto', () => ({
  createHmac: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('mocked-signature')
  })
}))

describe('Coinbase Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  describe('getBalances', () => {
    it('should make a GET request to /balances', async () => {
      // Mock response
      const mockResponse = {
        data: {
          balances: [
            { token: 'ETH', amount: '1.5' },
            { token: 'USDC', amount: '100.0' }
          ]
        }
      }
      mockedAxios.mockResolvedValueOnce(mockResponse)
      
      // Call the function
      const result = await getBalances('1')
      
      // Assertions
      expect(mockedAxios).toHaveBeenCalledTimes(1)
      expect(mockedAxios).toHaveBeenCalledWith(expect.objectContaining({
        method: 'GET',
        url: 'https://api.coinbase.com/api/v3/balances'
      }))
      expect(result).toEqual(mockResponse.data)
    })
    
    it('should handle errors correctly', async () => {
      // Mock error
      const mockError = new Error('Network error')
      mockedAxios.mockRejectedValueOnce(mockError)
      
      // Call function and assert it throws
      await expect(getBalances('1')).rejects.toThrow('Network error')
    })
  })
  
  describe('getSwapQuote', () => {
    it('should make a POST request to /swap/quote with correct parameters', async () => {
      // Mock response
      const mockResponse = {
        data: {
          quoteId: 'quote-123',
          fee: '0.12',
          fromAmount: '100',
          toAmount: '99.5'
        }
      }
      mockedAxios.mockResolvedValueOnce(mockResponse)
      
      // Parameters
      const params = {
        fromChainId: '1',
        toChainId: '137',
        fromToken: 'USDC',
        toToken: 'USDC',
        amount: '100'
      }
      
      // Call the function
      const result = await getSwapQuote(params)
      
      // Assertions
      expect(mockedAxios).toHaveBeenCalledTimes(1)
      expect(mockedAxios).toHaveBeenCalledWith(expect.objectContaining({
        method: 'POST',
        url: 'https://api.coinbase.com/api/v3/swap/quote',
        data: params
      }))
      expect(result).toEqual(mockResponse.data)
    })
  })
  
  describe('executeSwap', () => {
    it('should make a POST request to /swap/execute with quoteId', async () => {
      // Mock response
      const mockResponse = {
        data: {
          txHash: '0x123...',
          status: 'pending'
        }
      }
      mockedAxios.mockResolvedValueOnce(mockResponse)
      
      // Call the function
      const result = await executeSwap('quote-123')
      
      // Assertions
      expect(mockedAxios).toHaveBeenCalledTimes(1)
      expect(mockedAxios).toHaveBeenCalledWith(expect.objectContaining({
        method: 'POST',
        url: 'https://api.coinbase.com/api/v3/swap/execute',
        data: { quoteId: 'quote-123' }
      }))
      expect(result).toEqual(mockResponse.data)
    })
  })
  
  describe('Signature generation', () => {
    it('should create the correct signature format', async () => {
      // Mock response
      mockedAxios.mockResolvedValueOnce({ data: {} })
      
      // Call function to trigger signature creation
      await getBalances('1')
      
      // Assert that createHmac was called correctly
      expect(createHmac).toHaveBeenCalledWith('sha256', expect.any(String))
    })
  })
}) 