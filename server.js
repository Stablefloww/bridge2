import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { processNLPCommand } from './src/lib/nlp/bridgeNLP.js';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Set up ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Stargate Protocol Contract ABI (minimum required functions)
const stargateRouterABI = [
  "function swap(uint16 _dstChainId, uint256 _srcPoolId, uint256 _dstPoolId, address payable _refundAddress, uint256 _amountLD, uint256 _minAmountLD, uint256 _lzTxParams, bytes calldata _to, bytes calldata _payload) payable external",
  "function quoteLayerZeroFee(uint16 _dstChainId, uint8 _functionType, bytes calldata _toAddress, bytes calldata _transferAndCallPayload, uint256 _lzTxParams) external view returns (uint256, uint256)"
];

// Stargate Bridge Constants
const STARGATE_ROUTER_ADDRESSES = {
  ethereum: '0x8731d54E9D02c286767d56ac03e8037C07e01e98',  // Updated Router.sol address
  base: '0x45f1A95A4D3f3836523F5c83673c797f4d4d263B',      // Updated Router.sol address
  optimism: '0xB0D502E938ed5f4df2E681fE6E419ff29631d62b',  // Updated Router.sol address
  arbitrum: '0x53Bf833A5d6c4ddA888F69c22C88C9f356a41614',  // Updated Router.sol address
  polygon: '0x45A01E4e04F14f7A4a6702c74187c5F6222033cd'    // Updated Router.sol address
};

// For ETH transfers, we should use RouterETH
const STARGATE_ROUTER_ETH_ADDRESSES = {
  ethereum: '0x150f94B44927F078737562f0fcF3C95c01Cc2376',  // RouterETH.sol address
  base: '0x50B6EbC2103BFEc165949CC946d739d5650d7ae4',      // RouterETH.sol address
  optimism: '0xB49c4e680174E331CB0A7fF3Ab58afC9738d5F8b',  // RouterETH.sol address
  arbitrum: '0xbf22f0f184bCcbeA268dF387a49fF5238dD23E40',  // RouterETH.sol address
  polygon: null  // Polygon doesn't support ETH via Stargate
};

// Stargate Chain IDs (LayerZero endpoint IDs)
const STARGATE_CHAIN_IDS = {
  ethereum: 101,
  base: 184,
  optimism: 111,
  arbitrum: 110,
  polygon: 109
};

// Stargate Pool IDs for tokens
const STARGATE_POOL_IDS = {
  'eth': {
    ethereum: 13,  // ETH pool on Ethereum
    base: 13,      // ETH pool on Base
    arbitrum: 13,  // ETH pool on Arbitrum
    optimism: 13,  // ETH pool on Optimism
    polygon: 0     // Not supported for native ETH
  },
  'usdc': {
    ethereum: 1,   // USDC pool on Ethereum
    base: 1,       // USDC pool on Base
    arbitrum: 1,   // USDC pool on Arbitrum
    optimism: 1,   // USDC pool on Optimism
    polygon: 1     // USDC pool on Polygon
  },
  'usdt': {
    ethereum: 2,   // USDT pool on Ethereum
    base: 2,       // USDT pool on Base
    arbitrum: 2,   // USDT pool on Arbitrum
    optimism: 2,   // USDT pool on Optimism
    polygon: 2     // USDT pool on Polygon
  }
};

// Stargate Token Addresses
const TOKEN_ADDRESSES = {
  'eth': {
    ethereum: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ETH
    base: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',     // Native ETH
    optimism: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ETH
    arbitrum: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ETH
    polygon: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',  // Native MATIC treated as "ETH"
  },
  'usdc': {
    ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC on Ethereum
    base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',     // USDC on Base
    optimism: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // USDC on Optimism
    arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC on Arbitrum
    polygon: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'   // USDC on Polygon
  },
  'usdt': {
    ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT on Ethereum
    base: '0x4384a7c9498f705f40b53b5974ea98e6d84366a2',     // USDT on Base 
    optimism: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58', // USDT on Optimism
    arbitrum: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT on Arbitrum
    polygon: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'   // USDT on Polygon
  }
};

