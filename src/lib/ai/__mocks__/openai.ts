// Mock implementation of OpenAI client
export const getChatCompletion = async (prompt: string): Promise<string> => {
  return JSON.stringify({
    sourceChain: "base",
    destinationChain: "ethereum",
    token: "ETH",
    amount: "0.1",
    gasPreference: "normal"
  });
}; 