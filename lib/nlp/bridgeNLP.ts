import { getChatCompletion } from '../ai/openai';
import { generateContent } from '../ai/gemini';

// Define types for bridge command parameters
export interface BridgeCommand {
  sourceChain?: string;
  destinationChain: string;
  token: string;
  amount: string;
  gasPreference?: 'fast' | 'normal' | 'slow';
}

/**
 * Processes a natural language bridge command to extract the parameters
 * @param userInput The natural language input from the user
 * @returns Parsed bridge command parameters
 */
export async function processNLPCommand(userInput: string): Promise<BridgeCommand | null> {
  try {
    // Prompt for the AI model
    const prompt = `
      Parse the following bridge command into structured data. Extract:
      - Source chain (default to Base if not specified)
      - Destination chain
      - Token
      - Amount
      - Gas preference (default to normal if not specified)
      
      Command: "${userInput}"
      
      Return only a valid JSON object with the following structure:
      {
        "sourceChain": string,
        "destinationChain": string,
        "token": string,
        "amount": string,
        "gasPreference": "fast" | "normal" | "slow"
      }
    `;
    
    // Use OpenAI by default, fallback to Gemini if OpenAI fails
    let responseText: string;
    try {
      responseText = await getChatCompletion(prompt);
    } catch (error) {
      console.log("Falling back to Gemini for NLP processing");
      responseText = await generateContent(prompt);
    }
    
    // Parse the response JSON
    try {
      // Find the JSON object in the response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in the response");
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate the required fields
      if (!parsed.destinationChain || !parsed.token || !parsed.amount) {
        throw new Error("Missing required fields in parsed command");
      }
      
      // Set default values if not provided
      if (!parsed.sourceChain) parsed.sourceChain = "base";
      if (!parsed.gasPreference) parsed.gasPreference = "normal";
      
      return parsed as BridgeCommand;
    } catch (error) {
      console.error("Error parsing NLP response:", error);
      return null;
    }
  } catch (error) {
    console.error("Error in NLP processing:", error);
    return null;
  }
}

/**
 * Generates a clarification question if the original command is ambiguous
 * @param userInput The original user input
 * @param missingParams Array of missing parameters
 * @returns A clarification question to ask the user
 */
export async function generateClarificationQuestion(
  userInput: string,
  missingParams: string[]
): Promise<string> {
  try {
    const prompt = `
      The user is trying to bridge crypto assets with this command: "${userInput}"
      
      I need to ask for clarification about these missing details: ${missingParams.join(', ')}.
      
      Generate a friendly, brief question asking for these specific details. Don't explain what bridging is - just ask for the missing information.
    `;
    
    return await getChatCompletion(prompt);
  } catch (error) {
    console.error("Error generating clarification:", error);
    return `Could you please clarify the ${missingParams.join(', ')} for your bridge request?`;
  }
} 