// Create Express app
const app = express();
const PORT = parseInt(process.env.PORT || 3000);
console.log(`Using port: ${PORT} from .env.local`);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Create public directory if it doesn't exist
import fs from 'fs';
if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public');
}

// Main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint for processing commands with AI model selection
app.post('/api/process-command', async (req, res) => {
  try {
    const { command, walletAddress, aiModel = 'openai' } = req.body;
    
    if (!command) {
      return res.status(400).json({ 
        success: false, 
        message: 'Command is required' 
      });
    }
    
    console.log(`Processing command: "${command}" with AI model: ${aiModel}`);
    
    // Process the command with the selected AI model
    let result;
    try {
      if (aiModel === 'gemini') {
        // Use Google Gemini model for processing
        console.log('Using Google Gemini for NLP processing');
        // For now, we'll use the same processing function, but in a real app
        // you would implement a specific handler for Gemini
        result = await processNLPCommand(command, 'gemini');
      } else {
        // Default to OpenAI
        console.log('Using OpenAI for NLP processing');
        result = await processNLPCommand(command, 'openai');
      }
    } catch (nlpError) {
      console.error('Error in NLP processing:', nlpError);
      return res.json({
        success: false,
        message: `Error understanding your command: ${nlpError.message || 'Please try rephrasing.'}`,
        error: nlpError.message
      });
    }
    
    // Check if we have a valid parsed command
    if (!result || Object.keys(result).length === 0) {
      return res.json({
        success: true,
        message: "I couldn't understand your command. Please try rephrasing with a more specific bridge instruction like 'Send 10 USDC to Base' or 'Bridge 0.1 ETH from Optimism to Arbitrum'."
      });
    }
    
    // Format user-friendly response
    let responseMessage;
    
    if (result.sourceChain && result.destinationChain && result.token) {
      // This is a bridge transaction with all necessary parameters
      const amount = result.amount ? result.amount : 'an amount of';
      const sourceChain = result.sourceChain.charAt(0).toUpperCase() + result.sourceChain.slice(1);
      const destChain = result.destinationChain.charAt(0).toUpperCase() + result.destinationChain.slice(1);
      const token = result.token.toUpperCase();
      const gasPreference = result.gasPreference || 'normal';
      
      responseMessage = `I'll help you bridge ${amount} ${token} from ${sourceChain} to ${destChain} with ${gasPreference} gas.`;
      
      // If wallet address is provided, we can return transaction info
      if (walletAddress) {
        responseMessage += ` Please review the details and confirm when ready.`;
        
        // Return transaction details for confirmation
        return res.json({
          success: true,
          message: responseMessage,
          transaction: {
            sourceChain: result.sourceChain,
            destinationChain: result.destinationChain,
            token: result.token,
            amount: result.amount || '0',
            gasPreference: result.gasPreference || 'normal',
            aiModel: aiModel // Include which AI model processed this
          }
        });
      } else {
        responseMessage += ` Please connect your wallet to continue.`;
      }
    } else {
      // Partial understanding or other command
      responseMessage = `I understood parts of your command, but I need more information:`;
      
      if (result.action && result.action === 'bridge') {
        responseMessage += ` You want to bridge tokens`;
        
        if (result.token) {
          responseMessage += ` (${result.token.toUpperCase()})`;
        }
        
        if (result.sourceChain) {
          responseMessage += ` from ${result.sourceChain}`;
        }
        
        if (result.destinationChain) {
          responseMessage += ` to ${result.destinationChain}`;
        }
        
        responseMessage += `. Please provide the missing details.`;
      } else {
        responseMessage = `I couldn't fully understand your request. Try a command like "Bridge 10 USDC from Base to Arbitrum" or "Send 0.1 ETH to Optimism".`;
      }
    }
    
    return res.json({
      success: true,
      message: responseMessage,
      parsedCommand: result,
      aiModelUsed: aiModel
    });
  } catch (error) {
    console.error('Error processing command:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error processing your command', 
      error: error.message 
    });
  }
});

