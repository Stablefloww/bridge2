// NLP Processor for Bridge Commands
import { ethers } from 'ethers';

// Supported chains
const SUPPORTED_CHAINS = {
  'base': {
    id: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org'
  },
  'ethereum': {
    id: 1,
    name: 'Ethereum',
    rpcUrl: 'https://mainnet.infura.io/v3/'
  },
  'arbitrum': {
    id: 42161,
    name: 'Arbitrum',
    rpcUrl: 'https://arb1.arbitrum.io/rpc'
  },
  'optimism': {
    id: 10,
    name: 'Optimism',
    rpcUrl: 'https://mainnet.optimism.io'
  },
  'polygon': {
    id: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com'
  },
  'avalanche': {
    id: 43114,
    name: 'Avalanche',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc'
  },
  'bsc': {
    id: 56,
    name: 'Binance Smart Chain',
    rpcUrl: 'https://bsc-dataseed.binance.org'
  },
  'fantom': {
    id: 250,
    name: 'Fantom',
    rpcUrl: 'https://rpc.ftm.tools'
  },
  'zksync': {
    id: 324,
    name: 'zkSync Era',
    rpcUrl: 'https://mainnet.era.zksync.io'
  },
  'linea': {
    id: 59144,
    name: 'Linea',
    rpcUrl: 'https://rpc.linea.build'
  }
};

// Supported tokens with their addresses on Base
const SUPPORTED_TOKENS = {
  'eth': {
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18,
    isNative: true
  },
  'usdc': {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    isNative: false
  },
  'usdt': {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    isNative: false
  },
  'dai': {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    isNative: false
  }
};

// Intent types for bridge commands
const INTENT_TYPES = {
  BRIDGE: 'bridge',
  BALANCE_CHECK: 'balance_check',
  CHAIN_INFO: 'chain_info',
  TOKEN_INFO: 'token_info',
  UNKNOWN: 'unknown'
};

/**
 * Process a natural language command to extract intent and parameters
 * 
 * @param {string} command - The user's natural language command
 * @returns {Object} The extracted intent and parameters
 */
export async function processCommand(command) {
  // Normalize the command by converting to lowercase and removing extra whitespace
  const normalizedCommand = command.toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Extract intent first
  const intent = extractIntent(normalizedCommand);
  
  if (intent === INTENT_TYPES.UNKNOWN) {
    return {
      success: false,
      intent: INTENT_TYPES.UNKNOWN,
      message: "I'm not sure what you want to do. You can ask to bridge tokens between chains, check balances, or get information about supported chains and tokens."
    };
  }
  
  // Extract parameters based on intent
  if (intent === INTENT_TYPES.BRIDGE) {
    return extractBridgeParameters(normalizedCommand);
  } else if (intent === INTENT_TYPES.BALANCE_CHECK) {
    return extractBalanceParameters(normalizedCommand);
  } else if (intent === INTENT_TYPES.CHAIN_INFO) {
    return {
      success: true,
      intent: INTENT_TYPES.CHAIN_INFO,
      chains: Object.keys(SUPPORTED_CHAINS).map(key => SUPPORTED_CHAINS[key].name)
    };
  } else if (intent === INTENT_TYPES.TOKEN_INFO) {
    return {
      success: true,
      intent: INTENT_TYPES.TOKEN_INFO,
      tokens: Object.keys(SUPPORTED_TOKENS).map(key => SUPPORTED_TOKENS[key].symbol)
    };
  }
  
  return {
    success: false,
    intent: INTENT_TYPES.UNKNOWN,
    message: "I couldn't understand your request. Please try again with a clearer command."
  };
}

/**
 * Extract the intent from a command
 * 
 * @param {string} command - The normalized command
 * @returns {string} The intent type
 */
function extractIntent(command) {
  // Check for bridge intent
  if (command.includes('bridge') || 
      command.includes('send') || 
      command.includes('transfer') || 
      command.includes('move') || 
      command.includes('swap')) {
    return INTENT_TYPES.BRIDGE;
  }
  
  // Check for balance check intent
  if (command.includes('balance') || 
      command.includes('check') || 
      command.includes('how much') || 
      command.includes('holdings')) {
    return INTENT_TYPES.BALANCE_CHECK;
  }
  
  // Check for chain info intent
  if ((command.includes('chain') || command.includes('network')) && 
      (command.includes('support') || command.includes('available') || command.includes('list'))) {
    return INTENT_TYPES.CHAIN_INFO;
  }
  
  // Check for token info intent
  if ((command.includes('token') || command.includes('coin')) && 
      (command.includes('support') || command.includes('available') || command.includes('list'))) {
    return INTENT_TYPES.TOKEN_INFO;
  }
  
  return INTENT_TYPES.UNKNOWN;
}

/**
 * Extract bridge parameters from a command
 * 
 * @param {string} command - The normalized command
 * @returns {Object} The extracted parameters
 */
