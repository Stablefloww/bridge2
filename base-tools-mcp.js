// Import the required libraries
import { ethers } from 'ethers';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// Create a new MCP server
const server = new McpServer({
  name: 'Base Tools MCP',
  version: '1.0.0',
  description: 'A Model Context Protocol server for Base Network interactions'
});

// Environment variables
const seedPhrase = process.env.SEED_PHRASE || 'increase stove still book elevator place knife intact degree globe notable feature';
const coinbaseApiKeyName = process.env.COINBASE_API_KEY_NAME || 'builder';
const coinbaseApiPrivateKey = process.env.COINBASE_API_PRIVATE_KEY;
const coinbaseKeyId = process.env.COINBASE_KEY_ID || 'e51be061-9079-4aae-a45c-0e1171b1b9e8';
const coinbaseProjectId = process.env.COINBASE_PROJECT_ID || '3563a2d7-bde9-46d7-bf48-c28eaf7e1772';

// Initialize wallet from seed phrase
const initWallet = () => {
  try {
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    const wallet = ethers.Wallet.fromPhrase(seedPhrase).connect(provider);
    return { provider, wallet };
  } catch (error) {
    console.error('Failed to initialize wallet:', error);
    throw error;
  }
};

// Tool: Get wallet address
server.tool(
  'get-address',
  {},
  async () => {
    try {
      const { wallet } = initWallet();
      return {
        content: [
          { 
            type: 'text', 
            text: `Your wallet address is: ${wallet.address}` 
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          { 
            type: 'text', 
            text: `Error retrieving wallet address: ${error.message}` 
          }
        ]
      };
    }
  }
);

// Tool: List wallet balances
server.tool(
  'list-balances',
  {},
  async () => {
    try {
      const { provider, wallet } = initWallet();
      const balance = await provider.getBalance(wallet.address);
      const etherBalance = ethers.formatEther(balance);
      
      return {
        content: [
          { 
            type: 'text', 
            text: `Wallet Address: ${wallet.address}\nETH Balance: ${etherBalance} ETH` 
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          { 
            type: 'text', 
            text: `Error retrieving wallet balance: ${error.message}` 
          }
        ]
      };
    }
  }
);

// Tool: Transfer funds
server.tool(
  'transfer-funds',
  {
    destination: z.string().describe('The destination address'),
    amount: z.string().describe('The amount of ETH to transfer'),
  },
  async ({ destination, amount }) => {
    try {
      const { provider, wallet } = initWallet();
      
      // Validate destination address
      if (!ethers.isAddress(destination)) {
        return {
          content: [
            { 
              type: 'text', 
              text: 'Invalid destination address' 
            }
          ]
        };
      }
      
      // Convert amount to proper format
      const value = ethers.parseEther(amount);
      
      // Check if we have enough balance
      const balance = await provider.getBalance(wallet.address);
      if (balance < value) {
        return {
          content: [
            { 
              type: 'text', 
              text: `Insufficient balance. You have ${ethers.formatEther(balance)} ETH but attempted to send ${amount} ETH.` 
            }
          ]
        };
      }
      
      // Create and send transaction
      const tx = await wallet.sendTransaction({
        to: destination,
        value
      });
      
      return {
        content: [
          { 
            type: 'text', 
            text: `Transaction sent! Transaction hash: ${tx.hash}\nView on Etherscan: https://basescan.org/tx/${tx.hash}` 
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          { 
            type: 'text', 
            text: `Error transferring funds: ${error.message}` 
          }
        ]
      };
    }
  }
);

// Tool: Get ERC20 token balance
server.tool(
  'erc20-balance',
  {
    contractAddress: z.string().describe('The ERC20 token contract address'),
  },
  async ({ contractAddress }) => {
    try {
      const { provider, wallet } = initWallet();
      
      // ERC20 token ABI (minimal for balanceOf)
      const abi = [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)'
      ];
      
      // Create contract instance
      const tokenContract = new ethers.Contract(contractAddress, abi, provider);
      
      // Get token details
      const symbol = await tokenContract.symbol();
      const decimals = await tokenContract.decimals();
      const balance = await tokenContract.balanceOf(wallet.address);
      
      // Format the balance based on decimals
      const formattedBalance = ethers.formatUnits(balance, decimals);
      
      return {
        content: [
          { 
            type: 'text', 
            text: `${symbol} Balance: ${formattedBalance} ${symbol}\nContract Address: ${contractAddress}` 
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          { 
            type: 'text', 
            text: `Error retrieving token balance: ${error.message}` 
          }
        ]
      };
    }
  }
);

// Tool: Transfer ERC20 token
server.tool(
  'erc20-transfer',
  {
    contractAddress: z.string().describe('The ERC20 token contract address'),
    toAddress: z.string().describe('The recipient address'),
    amount: z.string().describe('The amount of tokens to transfer'),
  },
  async ({ contractAddress, toAddress, amount }) => {
    try {
      const { wallet } = initWallet();
      
      // ERC20 token ABI (minimal for transfer)
      const abi = [
        'function transfer(address to, uint amount) returns (bool)',
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)',
        'function balanceOf(address owner) view returns (uint256)'
      ];
      
      // Create contract instance with signer
      const tokenContract = new ethers.Contract(contractAddress, abi, wallet);
      
      // Get token details
      const symbol = await tokenContract.symbol();
      const decimals = await tokenContract.decimals();
      const balance = await tokenContract.balanceOf(wallet.address);
      
      // Format the balance based on decimals
      const formattedBalance = ethers.formatUnits(balance, decimals);
      
      // Parse amount with correct decimals
      const tokenAmount = ethers.parseUnits(amount, decimals);
      
      // Check if we have enough balance
      if (balance < tokenAmount) {
        return {
          content: [
            { 
              type: 'text', 
              text: `Insufficient balance. You have ${formattedBalance} ${symbol} but attempted to send ${amount} ${symbol}.` 
            }
          ]
        };
      }
      
      // Send the transfer transaction
      const tx = await tokenContract.transfer(toAddress, tokenAmount);
      
      return {
        content: [
          { 
            type: 'text', 
            text: `Transaction sent! Transaction hash: ${tx.hash}\nView on BaseScan: https://basescan.org/tx/${tx.hash}` 
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          { 
            type: 'text', 
            text: `Error transferring tokens: ${error.message}` 
          }
        ]
      };
    }
  }
);

// Register the bridge tool with the server
import bridgeTool from './src/lib/mcp/bridgeTool.js';
server.tool(bridgeTool.info.name, bridgeTool.tool, bridgeTool.info);

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);

console.log('Base Tools MCP Server started successfully'); 