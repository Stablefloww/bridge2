import axios from 'axios'
import { createHmac } from 'crypto'

// Coinbase API credentials from environment variables
const COINBASE_API_KEY_NAME = process.env.NEXT_PUBLIC_COINBASE_API_KEY_NAME || "builder"
const COINBASE_API_PRIVATE_KEY = process.env.NEXT_PUBLIC_COINBASE_API_PRIVATE_KEY || "GhWH4bSLv0WTMY0Jq3x6r3YmpvFf9BBZYeYFUfit7t4vdkEBIpg10f8FjOY+63pPzJ4qV39LKVx3zAeWWFU8Bg=="
const COINBASE_PROJECT_ID = process.env.NEXT_PUBLIC_COINBASE_PROJECT_ID || "3563a2d7-bde9-46d7-bf48-c28eaf7e1772"
const COINBASE_KEY_ID = process.env.NEXT_PUBLIC_COINBASE_KEY_ID || "e51be061-9079-4aae-a45c-0e1171b1b9e8"

const BASE_URL =  "https://api.coinbase.com/api/v3"

/**
 * Creates signature for Coinbase API requests
 */
const createSignature = (timestamp: string, method: string, requestPath: string, body: string = '') => {
  const message = timestamp + method + requestPath + body
  const signature = createHmac('sha256', COINBASE_API_PRIVATE_KEY)
    .update(message)
    .digest('base64')
  return signature
}

/**
 * Makes authenticated request to Coinbase API
 */
const makeRequest = async (method: string, endpoint: string, data?: any) => {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const requestPath = `/api/v3${endpoint}`
  const body = data ? JSON.stringify(data) : ''
  
  const signature = createSignature(timestamp, method, requestPath, body)
  
  const headers = {
    'Content-Type': 'application/json',
    'CB-ACCESS-KEY': COINBASE_KEY_ID,
    'CB-ACCESS-SIGN': signature,
    'CB-ACCESS-TIMESTAMP': timestamp,
    'CB-PROJECT-ID': COINBASE_PROJECT_ID
  }
  
  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${endpoint}`,
      headers,
      data: data || undefined
    })
    
    return response.data
  } catch (error) {
    console.error('Coinbase API error:', error)
    throw error
  }
}

/**
 * Gets account balances from Coinbase
 */
export const getBalances = async (chainId: string) => {
  return makeRequest('GET', '/balances')
}

/**
 * Creates a payment for bridging
 */
export const createPayment = async (params: {
  amount: string,
  currency: string,
  description: string
}) => {
  return makeRequest('POST', '/payments', params)
}

/**
 * Gets quote for token swap between chains
 */
export const getSwapQuote = async (params: {
  fromChainId: string,
  toChainId: string,
  fromToken: string,
  toToken: string,
  amount: string
}) => {
  return makeRequest('POST', '/swap/quote', params)
}

/**
 * Executes token swap between chains
 */
export const executeSwap = async (quoteId: string) => {
  return makeRequest('POST', `/swap/execute`, { quoteId })
} 