function extractBridgeParameters(command) {
  let amount = null;
  let token = null;
  let sourceChain = 'base'; // Default source chain is Base
  let destChain = null;
  
  // Extract amount - looking for a number followed by a token name
  const amountMatch = command.match(/(\d+\.?\d*)\s*(eth|usdc|usdt|dai)/i);
  if (amountMatch) {
    amount = amountMatch[1];
    token = amountMatch[2].toLowerCase();
  }
  
  // Extract destination chain
  Object.keys(SUPPORTED_CHAINS).forEach(chain => {
    if (command.includes(` to ${chain}`) || command.includes(` on ${chain}`)) {
      destChain = chain;
    }
  });
  
  // If source chain is mentioned explicitly, extract it
  Object.keys(SUPPORTED_CHAINS).forEach(chain => {
    if (command.includes(` from ${chain} `)) {
      sourceChain = chain;
    }
  });
  
  // Validate extracted parameters
  const validation = validateBridgeParameters(amount, token, sourceChain, destChain);
  
  if (!validation.valid) {
    return {
      success: false,
      intent: INTENT_TYPES.BRIDGE,
      message: validation.message
    };
  }
  
  return {
    success: true,
    intent: INTENT_TYPES.BRIDGE,
    params: {
      amount,
      token,
      sourceChain,
      destChain,
      tokenData: SUPPORTED_TOKENS[token],
      sourceChainData: SUPPORTED_CHAINS[sourceChain],
      destChainData: SUPPORTED_CHAINS[destChain]
    }
  };
}

/**
 * Extract balance check parameters from a command
 * 
 * @param {string} command - The normalized command
 * @returns {Object} The extracted parameters
 */
function extractBalanceParameters(command) {
  let token = null;
  let chain = 'base'; // Default chain is Base
  
  // Extract token
  Object.keys(SUPPORTED_TOKENS).forEach(t => {
    if (command.includes(t)) {
      token = t;
    }
  });
  
  // Extract chain
  Object.keys(SUPPORTED_CHAINS).forEach(c => {
    if (command.includes(c)) {
      chain = c;
    }
  });
  
  return {
    success: true,
    intent: INTENT_TYPES.BALANCE_CHECK,
    params: {
      token,
      chain,
      tokenData: token ? SUPPORTED_TOKENS[token] : null,
      chainData: SUPPORTED_CHAINS[chain]
    }
  };
}

/**
 * Validate bridge parameters
 * 
 * @param {string} amount - The amount to bridge
 * @param {string} token - The token to bridge
 * @param {string} sourceChain - The source chain
 * @param {string} destChain - The destination chain
 * @returns {Object} Validation result
 */
function validateBridgeParameters(amount, token, sourceChain, destChain) {
  // Check if all required parameters are present
  if (!amount) {
    return {
      valid: false,
      message: "I couldn't determine the amount you want to bridge. Please specify an amount."
    };
  }
  
  if (!token) {
    return {
      valid: false,
      message: "I couldn't determine which token you want to bridge. Supported tokens are: " + 
        Object.keys(SUPPORTED_TOKENS).join(', ')
    };
  }
  
  if (!SUPPORTED_TOKENS[token]) {
    return {
      valid: false,
      message: `The token ${token} is not supported. Supported tokens are: ` + 
        Object.keys(SUPPORTED_TOKENS).join(', ')
    };
  }
  
  if (!destChain) {
    return {
      valid: false,
      message: "I couldn't determine the destination chain. Please specify where you want to bridge to."
    };
  }
  
  if (!SUPPORTED_CHAINS[destChain]) {
    return {
      valid: false,
      message: `The chain ${destChain} is not supported. Supported chains are: ` + 
        Object.keys(SUPPORTED_CHAINS).join(', ')
    };
  }
  
  if (sourceChain === destChain) {
    return {
      valid: false,
      message: "The source and destination chains are the same. Please choose different chains."
    };
  }
  
  // Check if amount is a valid number
  if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    return {
      valid: false,
      message: "Please provide a valid positive amount to bridge."
    };
  }
  
  return {
    valid: true
  };
}

/**
 * Generate clarification questions for ambiguous commands
 * 
 * @param {Object} extractionResult - The result of parameter extraction
 * @returns {Object} Clarification questions
 */
export function generateClarification(extractionResult) {
  const { intent, params } = extractionResult;
  
  if (intent === INTENT_TYPES.BRIDGE) {
    const missingParams = [];
    
    if (!params.amount) missingParams.push("amount");
    if (!params.token) missingParams.push("token");
    if (!params.destChain) missingParams.push("destination chain");
    
    if (missingParams.length > 0) {
      return {
        needsClarification: true,
        missingParams,
        questions: missingParams.map(param => {
          switch(param) {
            case "amount":
              return "How much do you want to bridge?";
            case "token":
              return `Which token do you want to bridge? Supported tokens are: ${Object.keys(SUPPORTED_TOKENS).join(', ')}`;
            case "destination chain":
              return `Which chain do you want to bridge to? Supported chains are: ${Object.keys(SUPPORTED_CHAINS).join(', ')}`;
            default:
              return "";
          }
        })
      };
    }
  }
  
  return {
    needsClarification: false
  };
}

export default {
  processCommand,
  generateClarification,
  SUPPORTED_CHAINS,
  SUPPORTED_TOKENS,
  INTENT_TYPES
}; 