// Import ethers
import { ethers } from 'ethers';

// The seed phrase
const seedPhrase = 'increase stove still book elevator place knife intact degree globe notable feature';

// Test wallet derivation
try {
  const wallet = ethers.Wallet.fromPhrase(seedPhrase);
  console.log('Wallet derived successfully');
  console.log('Address:', wallet.address);
  
  // Connect to Base chain
  const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
  const connectedWallet = wallet.connect(provider);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('Balance:', ethers.formatEther(balance), 'ETH');
  
  console.log('Test completed successfully');
} catch (error) {
  console.error('Test failed:', error);
} 