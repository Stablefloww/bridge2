import { parseCommand } from '../nlpProcessor'
import { mockNLP } from '../../../test-utils/mocks'

describe('NLP Processing', () => {
  beforeEach(() => {
    mockNLP.parseCommand.mockClear()
  })

  test('parses valid bridge command', async () => {
    const command = "Send 100 USDC from Ethereum to Polygon"
    const result = await parseCommand(command)
    
    expect(result).toEqual({
      sourceChain: 'ethereum',
      destChain: 'polygon',
      token: 'USDC',
      amount: '100'
    })
    expect(mockNLP.parseCommand).toHaveBeenCalledWith(command)
  })
}) 