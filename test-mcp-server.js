// Import required libraries
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ethers } from 'ethers';

// Initialize MCP server
async function main() {
  console.log('Starting MCP server tests...');
  
  // 1. Test wallet derivation
  const seedPhrase = 'increase stove still book elevator place knife intact degree globe notable feature';
  
  try {
    const wallet = ethers.Wallet.fromPhrase(seedPhrase);
    console.log('✅ Wallet derivation test passed');
    console.log('   Address:', wallet.address);
  } catch (error) {
    console.error('❌ Wallet derivation test failed:', error);
    return;
  }
  
  // 2. Test MCP server initialization
  let server;
  try {
    server = new McpServer({
      name: 'Base Tools MCP Test',
      version: '1.0.0',
      description: 'Testing the Base Tools MCP server'
    });
    console.log('✅ MCP server initialization test passed');
  } catch (error) {
    console.error('❌ MCP server initialization test failed:', error);
    return;
  }
  
  // 3. Test tool registration
  try {
    // Register a simple test tool
    server.tool(
      'test-tool',
      {},
      async () => {
        return {
          content: [{ type: 'text', text: 'Test successful' }]
        };
      }
    );
    console.log('✅ Tool registration test passed');
  } catch (error) {
    console.error('❌ Tool registration test failed:', error);
    return;
  }
  
  // 4. Test wallet initialization function
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
  
  try {
    const { provider, wallet } = initWallet();
    console.log('✅ Wallet initialization function test passed');
    console.log('   Connected address:', wallet.address);
  } catch (error) {
    console.error('❌ Wallet initialization function test failed:', error);
    return;
  }
  
  // 5. Test provider connection
  try {
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    const network = await provider.getNetwork();
    console.log('✅ Provider connection test passed');
    console.log('   Connected to network:', network.name);
    console.log('   Chain ID:', network.chainId);
  } catch (error) {
    console.error('❌ Provider connection test failed:', error);
    return;
  }
  
  console.log('\nAll tests completed successfully! ✨');
}

main().catch(error => {
  console.error('Test suite failed:', error);
}); 