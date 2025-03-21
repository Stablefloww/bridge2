import { processCommand } from '../nlp/nlpProcessor.js';
import { ethers } from 'ethers';
import { getBridgeRoutes, executeBridge } from '../bridge/providers.js';
import { normalizeTokenSymbol, parseTokenAmount, formatTokenAmount } from '../tokens/tokenUtils.js';

/**
 * MCP Tool for handling bridge operations
 * This tool allows models to bridge tokens between chains using natural language
 */
async function bridgeTool(context) {
  try {
    // Extract the user's command from the request
    const { request } = context;
    
    if (!request || !request.content) {
      return createErrorResponse('Invalid request format');
    }
    
    // Get the user's natural language command
    const command = request.content;
    
    // Process the natural language command
    const { intent, params, needsClarification, clarificationQuestions } = await processCommand(command);
    
    // If clarification is needed, return questions to user
    if (needsClarification) {
      return createClarificationResponse(clarificationQuestions);
    }
    
    // Handle different intents
    switch (intent) {
      case 'BRIDGE': 
        return await handleBridgeIntent(params, context);
      
      case 'GET_BRIDGE_ROUTES':
        return await handleGetRoutesIntent(params, context);
      
      case 'CHECK_BALANCE':
        return await handleCheckBalanceIntent(params, context);
      
      case 'TOKEN_INFO':
        return await handleTokenInfoIntent(params, context);
      
      default:
        return createErrorResponse('I do not understand that command. Try asking to bridge tokens between chains.');
    }
  } catch (error) {
    console.error('Error in bridge tool:', error);
    return createErrorResponse(`An error occurred: ${error.message}`);
  }
}

/**
 * Handle bridge intent
 */
async function handleBridgeIntent(params, context) {
  try {
    const { sourceChain, destChain, tokenSymbol, amount } = params;
    
    if (!sourceChain || !destChain || !tokenSymbol || !amount) {
      return createErrorResponse('Missing required parameters. Please specify source chain, destination chain, token, and amount.');
    }
    
    // Create a provider and signer from the seed phrase
    const { provider, signer } = await getSigner(context);
    
    // Get available routes
    const routes = await getBridgeRoutes({
      sourceChain,
      destChain,
      tokenSymbol: normalizeTokenSymbol(tokenSymbol),
      amount,
      signer
    });
    
    if (!routes || routes.length === 0) {
      return createErrorResponse('No routes available for this bridge operation.');
    }
    
    // Use the best route
    const bestRoute = routes[0];
    
    // Execute the bridge transaction
    const result = await executeBridge({
      sourceChain,
      destChain,
      tokenSymbol: normalizeTokenSymbol(tokenSymbol),
      amount,
      signer,
      slippageTolerance: 0.5 // 0.5% slippage tolerance
    });
    
    return createSuccessResponse({
      message: `Successfully initiated bridge of ${amount} ${tokenSymbol} from ${sourceChain} to ${destChain}.`,
      transactionHash: result.transactionHash,
      estimatedTime: result.estimatedTime,
      details: {
        sourceChain,
        destChain,
        token: tokenSymbol,
        amount,
        fees: result.fees
      }
    });
  } catch (error) {
    console.error('Error handling bridge intent:', error);
    return createErrorResponse(`Failed to bridge tokens: ${error.message}`);
  }
}

/**
 * Handle get routes intent
 */
