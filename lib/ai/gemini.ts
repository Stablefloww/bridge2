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
export async function generateContent(prompt: string): Promise<string> {
  try {
    // Access the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Generate content from the prompt
    const result = await model.generateContent(prompt);
    
    // Return the text response
    return result.response.text();
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    return "Sorry, there was an error generating content.";
  }
} 