import OpenAI from "openai";

// Create a client instance with your API key
export const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || "your-api-key-here",
});

/**
 * Send a chat completion request to OpenAI
 * @param prompt The user's message
 * @returns The AI response
 */
export const getChatCompletion = async (prompt: string): Promise<string> => {
  try {
    // In a real implementation, this would make API calls to OpenAI
    // For now, we'll just simulate a response
    return Promise.resolve(JSON.stringify({
      sourceChain: "base",
      destinationChain: "ethereum",
      token: "ETH",
      amount: "0.1",
      gasPreference: "normal"
    }));
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw error;
  }
}; 