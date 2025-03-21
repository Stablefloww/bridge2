import { selectOptimalRoute } from '../routeSelector'
import { mockBridgeProviders } from '../../../test-utils/mocks'

describe('Route Selection', () => {
  test('selects route with lowest fee', async () => {
    const routes = await mockBridgeProviders.getRoutes()
    const selected = selectOptimalRoute(routes)
    
    expect(selected.provider).toBe('Stargate')
    expect(selected.fee).toBe('0.1')
  })
}) 