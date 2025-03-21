import { BiconomySmartAccountV2, DEFAULT_ENTRYPOINT_ADDRESS } from "@biconomy/account"
import { ChainId } from "@biconomy/core-types"
import { ECDSAOwnershipValidationModule } from "@biconomy/modules"
import { ethers } from "ethers"

export const initBiconomy = async (chainId: ChainId, provider: ethers.JsonRpcProvider) => {
  const bundlerUrl = `https://bundler.biconomy.io/api/v2/${chainId}/${process.env.NEXT_PUBLIC_BICONOMY_BUNDLER_KEY}`
  const paymasterUrl = `https://paymaster.biconomy.io/api/v2/${chainId}/${process.env.NEXT_PUBLIC_BICONOMY_PAYMASTER_KEY}`
  
  try {
    // Create signer from private key or seed phrase
    // This is a placeholder - in a real app, you would use a secure wallet solution
    const seedPhrase = process.env.SEED_PHRASE || "increase stove still book elevator place knife intact degree globe notable feature"
    const wallet = ethers.Wallet.fromPhrase(seedPhrase).connect(provider)
    
    // Create ECDSA validation module
    const validationModule = await ECDSAOwnershipValidationModule.create({
      signer: wallet,
      moduleAddress: "0x0000001a970f0daa2bb4bd06739197ed90b3dfc3" // ECDSA module on most chains
    })
    
    // Initialize the smart account
    const smartAccount = await BiconomySmartAccountV2.create({
      chainId,
      bundlerUrl,
      paymasterUrl,
      entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
      defaultValidationModule: validationModule,
      activeValidationModule: validationModule
    })
    
    return smartAccount
  } catch (error) {
    console.error("Error initializing Biconomy:", error)
    throw error
  }
} 