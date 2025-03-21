import axios from 'axios'

const TENDERLY_API_URL = process.env.NEXT_PUBLIC_TENDERLY_API_URL || 'https://api.tenderly.co/api/v1'
const TENDERLY_ACCESS_TOKEN = process.env.NEXT_PUBLIC_TENDERLY_ACCESS_TOKEN || 'YB0YOsIshIb3dYOt0XOzLNhkkbHuRhhe'
const TENDERLY_ACCOUNT = process.env.NEXT_PUBLIC_TENDERLY_ACCOUNT || 'folajindayo'
const TENDERLY_PROJECT = process.env.NEXT_PUBLIC_TENDERLY_PROJECT || 'project'

interface SimulationRequest {
  network_id: string
  from: string
  to: string
  input: string
  gas: number
  gas_price: string
  value: string
  save: boolean
}

export const simulateTransaction = async (
  chainId: string, 
  txParams: {
    from: string
    to: string
    data: string
    value: string
  }
): Promise<any> => {
  const simulationRequest: SimulationRequest = {
    network_id: chainId,
    from: txParams.from,
    to: txParams.to,
    input: txParams.data,
    gas: 8000000,
    gas_price: '0',
    value: txParams.value || '0',
    save: true
  }
  
  try {
    const response = await axios.post(
      `${TENDERLY_API_URL}/account/${TENDERLY_ACCOUNT}/project/${TENDERLY_PROJECT}/simulate`,
      { simulation: simulationRequest },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Key': TENDERLY_ACCESS_TOKEN
        }
      }
    )
    
    return {
      success: response.data.simulation.status,
      gasUsed: response.data.simulation.gas_used,
      result: response.data.simulation.transaction.result
    }
  } catch (error) {
    console.error('Tenderly simulation failed:', error)
    throw error
  }
} 