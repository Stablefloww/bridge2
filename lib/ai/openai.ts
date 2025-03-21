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
export async function getChatCompletion(prompt: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      store: true,
      messages: [
        { role: "user", content: prompt },
      ],
    });

    return completion.choices[0].message.content || "No response generated";
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return "Sorry, there was an error processing your request.";
  }
} 