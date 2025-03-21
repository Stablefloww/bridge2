export const mockBridgeProviders = {
  getRoutes: jest.fn().mockResolvedValue([
    { provider: 'Stargate', fee: '0.1', time: 300 },
    { provider: 'Hop', fee: '0.15', time: 120 }
  ])
}

export const mockNLP = {
  parseCommand: jest.fn().mockResolvedValue({
    sourceChain: 'ethereum',
    destChain: 'polygon',
    token: 'USDC',
    amount: '100'
  })
} 