async function handleGetRoutesIntent(params, context) {
  try {
    const { sourceChain, destChain, tokenSymbol, amount } = params;
    
    if (!sourceChain || !destChain || !tokenSymbol || !amount) {
      return createErrorResponse('Missing required parameters. Please specify source chain, destination chain, token, and amount.');
    }
    
    // Create a provider and signer from the seed phrase
    const { provider, signer } = await getSigner(context);
    
    // Get available routes
    const routes = await getBridgeRoutes({
      sourceChain,
      destChain,
      tokenSymbol: normalizeTokenSymbol(tokenSymbol),
      amount,
      signer
    });
    
    if (!routes || routes.length === 0) {
      return createErrorResponse('No routes available for this bridge operation.');
    }
    
    // Format routes for display
    const formattedRoutes = routes.map((route, index) => ({
      id: index + 1,
      provider: route.provider,
      sourceChain: route.sourceChain,
      destChain: route.destChain,
      token: route.token,
      amount: route.amount,
      estimatedGas: route.estimatedGas,
      bridgeFee: route.bridgeFee,
      estimatedTime: route.estimatedTime
    }));
    
    return createSuccessResponse({
      message: `Found ${routes.length} routes to bridge ${amount} ${tokenSymbol} from ${sourceChain} to ${destChain}.`,
      routes: formattedRoutes
    });
  } catch (error) {
    console.error('Error handling get routes intent:', error);
    return createErrorResponse(`Failed to get bridge routes: ${error.message}`);
  }
}

/**
 * Handle check balance intent
 */
async function handleCheckBalanceIntent(params, context) {
  try {
    const { chain, tokenSymbol } = params;
    
    if (!chain) {
      return createErrorResponse('Missing required parameters. Please specify which chain to check balance on.');
    }
    
    // Create a provider and signer from the seed phrase
    const { provider, signer } = await getSigner(context);
    
    // If a specific token is requested, get that balance
    if (tokenSymbol) {
      // This is a placeholder - in a real implementation, you would:
      // 1. Get the token contract address for the specified chain
      // 2. Create a contract instance
      // 3. Call balanceOf() for the user's address
      
      // For now, return a mock response
      return createSuccessResponse({
        message: `Your balance of ${normalizeTokenSymbol(tokenSymbol)} on ${chain} is 100.0`,
        balance: '100.0',
        token: normalizeTokenSymbol(tokenSymbol),
        chain
      });
    } else {
      // Get native token balance
      const balance = await provider.getBalance(signer.address);
      const formattedBalance = formatTokenAmount(balance);
      
      return createSuccessResponse({
        message: `Your balance on ${chain} is ${formattedBalance} ETH`,
        balance: formattedBalance,
        token: 'ETH',
        chain
      });
    }
  } catch (error) {
    console.error('Error handling check balance intent:', error);
    return createErrorResponse(`Failed to check balance: ${error.message}`);
  }
}

/**
 * Handle token info intent
 */
async function handleTokenInfoIntent(params, context) {
  try {
    const { tokenSymbol, chain } = params;
    
    if (!tokenSymbol) {
      return createErrorResponse('Missing required parameters. Please specify which token you want information about.');
    }
    
    // Normalize the token symbol
    const normalizedSymbol = normalizeTokenSymbol(tokenSymbol);
    
    // This is a placeholder - in a real implementation, you would fetch actual token data
    // from a token list or on-chain
    
    const tokenInfo = {
      symbol: normalizedSymbol,
      name: getTokenName(normalizedSymbol),
      chains: getTokenChains(normalizedSymbol),
      description: getTokenDescription(normalizedSymbol)
    };
    
    if (chain) {
      // If a specific chain is requested, filter the information
      if (!tokenInfo.chains.includes(chain)) {
        return createErrorResponse(`${normalizedSymbol} is not available on ${chain}.`);
      }
      
      tokenInfo.address = getTokenAddress(normalizedSymbol, chain);
    }
    
    return createSuccessResponse({
      message: `Information about ${normalizedSymbol}:`,
      tokenInfo
    });
  } catch (error) {
    console.error('Error handling token info intent:', error);
    return createErrorResponse(`Failed to get token information: ${error.message}`);
  }
}

/**
 * Helper function to get signer from context using Base MCP's wallet
 */
