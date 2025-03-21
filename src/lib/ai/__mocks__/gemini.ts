// Mock implementation of Gemini client
export const generateContent = async (prompt: string): Promise<string> => {
  return JSON.stringify({
    sourceChain: "base",
    destinationChain: "optimism",
    token: "USDC",
    amount: "50",
    gasPreference: "fast"
  });
}; 