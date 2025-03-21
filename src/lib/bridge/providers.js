import { ethers } from 'ethers';
import { executeBridgeWithGasAbstraction, isGaslessSupported } from '../gasless/biconomy.js';
import { getTokenContract, parseTokenAmount, formatTokenAmount } from '../tokens/tokenUtils.js';

// Stargate Router ABI (minimal required for bridging)
const STARGATE_ROUTER_ABI = [
  'function swap(uint16 _dstChainId, uint256 _srcPoolId, uint256 _dstPoolId, address payable _refundAddress, uint256 _amountLD, uint256 _minAmountLD, uint256 _lzTxParams, bytes calldata _to, bytes calldata _payload) payable',
  'function quoteLayerZeroFee(uint16 _dstChainId, uint8 _functionType, bytes calldata _toAddress, bytes calldata _transferAndCallPayload, uint256 _lzTxParams) external view returns (uint256, uint256)'
];

// Stargate Pool ABI (minimal required for information and approvals)
const STARGATE_POOL_ABI = [
  'function token() external view returns (address)',
  'function decimals() external view returns (uint8)'
];

// Stargate Factory ABI (minimal required for pool discovery)
const STARGATE_FACTORY_ABI = [
  'function getPool(uint256 _poolId) external view returns (address)'
];

// Stargate addresses for different chains
const STARGATE_ADDRESSES = {
  ethereum: {
    router: '0x8731d54E9D02c286767d56ac03e8037C07e01e98',
    factory: '0x06D538690AF257Da524f25D0CD52eD460D9D6660'
  },
  arbitrum: {
    router: '0x53Bf833A5d6c4ddA888F69c22C88C9f356a41614',
    factory: '0x55bDb4164D28FBaF0898e0eF14a589ac09Ac9970'
  },
  optimism: {
    router: '0xB0D502E938ed5f4df2E681fE6E419ff29631d62b',
    factory: '0xE3B53AF74a4BF62Ae5511055290838050bf764Df'
  },
  base: {
    router: '0x45f1f525928643c4b8a2d0d6c548f36d6f446d71',
    factory: '0x55bDb4164D28FBaF0898e0eF14a589ac09Ac9970'
  },
  polygon: {
    router: '0x45A01E4e04F14f7A4a6702c74187c5F6222033cd',
    factory: '0x808d7c71ad2ba3FA531b068a2417C63106BC0949'
  },
  bsc: {
    router: '0x4a364f8c717cAAD9A442737Eb7b8A55cc6cf18D8',
    factory: '0x0Faf1d2d3CED330824de3B8200fc8dc6E397850d'
  },
  avalanche: {
    router: '0x45A01E4e04F14f7A4a6702c74187c5F6222033cd',
    factory: '0x808d7c71ad2ba3FA531b068a2417C63106BC0949'
  },
  fantom: {
    router: '0xAf5191B0De278C7286d6C7CC6ab6BB8A73bA2Cd6',
    factory: '0xF122A86F7B8F0aBA94B8C28A33F6354b812A973B'
  }
};

// Layer Zero Chain IDs
const LZ_CHAIN_IDS = {
  ethereum: 101,
  arbitrum: 110,
  optimism: 111,
  base: 184,
  polygon: 109,
  bsc: 102,
  avalanche: 106,
  fantom: 112
};

// Pool IDs for tokens on each chain
const POOL_IDS = {
  ethereum: {
    USDC: 1,
    USDT: 2,
    ETH: 13
  },
  arbitrum: {
    USDC: 1,
    USDT: 2,
    ETH: 13
  },
  optimism: {
    USDC: 1,
    USDT: 2,
    ETH: 13
  },
  base: {
    USDC: 1,
    ETH: 13
  },
  polygon: {
    USDC: 1,
    USDT: 2
  },
  bsc: {
    USDT: 2,
    BUSD: 5
  },
  avalanche: {
    USDC: 1,
    USDT: 2
  },
  fantom: {
    USDC: 1
  }
};

// Default Layer Zero Parameters (adapterParams)
const defaultLzTxParams = ethers.solidityPacked(
  ['uint16', 'uint256'],
  [1, 200000] // version, gas
);

