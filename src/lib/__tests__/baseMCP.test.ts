import { ethers } from 'ethers'

describe('Base MCP Configuration', () => {
  const seedPhrase = "increase stove still book elevator place knife intact degree globe notable feature"
  
  it('should be able to derive a wallet from the seed phrase', () => {
    // Create wallet from mnemonic
    const wallet = ethers.Wallet.fromPhrase(seedPhrase)
    
    // Check that we have a valid address
    expect(ethers.isAddress(wallet.address)).toBe(true)
    
    // Show the address in the test output
    console.log('Derived wallet address:', wallet.address)
  })
  
  it('should have the correct Coinbase API credentials', async () => {
    // Check environment variables are set correctly
    const apiKeyName = process.env.COINBASE_API_KEY_NAME || process.env.NEXT_PUBLIC_COINBASE_API_KEY_NAME
    const projectId = process.env.COINBASE_PROJECT_ID || process.env.NEXT_PUBLIC_COINBASE_PROJECT_ID
    const privateKey = process.env.COINBASE_API_PRIVATE_KEY || process.env.NEXT_PUBLIC_COINBASE_API_PRIVATE_KEY
    
    // Verify credentials match expected values
    expect(apiKeyName).toBe('builder')
    expect(projectId).toBe('3563a2d7-bde9-46d7-bf48-c28eaf7e1772')
    expect(privateKey).toBeDefined()
    
    // Create signature using private key (just to test the key format)
    const testMessage = 'test-message'
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const message = timestamp + 'GET' + '/test'
    
    if (privateKey) {
      const crypto = require('crypto')
      const hmac = crypto.createHmac('sha256', privateKey)
      const signature = hmac.update(message).digest('base64')
      
      // Just verify we can create signatures
      expect(signature).toBeTruthy()
      console.log('Generated test signature successfully')
    }
  })
  
  it('should initialize Base MCP config correctly', () => {
    // Mock require function to load the base-mcp-config.json
    const fs = require('fs')
    const configFile = fs.readFileSync('./base-mcp-config.json', 'utf-8')
    const config = JSON.parse(configFile)
    
    // Verify the configuration
    expect(config.mcpServers).toBeDefined()
    expect(config.mcpServers['base-mcp']).toBeDefined()
    
    const mcpConfig = config.mcpServers['base-mcp']
    
    // Verify command and environment
    expect(mcpConfig.command).toBe('npx')
    expect(mcpConfig.args).toContain('base-mcp@latest')
    expect(mcpConfig.env.SEED_PHRASE).toBe(seedPhrase)
    expect(mcpConfig.env.COINBASE_API_KEY_NAME).toBe('builder')
    expect(mcpConfig.env.COINBASE_PROJECT_ID).toBe('3563a2d7-bde9-46d7-bf48-c28eaf7e1772')
  })
}) 