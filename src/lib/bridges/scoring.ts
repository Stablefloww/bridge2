import { ethers } from 'ethers';
import type { BridgeRoute, RouteScore } from './types';

// Weights for different scoring factors
const WEIGHTS = {
  FEES: 0.35,    // 35% weight for fees
  TIME: 0.25,    // 25% weight for time
  RELIABILITY: 0.25, // 25% weight for reliability
  LIQUIDITY: 0.15    // 15% weight for liquidity
};

/**
 * Provider reliability ratings (0-10)
 * These values are subjective and should be updated based on real-world performance
 */
const PROVIDER_RELIABILITY: Record<string, number> = {
  'Stargate': 9.2,
  'Hop': 8.7,
  'Across': 8.5,
  'default': 7.0 // Default for unknown providers
};

/**
 * Provider liquidity ratings (0-10)
 * These values are subjective and should be updated based on real-world data
 */
const PROVIDER_LIQUIDITY: Record<string, number> = {
  'Stargate': 9.5,
  'Hop': 8.0,
  'Across': 7.8,
  'default': 7.0 // Default for unknown providers
};

/**
 * Score routes based on various factors
 * @param routes Array of bridge routes to score
 * @returns Array of scored routes with their scores
 */
export function scoreRoutes(routes: BridgeRoute[]): {route: BridgeRoute, totalScore: number}[] {
  if (!routes || routes.length === 0) {
    return [];
  }
  
  // Extract scores for each factor
  const feeScores = scoreFees(routes);
  const timeScores = scoreTimes(routes);
  
  // Calculate total scores
  const scoredRoutes = routes.map((route, index) => {
    const providerName = route.provider;
    
    // Get reliability and liquidity scores from our predefined ratings
    const reliabilityScore = PROVIDER_RELIABILITY[providerName] || PROVIDER_RELIABILITY.default;
    const liquidityScore = PROVIDER_LIQUIDITY[providerName] || PROVIDER_LIQUIDITY.default;
    
    // Calculate weighted total score
    const totalScore = 
      feeScores[index] * WEIGHTS.FEES +
      timeScores[index] * WEIGHTS.TIME +
      reliabilityScore * WEIGHTS.RELIABILITY +
      liquidityScore * WEIGHTS.LIQUIDITY;
    
    // Return route with its score details
    return {
      route,
      totalScore,
      fees: feeScores[index],
      time: timeScores[index],
      reliability: reliabilityScore,
      liquidity: liquidityScore
    };
  });
  
  // Sort by total score (highest first)
  return scoredRoutes.sort((a, b) => b.totalScore - a.totalScore);
}

/**
 * Score routes based on fees
 * Lower fees get higher scores
 * @param routes Array of bridge routes
 * @returns Array of fee scores (0-10)
 */
function scoreFees(routes: BridgeRoute[]): number[] {
  // Extract fee information
  const fees = routes.map(route => {
    // Convert string fees to numeric values
    const gasFee = parseFloat(route.estimatedGasFee);
    const bridgeFee = parseFloat(route.bridgeFee);
    
    // Calculate total fee
    return gasFee + bridgeFee;
  });
  
  // Find the minimum and maximum fees
  const minFee = Math.min(...fees);
  const maxFee = Math.max(...fees);
  
  // If all fees are the same, give full score to all
  if (minFee === maxFee) {
    return fees.map(() => 10);
  }
  
  // Calculate fee scores (inverse mapping: lower fees get higher scores)
  // Score = 10 - 9 * (fee - minFee) / (maxFee - minFee)
  // This gives 10 to the lowest fee and 1 to the highest fee
  return fees.map(fee => {
    return 10 - 9 * (fee - minFee) / (maxFee - minFee);
  });
}

/**
 * Score routes based on estimated completion times
 * Faster times get higher scores
 * @param routes Array of bridge routes
 * @returns Array of time scores (0-10)
 */
function scoreTimes(routes: BridgeRoute[]): number[] {
  // Extract time information (in minutes)
  const times = routes.map(route => route.estimatedTime);
  
  // Find the minimum and maximum times
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  // If all times are the same, give full score to all
  if (minTime === maxTime) {
    return times.map(() => 10);
  }
  
  // Calculate time scores (inverse mapping: lower times get higher scores)
  // Score = 10 - 9 * (time - minTime) / (maxTime - minTime)
  // This gives 10 to the fastest time and 1 to the slowest time
  return times.map(time => {
    return 10 - 9 * (time - minTime) / (maxTime - minTime);
  });
}

/**
 * Get a detailed explanation of why a route was scored as it was
 * @param route The bridge route
 * @param score The score details
 * @returns A human-readable explanation
 */
export function getRouteExplanation(route: BridgeRoute, score: RouteScore): string {
  const { fees, time, reliability, liquidity, totalScore } = score;
  
  return `
    ${route.provider} received a total score of ${totalScore.toFixed(1)} out of 10:
    - Fees: ${fees.toFixed(1)}/10 (${route.bridgeFee} ${route.token} + ${route.estimatedGasFee} gas)
    - Speed: ${time.toFixed(1)}/10 (estimated ${route.estimatedTime} minutes)
    - Reliability: ${reliability.toFixed(1)}/10
    - Liquidity: ${liquidity.toFixed(1)}/10
  `.trim();
} 