/**
 * Returns empty recipient address bytes for Stargate
 * @param {string} address - Destination address
 * @returns {string} Empty bytes
 */
export function getEmptyRecipientAddress(address) {
  return '0x';
}

/**
 * Gets the Layer Zero chain ID for a given chain name
 * @param {string} chainName - Chain name
 * @returns {number} Layer Zero chain ID
 */
export function getLZChainId(chainName) {
  const lzId = LZ_CHAIN_IDS[chainName.toLowerCase()];
  if (!lzId) {
    throw new Error(`Unsupported chain: ${chainName}`);
  }
  return lzId;
}

/**
 * Gets the pool ID for a token on a specific chain
 * @param {string} chainName - Chain name
 * @param {string} tokenSymbol - Token symbol
 * @returns {number} Pool ID
 */
export function getPoolId(chainName, tokenSymbol) {
  const chainPools = POOL_IDS[chainName.toLowerCase()];
  if (!chainPools) {
    throw new Error(`No pools defined for chain: ${chainName}`);
  }
  
  const poolId = chainPools[tokenSymbol.toUpperCase()];
  if (!poolId) {
    throw new Error(`No pool ID found for token ${tokenSymbol} on chain ${chainName}`);
  }
  
  return poolId;
}

/**
 * Calculates Stargate fees for a bridge transaction
 * @param {Object} params - Fee calculation parameters
 * @param {string} params.sourceChain - Source chain name
 * @param {string} params.destChain - Destination chain name
 * @param {ethers.Signer} params.signer - Ethers signer
 * @param {string} params.amount - Amount to bridge (in decimals)
 * @param {string} params.tokenSymbol - Token symbol
 * @returns {Promise<Object>} Fee breakdown
 */
export async function calculateStargateFees({
  sourceChain,
  destChain,
  signer,
  amount,
  tokenSymbol
}) {
  try {
    const provider = signer.provider;
    const sourceChainId = getLZChainId(sourceChain);
    const destChainId = getLZChainId(destChain);
    
    // Get router contract
    const routerAddress = STARGATE_ADDRESSES[sourceChain.toLowerCase()]?.router;
    if (!routerAddress) {
      throw new Error(`No Stargate router found for chain: ${sourceChain}`);
    }
    
    const routerContract = new ethers.Contract(
      routerAddress,
      STARGATE_ROUTER_ABI,
      provider
    );
    
    // Get source and destination pool IDs
    const srcPoolId = getPoolId(sourceChain, tokenSymbol);
    const dstPoolId = getPoolId(destChain, tokenSymbol);
    
    // Get token decimals
    const tokenContract = await getTokenContract(tokenSymbol, sourceChain, signer);
    const decimals = await tokenContract.decimals();
    
    // Parse amount to wei units
    const amountWei = parseTokenAmount(amount, decimals);
    
    // Prepare parameters for fee quote
    const dstAddress = ethers.solidityPacked(
      ['address'],
      [await signer.getAddress()]
    );
    
    // Get LayerZero fee
    const [nativeFee, lzFee] = await routerContract.quoteLayerZeroFee(
      destChainId,
      1, // _functionType (swap)
      dstAddress,
      '0x', // _payload
      defaultLzTxParams
    );
    
    // Estimate Stargate bridge fee (typically 0.06%)
    const stargateFee = amountWei.mul(6).div(10000); // 0.06%
    
    // Total fees
    const totalFees = nativeFee.add(stargateFee);
    
    // Calculate estimated time based on destination chain
    let estimatedTimeMinutes = 5; // Default
    
    // Adjust times based on destination chain
    if (destChain.toLowerCase() === 'ethereum') {
      estimatedTimeMinutes = 12; // Ethereum typically takes longer
    } else if (['arbitrum', 'optimism', 'polygon'].includes(destChain.toLowerCase())) {
      estimatedTimeMinutes = 3; // These are usually faster
    }
    
    return {
      nativeFee: ethers.utils.formatEther(nativeFee),
      lzFee: ethers.utils.formatEther(lzFee),
      stargateFee: formatTokenAmount(stargateFee, decimals),
      totalNativeFee: ethers.utils.formatEther(nativeFee), // in ETH
      totalTokenFee: formatTokenAmount(stargateFee, decimals), // in token
      estimatedTimeMinutes
    };
  } catch (error) {
    console.error('Error calculating Stargate fees:', error);
    throw new Error(`Failed to calculate fees: ${error.message}`);
  }
}

