import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { StargateClient, getStargateChainId } from '@/lib/bridges/stargate';
import { executeBridgeWithGasAbstraction } from '@/lib/gasless/biconomy';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      sourceChain, 
      destinationChain, 
      token, 
      amount, 
      walletAddress,
      slippage = 0.5
    } = body;

    if (!sourceChain || !destinationChain || !token || !amount || !walletAddress) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameters' 
        },
        { status: 400 }
      );
    }

    // Convert chain names to Stargate chain IDs
    const srcChainId = getStargateChainId(sourceChain);
    const dstChainId = getStargateChainId(destinationChain);

    if (!srcChainId || !dstChainId) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Unsupported chain: ${!srcChainId ? sourceChain : destinationChain}` 
        },
        { status: 400 }
      );
    }

    // Create provider and connect to the source chain
    const provider = new ethers.JsonRpcProvider(process.env[`${sourceChain.toUpperCase()}_RPC_URL`]);
    
    // In a real implementation, we would get a wallet from a secure source
    // For demo purposes, we're using a demo wallet from env
    const privateKey = process.env.DEMO_PRIVATE_KEY || '';
    const wallet = new ethers.Wallet(privateKey, provider);

    // Initialize Stargate client
    const stargateClient = new StargateClient(wallet, srcChainId);

    // Get router contract
    const routerContract = stargateClient.getRouterContract();

    // Prepare bridge parameters
    const amountBN = ethers.parseUnits(amount, 18); // Assuming 18 decimals
    const minAmountBN = stargateClient.calculateMinAmount(amountBN, slippage);

    // Execute bridge transaction with gas abstraction via Biconomy
    const result = await executeBridgeWithGasAbstraction({
      chainName: sourceChain,
      contract: routerContract,
      method: token.toUpperCase() === 'ETH' ? 'swapETH' : 'swap',
      params: token.toUpperCase() === 'ETH' ? [
        dstChainId,
        walletAddress, // refund address
        ethers.solidityPacked(['address'], [walletAddress]), // destination address
        amountBN,
        minAmountBN
      ] : [
        // Parameters for ERC20 tokens would go here
        // This would need to be implemented based on Stargate's swap method
      ],
      wallet,
      value: token.toUpperCase() === 'ETH' ? amountBN : BigInt(0)
    });

    return NextResponse.json({
      success: true,
      transactionHash: result.transactionHash,
      sourceChain,
      destinationChain,
      token,
      amount
    });
  } catch (error) {
    console.error('Bridge API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 