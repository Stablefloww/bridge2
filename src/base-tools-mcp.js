import http from 'http';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Get a wallet from the given seed phrase
 * @returns {Promise<ethers.Wallet>} Wallet
 */
async function getWallet() {
  try {
    // Get the seed phrase from environment variables
    const seedPhrase = process.env.SEED_PHRASE;
    if (!seedPhrase) {
      throw new Error('Seed phrase not found in environment variables');
    }
    
    // Create wallet from seed phrase
    const wallet = ethers.Wallet.fromPhrase(seedPhrase);
    
    // Create provider for Base
    const rpcUrl = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Connect wallet to provider
    const signer = wallet.connect(provider);
    
    return signer;
  } catch (error) {
    console.error('Error getting wallet:', error);
    throw new Error(`Failed to initialize wallet: ${error.message}`);
  }
}

/**
 * Initialize and start the HTTP server
 */
async function initialize() {
  try {
    console.log('Starting Base Tools server...');
    
    // Get wallet
    const wallet = await getWallet();
    console.log(`Wallet ready: ${await wallet.getAddress()}`);
    
    // Create HTTP server
    const server = http.createServer(async (req, res) => {
      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      // Handle OPTIONS request (CORS preflight)
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }
      
      // Only accept POST requests
      if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
      }
      
      // Parse URL
      const url = new URL(req.url, `http://${req.headers.host}`);
      
      // Handle different endpoints
      try {
        if (url.pathname === '/address') {
          // Get user address
          const address = await wallet.getAddress();
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            address,
            message: `Your wallet address is: ${address}`
          }));
        } else if (url.pathname === '/balances') {
          // Get balances (mock data for now)
          const address = await wallet.getAddress();
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            address,
            balances: [
              { chain: 'Base', token: 'ETH', balance: '1.25' },
              { chain: 'Base', token: 'USDC', balance: '100.00' }
            ],
            message: `Balances for ${address} on Base`
          }));
        } else if (url.pathname === '/bridge') {
          // Handle bridge requests
          let body = '';
          
          req.on('data', (chunk) => {
            body += chunk.toString();
          });
          
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              
              // Process the bridge command (mocked for now)
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                message: `Processed command: "${data.content}"`,
                data: {
                  command: data.content,
                  timestamp: new Date().toISOString()
                }
              }));
            } catch (error) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not found' }));
        }
      } catch (error) {
        console.error('Request error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    
    // Start the server
    const port = process.env.PORT || 3333;
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Start the server
initialize(); 