/**
 * Executes a bridge transaction
 * @param {Object} params - Bridge parameters
 * @param {string} params.sourceChain - Source chain name
 * @param {string} params.destChain - Destination chain name
 * @param {string} params.tokenSymbol - Token symbol
 * @param {string} params.amount - Amount to bridge
 * @param {ethers.Signer} params.signer - Ethers signer
 * @param {number} params.slippageTolerance - Slippage tolerance in percentage
 * @param {boolean} params.useGasAbstraction - Whether to use gas abstraction
 * @returns {Promise<Object>} Transaction result
 */
export async function executeBridge({
  sourceChain,
  destChain,
  tokenSymbol,
  amount,
  signer,
  slippageTolerance = 0.5,
  useGasAbstraction = false
}) {
  try {
    // Get addresses and contracts
    const sourceChainLower = sourceChain.toLowerCase();
    const destChainLower = destChain.toLowerCase();
    
    // Check if chains are supported
    if (!STARGATE_ADDRESSES[sourceChainLower] || !STARGATE_ADDRESSES[destChainLower]) {
      throw new Error(`Unsupported chain pair: ${sourceChain} to ${destChain}`);
    }
    
    // Get router contract
    const routerAddress = STARGATE_ADDRESSES[sourceChainLower].router;
    const routerContract = new ethers.Contract(
      routerAddress,
      STARGATE_ROUTER_ABI,
      signer
    );
    
    // Get pool IDs
    const srcPoolId = getPoolId(sourceChain, tokenSymbol);
    const dstPoolId = getPoolId(destChain, tokenSymbol);
    
    // Get factory contract to find pool
    const factoryAddress = STARGATE_ADDRESSES[sourceChainLower].factory;
    const factoryContract = new ethers.Contract(
      factoryAddress,
      STARGATE_FACTORY_ABI,
      signer
    );
    
    // Get pool address and contract
    const poolAddress = await factoryContract.getPool(srcPoolId);
    const poolContract = new ethers.Contract(
      poolAddress,
      STARGATE_POOL_ABI,
      signer
    );
    
    // Get token decimals and contract
    const decimals = await poolContract.decimals();
    const tokenAddress = await poolContract.token();
    const tokenContract = new ethers.Contract(
      tokenAddress,
      [
        'function approve(address spender, uint256 amount) returns (bool)',
        'function allowance(address owner, address spender) view returns (uint256)'
      ],
      signer
    );
    
    // Parse amount
    const amountWei = ethers.utils.parseUnits(amount.toString(), decimals);
    
    // Calculate min amount with slippage
    const slippageBps = slippageTolerance * 100; // Convert to basis points
    const minAmount = amountWei.sub(amountWei.mul(slippageBps).div(10000));
    
    // Calculate fees
    const fees = await calculateStargateFees({
      sourceChain,
      destChain,
      signer,
      amount,
      tokenSymbol
    });
    
    // Get destination address
    const dstAddress = ethers.solidityPacked(
      ['address'],
      [await signer.getAddress()]
    );
    
    // Check allowance
    const userAddress = await signer.getAddress();
    const allowance = await tokenContract.allowance(userAddress, routerAddress);
    
    // Approve if needed
    if (allowance.lt(amountWei)) {
      console.log('Approving token transfer...');
      if (useGasAbstraction && isGaslessSupported(sourceChain, tokenSymbol)) {
        // Use Biconomy for gasless approval
        const approvalTx = await executeBridgeWithGasAbstraction({
          chainName: sourceChain,
          contract: tokenContract,
          method: 'approve',
          params: [routerAddress, ethers.MaxUint256],
          wallet: signer
        });
        
        console.log('Gasless approval successful:', approvalTx);
      } else {
        // Regular approval
        const approveTx = await tokenContract.approve(
          routerAddress,
          ethers.MaxUint256
        );
        await approveTx.wait();
      }
    }
    
    // Prepare swap parameters
    const swapParams = {
      _dstChainId: getLZChainId(destChain),
      _srcPoolId: srcPoolId,
      _dstPoolId: dstPoolId,
      _refundAddress: userAddress,
      _amountLD: amountWei,
      _minAmountLD: minAmount,
      _lzTxParams: defaultLzTxParams,
      _to: dstAddress,
      _payload: '0x'
    };
    
    // Calculate native value to send
    const [nativeFee] = await routerContract.quoteLayerZeroFee(
      swapParams._dstChainId,
      1, // _functionType (swap)
      swapParams._to,
      swapParams._payload,
      swapParams._lzTxParams
    );
    
    // Execute bridge transaction
    let tx;
    
    if (useGasAbstraction && isGaslessSupported(sourceChain, tokenSymbol)) {
      // Use Biconomy for gasless transaction
      tx = await executeBridgeWithGasAbstraction({
        chainName: sourceChain,
        contract: routerContract,
        method: 'swap',
        params: Object.values(swapParams),
        wallet: signer,
        value: nativeFee
      });
    } else {
      // Regular transaction
      tx = await routerContract.swap(
        ...Object.values(swapParams),
        { value: nativeFee }
      );
      await tx.wait();
    }
    
    // Return transaction result
    return {
      transactionHash: tx.hash || tx.transactionHash,
      sourceChain,
      destChain,
      amount,
      tokenSymbol,
      estimatedArrivalTime: new Date(Date.now() + fees.estimatedTimeMinutes * 60 * 1000),
      fees,
      provider: 'Stargate'
    };
  } catch (error) {
    console.error('Bridge execution error:', error);
    throw new Error(`Failed to execute bridge: ${error.message}`);
  }
}