async function getSigner(context) {
  try {
    // In a real implementation, you would:
    // 1. Get the seed phrase from environment variables
    // 2. Create a wallet from the seed phrase
    // 3. Connect the wallet to the appropriate provider
    
    const seedPhrase = process.env.SEED_PHRASE;
    if (!seedPhrase) {
      throw new Error('Seed phrase not found in environment variables');
    }
    
    // Create wallet from seed phrase
    const wallet = ethers.Wallet.fromPhrase(seedPhrase);
    
    // Create provider for Base
    const rpcUrl = 'https://mainnet.base.org';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Connect wallet to provider
    const signer = wallet.connect(provider);
    
    return { provider, signer };
  } catch (error) {
    console.error('Error getting signer:', error);
    throw new Error(`Failed to initialize wallet: ${error.message}`);
  }
}

// Helper functions for responses
function createSuccessResponse(data) {
  return {
    content: [
      {
        type: 'text',
        text: data.message || 'Operation completed successfully'
      }
    ],
    // Include additional data that can be used by the application
    data
  };
}

function createErrorResponse(message) {
  return {
    content: [
      {
        type: 'text',
        text: message
      }
    ],
    error: true
  };
}

function createClarificationResponse(questions) {
  // Format questions for the user
  const questionText = questions.join('\n');
  
  return {
    content: [
      {
        type: 'text',
        text: `I need some clarification to process your request:\n${questionText}`
      }
    ],
    needsClarification: true,
    clarificationQuestions: questions
  };
}

// Placeholder helper functions for token info
function getTokenName(symbol) {
  const tokenNames = {
    'ETH': 'Ethereum',
    'USDC': 'USD Coin',
    'USDT': 'Tether',
    'DAI': 'Dai Stablecoin',
    'BTC': 'Bitcoin'
  };
  
  return tokenNames[symbol] || symbol;
}

function getTokenChains(symbol) {
  // Most major tokens are available on these chains
  return ['Ethereum', 'Base', 'Arbitrum', 'Optimism', 'Polygon'];
}

function getTokenDescription(symbol) {
  const descriptions = {
    'ETH': 'The native cryptocurrency of the Ethereum blockchain.',
    'USDC': 'A fully collateralized US dollar stablecoin issued by Circle.',
    'USDT': 'A stablecoin pegged to the US dollar issued by Tether.',
    'DAI': 'A decentralized stablecoin built on Ethereum that is soft-pegged to the US dollar.',
    'BTC': 'The first and largest cryptocurrency by market capitalization.'
  };
  
  return descriptions[symbol] || `A cryptocurrency with symbol ${symbol}.`;
}

function getTokenAddress(symbol, chain) {
  // This would be a lookup of token addresses on different chains
  const addresses = {
    'ETH': {
      'Ethereum': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      'Base': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      'Arbitrum': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
    },
    'USDC': {
      'Ethereum': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      'Base': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      'Arbitrum': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
    }
  };
  
  return addresses[symbol]?.[chain] || 'Unknown address';
}

/**
 * Register the bridge tool with the MCP server
 * @param {Object} server - MCP server instance
 * @param {ethers.Wallet} wallet - Wallet instance
 */
export function registerBridgeTool(server, wallet) {
  server.tool({
    name: 'bridge',
    description: 'Bridge tokens between supported blockchain networks',
    parameters: [
      {
        name: 'command',
        type: 'string',
        description: 'Natural language command to bridge tokens, e.g., "Bridge 100 USDC from Base to Ethereum"',
        required: true
      }
    ],
    run: async (params, context) => {
      // Process the command
      try {
        const result = await processCommand(params.command);
        
        if (!result.success) {
          return {
            content: [
              {
                type: 'text',
                text: result.message || 'Sorry, I could not understand your request.'
              }
            ],
            error: true
          };
        }
        
        // Handle different intents
        if (result.intent === 'bridge') {
          return await handleBridgeOperation(result.params, wallet);
        } else if (result.intent === 'balance_check') {
          return await handleBalanceCheck(result.params, wallet);
        } else if (result.intent === 'token_info') {
          return handleTokenInfo(result.tokens);
        } else if (result.intent === 'chain_info') {
          return handleChainInfo(result.chains);
        } else {
          return {
            content: [
              {
                type: 'text',
                text: 'I understand your request, but this functionality is not yet implemented.'
              }
            ],
            error: true
          };
        }
      } catch (error) {
        console.error('Error in bridge tool:', error);
        return {
          content: [
            {
              type: 'text',
              text: `An error occurred: ${error.message}`
            }
          ],
          error: true
        };
      }
    }
  });
}

