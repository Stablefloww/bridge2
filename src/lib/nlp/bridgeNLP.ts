import { getChatCompletion } from '../ai/openai';
import { generateContent } from '../ai/gemini';
import { ethers } from 'ethers';
import { getStargateChainId } from '../bridges/stargate';

// Define types for bridge command parameters
export interface BridgeCommand {
  sourceChain?: string;
  destinationChain: string;
  token: string;
  amount: string;
  gasPreference?: 'fast' | 'normal' | 'slow';
  confidence: number;
}

// Validate supported chains
export const SUPPORTED_CHAINS = [
  'base',
  'ethereum',
  'polygon',
  'arbitrum',
  'optimism',
  'avalanche',
  'bnbchain',
  'zksync',
  'linea',
  'scroll'
];

// Validate supported tokens
export const SUPPORTED_TOKENS = [
  'ETH',
  'USDC',
  'USDT',
  'DAI',
  'WETH',
  'WBTC',
  'LINK',
  'AAVE',
  'UNI',
  'MATIC'
];

// Chain name normalization
export const CHAIN_ALIASES: Record<string, string> = {
  'eth': 'ethereum',
  'ethereum': 'ethereum',
  'mainnet': 'ethereum',
  'poly': 'polygon',
  'polygon': 'polygon',
  'matic': 'polygon',
  'base': 'base',
  'arb': 'arbitrum',
  'arbitrum': 'arbitrum',
  'op': 'optimism',
  'optimism': 'optimism',
  'avax': 'avalanche',
  'avalanche': 'avalanche',
  'bnb': 'bnbchain',
  'bsc': 'bnbchain',
  'binance': 'bnbchain',
  'zk': 'zksync',
  'zksync': 'zksync',
  'linea': 'linea',
  'scroll': 'scroll'
};

// Token name variations to standardize
const tokenNameMap: Record<string, string> = {
  // ETH variations
  'eth': 'ETH',
  'ether': 'ETH',
  'ethereum': 'ETH',
  
  // USDC variations
  'usdc': 'USDC',
  'usd coin': 'USDC',
  'usdc token': 'USDC',
  
  // USDT variations
  'usdt': 'USDT',
  'tether': 'USDT',
  'usdt token': 'USDT',
  
  // Potential other tokens
  'dai': 'DAI',
  'weth': 'WETH',
  'wbtc': 'WBTC',
  'btc': 'WBTC',
  'bitcoin': 'WBTC'
};

/**
 * Processes a natural language bridge command to extract the parameters
 * @param userInput The natural language input from the user
 * @returns Parsed bridge command parameters
 */
export async function processNLPCommand(userInput: string): Promise<BridgeCommand | null> {
  try {
    // Prompt for the AI model with detailed instructions and validation requirements
    const prompt = `
      Parse the following bridge command into structured data. Extract:
      - Source chain (default to Base if not specified)
      - Destination chain (must be one of: ${SUPPORTED_CHAINS.join(', ')})
      - Token (must be one of: ${SUPPORTED_TOKENS.join(', ')})
      - Amount (numerical value)
      - Gas preference (default to normal if not specified, can be: fast, normal, slow)
      
      Command: "${userInput}"
      
      Important validation rules:
      1. Normalize chain names (e.g., eth -> ethereum, poly -> polygon)
      2. Token symbols should be in uppercase
      3. Amount should be a valid number
      4. Default source chain to "base" if not specified
      5. Default gas preference to "normal" if not specified
      
      Return only a valid JSON object with the following structure:
      {
        "sourceChain": string,
        "destinationChain": string,
        "token": string,
        "amount": string,
        "gasPreference": "fast" | "normal" | "slow"
      }
    `;
    
    // Use OpenAI by default, fallback to Gemini if OpenAI fails
    let responseText: string;
    try {
      responseText = await getChatCompletion(prompt);
    } catch (error) {
      console.log("Falling back to Gemini for NLP processing");
      responseText = await generateContent(prompt);
    }
    
    // Parse the response JSON
    try {
      // Find the JSON object in the response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in the response");
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate the required fields
      if (!parsed.destinationChain || !parsed.token || !parsed.amount) {
        throw new Error("Missing required fields in parsed command");
      }
      
      // Normalize and validate fields
      // Normalize chain names
      if (parsed.sourceChain) {
        parsed.sourceChain = normalizeChainName(parsed.sourceChain);
      } else {
        parsed.sourceChain = "base";
      }
      
      parsed.destinationChain = normalizeChainName(parsed.destinationChain);
      
      // Validate token (must be in supported list)
      parsed.token = parsed.token.toUpperCase();
      if (!SUPPORTED_TOKENS.includes(parsed.token)) {
        throw new Error(`Unsupported token: ${parsed.token}`);
      }
      
      // Validate amount
      if (isNaN(parseFloat(parsed.amount))) {
        throw new Error(`Invalid amount: ${parsed.amount}`);
      }
      
      // Default gas preference
      if (!parsed.gasPreference || !['fast', 'normal', 'slow'].includes(parsed.gasPreference)) {
        parsed.gasPreference = "normal";
      }
      
      // Calculate confidence based on completeness
      let confidence = 0.5;
      if (parsed.destinationChain) confidence += 0.2;
      if (parsed.token) confidence += 0.15;
      if (parsed.amount) confidence += 0.15;
      
      return {
        ...parsed,
        confidence
      } as BridgeCommand;
    } catch (error) {
      console.error("Error parsing NLP response:", error);
      return null;
    }
  } catch (error) {
    console.error("Error in NLP processing:", error);
    return null;
  }
}

/**
 * Normalizes chain names using the aliases dictionary
 */
export function normalizeChainName(chain: string): string {
  const lowercaseChain = chain.toLowerCase();
  return CHAIN_ALIASES[lowercaseChain] || lowercaseChain;
}

/**
 * Normalizes a token name
 */
export function normalizeTokenName(token: string): string | null {
  const lowerToken = token.toLowerCase().trim();
  return tokenNameMap[lowerToken] || null;
}

/**
 * Generates a clarification question if the original command is ambiguous
 * @param userInput The original user input
 * @param missingParams Array of missing parameters
 * @returns A clarification question to ask the user
 */
export async function generateClarificationQuestion(
  userInput: string,
  missingParams: string[]
): Promise<string> {
  try {
    const prompt = `
      The user is trying to bridge crypto assets with this command: "${userInput}"
      
      I need to ask for clarification about these missing details: ${missingParams.join(', ')}.
      
      Generate a friendly, brief question asking for these specific details. Include examples of valid values.
      If destination chain is missing, mention our supported chains: ${SUPPORTED_CHAINS.join(', ')}.
      If token is missing, mention our supported tokens: ${SUPPORTED_TOKENS.join(', ')}.
      Don't explain what bridging is - just ask for the missing information.
    `;
    
    return await getChatCompletion(prompt);
  } catch (error) {
    console.error("Error generating clarification:", error);
    
    // Fallback clarification message with examples
    let message = `Could you please clarify the ${missingParams.join(', ')} for your bridge request?`;
    
    if (missingParams.includes('destination chain')) {
      message += ` Supported chains include: ${SUPPORTED_CHAINS.slice(0, 3).join(', ')}, etc.`;
    }
    
    if (missingParams.includes('token')) {
      message += ` Supported tokens include: ${SUPPORTED_TOKENS.slice(0, 3).join(', ')}, etc.`;
    }
    
    return message;
  }
}

// Extract a number from a string
export function extractAmount(text: string): string | null {
  // Match number patterns including decimals
  const matches = text.match(/\b(\d+(\.\d+)?)\b/g);
  return matches ? matches[0] : null;
} 