/**
 * Gets available bridge routes
 * @param {Object} params - Route parameters
 * @param {string} params.sourceChain - Source chain name
 * @param {string} params.destChain - Destination chain name
 * @param {string} params.tokenSymbol - Token symbol
 * @param {string} params.amount - Amount to bridge
 * @param {ethers.Signer} params.signer - Ethers signer
 * @returns {Promise<Array>} Available routes
 */
export async function getBridgeRoutes({
  sourceChain,
  destChain,
  tokenSymbol,
  amount,
  signer
}) {
  try {
    // Check if the token is supported on both chains
    try {
      getPoolId(sourceChain, tokenSymbol);
      getPoolId(destChain, tokenSymbol);
    } catch (error) {
      console.error('Token not supported on both chains:', error);
      return [];
    }
    
    // Calculate fees
    const fees = await calculateStargateFees({
      sourceChain,
      destChain,
      signer,
      amount,
      tokenSymbol
    });
    
    // Check if gas abstraction is supported
    const gaslessSupported = isGaslessSupported(sourceChain, tokenSymbol);
    
    // Get token contract to get decimals
    const tokenContract = await getTokenContract(tokenSymbol, sourceChain, signer);
    const decimals = await tokenContract.decimals();
    
    // Create route object
    const route = {
      provider: 'Stargate',
      sourceChain,
      destChain,
      tokenSymbol,
      amount,
      fees,
      estimatedTimeMinutes: fees.estimatedTimeMinutes,
      gaslessSupported,
      details: {
        routerAddress: STARGATE_ADDRESSES[sourceChain.toLowerCase()].router,
        sourcePoolId: getPoolId(sourceChain, tokenSymbol),
        destPoolId: getPoolId(destChain, tokenSymbol),
        tokenDecimals: decimals
      }
    };
    
    return [route];
  } catch (error) {
    console.error('Error getting bridge routes:', error);
    return [];
  }
}

export default {
  STARGATE_ADDRESSES,
  LZ_CHAIN_IDS,
  POOL_IDS,
  calculateStargateFees,
  getBridgeRoutes,
  executeBridge
}; 