import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Generative AI instance
export const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyAXeFYl6Rs9_iNrwEXEQ4h3a8hZZV4C-ko"
);

/**
 * Generate content using Google's Gemini model
 * @param prompt The text prompt to generate content from
 * @returns The generated text response
 */
export const generateContent = async (prompt: string): Promise<string> => {
  try {
    // In a real implementation, this would make API calls to Google's Gemini
    // For now, we'll just simulate a response
    return Promise.resolve(JSON.stringify({
      sourceChain: "base",
      destinationChain: "optimism",
      token: "USDC",
      amount: "50",
      gasPreference: "fast"
    }));
  } catch (error) {
    console.error("Error calling Gemini:", error);
    throw error;
  }
}; 