/**
 * Handle a bridge operation
 * @param {Object} params - Bridge parameters
 * @param {ethers.Wallet} wallet - Wallet instance
 * @returns {Object} MCP response
 */
async function handleBridgeOperation(params, wallet) {
  try {
    const { amount, token, sourceChain, destChain } = params;
    
    // Get routes
    const routes = await getBridgeRoutes({
      sourceChain,
      destChain,
      tokenSymbol: token.toUpperCase(),
      amount,
      signer: wallet
    });
    
    if (!routes || routes.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `Sorry, I couldn't find any routes to bridge ${amount} ${token} from ${sourceChain} to ${destChain}.`
          }
        ],
        error: true
      };
    }
    
    // Execute bridge transaction
    const result = await executeBridge({
      sourceChain,
      destChain,
      tokenSymbol: token.toUpperCase(),
      amount,
      signer: wallet,
      slippageTolerance: 0.5,
      useGasAbstraction: true // Use gasless transactions by default
    });
    
    return {
      content: [
        {
          type: 'text',
          text: `Successfully initiated bridge of ${amount} ${token.toUpperCase()} from ${sourceChain} to ${destChain}.`
        },
        {
          type: 'text',
          text: `Transaction hash: ${result.transactionHash}`
        },
        {
          type: 'text',
          text: `Estimated arrival: ${result.estimatedArrivalTime.toLocaleString()}`
        }
      ],
      data: result
    };
  } catch (error) {
    console.error('Bridge operation error:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Failed to execute bridge: ${error.message}`
        }
      ],
      error: true
    };
  }
}

/**
 * Handle a balance check operation
 * @param {Object} params - Balance check parameters
 * @param {ethers.Wallet} wallet - Wallet instance
 * @returns {Object} MCP response
 */
async function handleBalanceCheck(params, wallet) {
  try {
    const { chain, token } = params;
    
    // This is just a placeholder - in a real implementation, you would check actual balances
    return {
      content: [
        {
          type: 'text',
          text: token 
            ? `Your ${token.toUpperCase()} balance on ${chain} is 100.00`
            : `Your native token balance on ${chain} is 1.25 ETH`
        }
      ],
      data: {
        chain,
        token: token || 'ETH',
        balance: token ? '100.00' : '1.25'
      }
    };
  } catch (error) {
    console.error('Balance check error:', error);
    return {
      content: [
        {
          type: 'text',
          text: `Failed to check balance: ${error.message}`
        }
      ],
      error: true
    };
  }
}

/**
 * Handle token info request
 * @param {Array} tokens - List of supported tokens
 * @returns {Object} MCP response
 */
function handleTokenInfo(tokens) {
  return {
    content: [
      {
        type: 'text',
        text: `Supported tokens: ${tokens.join(', ')}`
      }
    ],
    data: { tokens }
  };
}

/**
 * Handle chain info request
 * @param {Array} chains - List of supported chains
 * @returns {Object} MCP response
 */
function handleChainInfo(chains) {
  return {
    content: [
      {
        type: 'text',
        text: `Supported chains: ${chains.join(', ')}`
      }
    ],
    data: { chains }
  };
}

// Export the bridge tool
export default {
  tool: bridgeTool,
  info: {
    name: 'bridge',
    description: 'Bridge tokens between supported blockchain networks',
    usage: 'bridge tokens between chains, check bridge routes, or get token information',
    examples: [
      'Bridge 100 USDC from Base to Ethereum',
      'What are the routes to bridge 50 ETH from Ethereum to Base?',
      'Check my balance on Base',
      'What chains support USDC?'
    ]
  }
}; 