// API endpoint for fetching wallet balance
app.get('/api/balance', async (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address format',
        balance: '0'
      });
    }
    
    // Improved RPC provider handling with multiple fallbacks
    const rpcUrls = [
      process.env.ETH_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/demo",
      "https://ethereum.publicnode.com",
      "https://rpc.ankr.com/eth",
      "https://eth.llamarpc.com",
      "https://rpc.builder0x69.io"
    ];
    
    let balance = null;
    let successfulProvider = null;
    
    // Try each provider until we get a successful response
    for (const rpcUrl of rpcUrls) {
      try {
        console.log(`Trying RPC provider: ${rpcUrl}`);
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        
        // Set a timeout for the balance request
        const balancePromise = provider.getBalance(address);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Balance request timed out for ${rpcUrl}`)), 3000)
        );
        
        // Race the balance request against the timeout
        balance = await Promise.race([balancePromise, timeoutPromise]);
        successfulProvider = rpcUrl;
        console.log(`Successfully fetched balance from ${rpcUrl}`);
        break;
      } catch (providerError) {
        console.error(`Error with provider ${rpcUrl}:`, providerError.message);
        // Continue to the next provider
      }
    }
    
    if (balance) {
      // Format the balance from wei to ether and return
      const formattedBalance = ethers.formatEther(balance);
      return res.json({
        success: true,
        balance: parseFloat(formattedBalance).toFixed(4),
        provider: successfulProvider
      });
    } else {
      // If all providers failed, return a mock balance
      console.warn('All RPC providers failed, returning mock balance');
      return res.json({
        success: true,
        balance: '0.5000',
        mock: true,
        message: 'Mock balance returned as all RPC providers failed'
      });
    }
  } catch (error) {
    console.error('Error fetching balance:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching balance', 
      error: error.message 
    });
  }
});

// API endpoint for executing bridge transactions
app.post('/api/execute-bridge', async (req, res) => {
  try {
    console.log('Bridge request received:', req.body);
    
    const { sourceChain, destinationChain, token, amount, walletAddress, gasPreference } = req.body;
    
    if (!sourceChain || !destinationChain || !token) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
        error: 'Source chain, destination chain, and token are required'
      });
    }
    
    // Add wallet address validation if wallet is connected
    if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address',
        error: 'A valid wallet address is required for bridge transactions'
      });
    }
    
    // Validate amount
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount',
        error: 'Amount must be a positive number'
      });
    }
    
    console.log(`Processing bridge request: ${amount} ${token} from ${sourceChain} to ${destinationChain}`);

    // REAL TRANSACTION IMPLEMENTATION WITH STARGATE PROTOCOL
    try {
      // Normalize chain and token names
      const normalizedToken = token.toLowerCase();
      const normalizedSourceChain = sourceChain.toLowerCase();
      const normalizedDestChain = destinationChain.toLowerCase();
      
      // 1. Validate that we support the source and destination chains in Stargate
      if (!STARGATE_CHAIN_IDS[normalizedSourceChain] || !STARGATE_CHAIN_IDS[normalizedDestChain]) {
        return res.json({
          success: false,
          message: 'Unsupported chain',
          error: `Stargate Protocol doesn't support bridging between ${sourceChain} and ${destinationChain}.`
        });
      }
      
      // 2. Validate that the token is supported in Stargate for these chains
      if (!STARGATE_POOL_IDS[normalizedToken] || 
          !STARGATE_POOL_IDS[normalizedToken][normalizedSourceChain] || 
          !STARGATE_POOL_IDS[normalizedToken][normalizedDestChain]) {
        return res.json({
          success: false,
          message: 'Unsupported token',
          error: `Stargate Protocol doesn't support bridging ${token} from ${sourceChain} to ${destinationChain}.`
        });
      }
      
      // 3. Get the source and destination chain IDs and pool IDs
      const sourceChainId = STARGATE_CHAIN_IDS[normalizedSourceChain];
      const destChainId = STARGATE_CHAIN_IDS[normalizedDestChain];
      const srcPoolId = STARGATE_POOL_IDS[normalizedToken][normalizedSourceChain];
      const dstPoolId = STARGATE_POOL_IDS[normalizedToken][normalizedDestChain];
      
      // 4. Set up provider and signer
      // Note: In a production environment, you'd want to use a private key from a secure source
      // or implement a signing API. This is for demonstration purposes only.
      const provider = new ethers.JsonRpcProvider(
        process.env[`${normalizedSourceChain.toUpperCase()}_RPC_URL`] || 
        'https://eth-mainnet.g.alchemy.com/v2/demo'
      );
      
      // 5. Create a contract instance for the Stargate Router
      // Use RouterETH for ETH transfers
      let stargateRouterAddress;
      if (normalizedToken === 'eth') {
        stargateRouterAddress = STARGATE_ROUTER_ETH_ADDRESSES[normalizedSourceChain];
        
        // Check if this chain supports ETH transfers
        if (!stargateRouterAddress) {
          return res.json({
            success: false,
            message: 'Unsupported token for chain',
            error: `${sourceChain} doesn't support ETH transfers via Stargate Protocol.`
          });
        }
      } else {
        stargateRouterAddress = STARGATE_ROUTER_ADDRESSES[normalizedSourceChain];
      }
      
      // 6. Calculate the amount in the proper format
      // Stargate uses the native token's decimals
      let decimals = 18; // Default for ETH
      if (normalizedToken === 'usdc' || normalizedToken === 'usdt') {
        decimals = 6;
      }
      
      const amountBigInt = ethers.parseUnits(amount, decimals);
      
      // 7. Get the token address for approval (for ERC20 tokens)
      const tokenAddress = TOKEN_ADDRESSES[normalizedToken]?.[normalizedSourceChain];
      
      if (!tokenAddress && normalizedToken !== 'eth') {
        return res.json({
          success: false,
          message: 'Token not supported',
          error: `No token address found for ${token} on ${sourceChain}.`
        });
      }
      
      // 8. Return parameters needed for frontend to execute the transaction
      return res.json({
        success: false, // Set to false since we're not executing the transaction directly
        message: 'Stargate transaction parameters ready',
        useStargate: true,
        implementationStatus: {
          sourceChain: normalizedSourceChain,
          destinationChain: normalizedDestChain,
          token: normalizedToken,
          amount: amount,
          sourceChainId: sourceChainId,
          destChainId: destChainId,
          srcPoolId: srcPoolId,
          dstPoolId: dstPoolId,
          stargateRouterAddress: stargateRouterAddress,
          userAddress: walletAddress,
          amountWithDecimals: amountBigInt.toString(),
          tokenAddress: tokenAddress || 'native',
          isEth: normalizedToken === 'eth'
        },
        error: 'This demo provides transaction parameters for direct Stargate Protocol integration.',
        stargateInfo: {
          docs: 'https://stargateprotocol.gitbook.io/stargate/',
          contractInfo: 'Using Stargate Router with the provided parameters'
        }
      });
      
    } catch (bridgeError) {
      console.error('Error in Stargate bridge integration:', bridgeError);
      return res.status(500).json({
        success: false,
        message: 'Stargate bridge integration error',
        error: bridgeError.message || 'Error connecting to Stargate Protocol'
      });
    }
  } catch (error) {
    console.error('Error executing bridge transaction:', error);
    return res.status(500).json({
      success: false,
      message: 'Error executing bridge transaction',
      error: error.message || 'Unknown error occurred'
    });
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please try a different port.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
}); 