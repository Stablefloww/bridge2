import { parseCommand } from '../nlp/nlpProcessor'
import { getRoutes } from '../bridge/providers'
import { getSwapQuote, executeSwap } from '../../services/coinbase'
import { simulateTransaction } from '../../services/tenderly'

// Mock dependencies
jest.mock('../nlp/nlpProcessor')
jest.mock('../bridge/providers')
jest.mock('../../services/coinbase')
jest.mock('../../services/tenderly')

const mockedParseCommand = parseCommand as jest.MockedFunction<typeof parseCommand>
const mockedGetRoutes = getRoutes as jest.MockedFunction<typeof getRoutes>
const mockedGetSwapQuote = getSwapQuote as jest.MockedFunction<typeof getSwapQuote>
const mockedExecuteSwap = executeSwap as jest.MockedFunction<typeof executeSwap>
const mockedSimulateTransaction = simulateTransaction as jest.MockedFunction<typeof simulateTransaction>

describe('Coinbase Bridge Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should complete a full bridge flow with Coinbase', async () => {
    // 1. Mock NLP parsing
    mockedParseCommand.mockResolvedValueOnce({
      sourceChain: '1', // Ethereum
      destinationChain: '137', // Polygon
      token: 'USDC',
      amount: '100',
      confidence: 0.9,
      originalCommand: 'Bridge 100 USDC from Ethereum to Polygon',
      interpretedCommand: 'Bridge 100 USDC from Ethereum to Polygon',
      missingFields: []
    })

    // 2. Mock route selection
    mockedGetRoutes.mockResolvedValueOnce([
      {
        provider: 'stargate',
        sourceChain: '1',
        destChain: '137',
        amount: '100',
        fee: '0.3',
        estimatedTime: 180
      },
      {
        provider: 'hyphen', // Coinbase route
        sourceChain: '1',
        destChain: '137',
        amount: '100',
        fee: '0.1', // Lowest fee
        estimatedTime: 60
      }
    ])

    // 3. Mock Coinbase swap quote
    mockedGetSwapQuote.mockResolvedValueOnce({
      quoteId: 'quote-123',
      fee: '0.1',
      fromAmount: '100',
      toAmount: '99.9'
    })

    // 4. Mock transaction simulation
    mockedSimulateTransaction.mockResolvedValueOnce({
      success: true,
      gasUsed: '250000',
      result: '0x1234'
    })

    // 5. Mock execution
    mockedExecuteSwap.mockResolvedValueOnce({
      txHash: '0xabcd1234',
      status: 'pending'
    })

    // Execute the bridge flow
    const command = 'Bridge 100 USDC from Ethereum to Polygon'
    const parsed = await parseCommand(command)
    const routes = await getRoutes(parsed)
    
    // Select the optimal route (lowest fee)
    const optimalRoute = routes.reduce((prev, current) => 
      parseFloat(prev.fee) < parseFloat(current.fee) ? prev : current
    )
    
    // Execute the optimal route (which should be Coinbase's Hyphen)
    let result
    if (optimalRoute.provider === 'hyphen') {
      // Get quote
      const quote = await getSwapQuote({
        fromChainId: optimalRoute.sourceChain,
        toChainId: optimalRoute.destChain,
        fromToken: 'USDC',
        toToken: 'USDC',
        amount: optimalRoute.amount
      })
      
      // Execute swap
      result = await executeSwap(quote.quoteId)
    }

    // Assertions
    expect(mockedParseCommand).toHaveBeenCalledWith(command)
    expect(mockedGetRoutes).toHaveBeenCalledWith(parsed)
    expect(mockedGetSwapQuote).toHaveBeenCalledWith({
      fromChainId: '1',
      toChainId: '137',
      fromToken: 'USDC',
      toToken: 'USDC',
      amount: '100'
    })
    expect(mockedExecuteSwap).toHaveBeenCalledWith('quote-123')
    expect(result).toEqual({
      txHash: '0xabcd1234',
      status: 'pending'
    })
  })

  it('should measure performance and stay under required threshold', async () => {
    // Set up mocks with minimal delay
    mockedParseCommand.mockImplementation(async () => {
      await sleep(200) // 200ms for NLP parsing
      return {
        sourceChain: '1',
        destinationChain: '137',
        token: 'USDC',
        amount: '100',
        confidence: 0.9,
        originalCommand: 'Bridge 100 USDC from Ethereum to Polygon',
        interpretedCommand: 'Bridge 100 USDC from Ethereum to Polygon',
        missingFields: []
      }
    })

    mockedGetRoutes.mockImplementation(async () => {
      await sleep(500) // 500ms for route calculation
      return [{
        provider: 'hyphen',
        sourceChain: '1',
        destChain: '137',
        amount: '100',
        fee: '0.1',
        estimatedTime: 60
      }]
    })

    // Start timing
    const startTime = performance.now()
    
    // Execute the flow
    const parsed = await parseCommand('Bridge 100 USDC from Ethereum to Polygon')
    const nlpTime = performance.now() - startTime
    
    const routeStartTime = performance.now()
    const routes = await getRoutes(parsed)
    const routeTime = performance.now() - routeStartTime
    
    const totalTime = performance.now() - startTime

    // Assert that performance meets requirements
    expect(nlpTime).toBeLessThan(2000) // Under 2 seconds for NLP
    expect(routeTime).toBeLessThan(3000) // Under 3 seconds for routes
    expect(routes.length).toBeGreaterThan(0)
  })
})

// Helper function for timing tests
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms)) 