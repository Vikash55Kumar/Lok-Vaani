import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function getEmbedding(text: string): Promise<number[]> {
  try {
    // Truncate text to avoid token limits (Gemini embedding has ~2k token limit)
    const truncatedText = text.slice(0, 2000);
    
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await model.embedContent(truncatedText);
    
    return result.embedding.values;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error(`Failed to generate embedding: ${error}`);
  }
}

export function splitTextIntoChunks(
  text: string,
  chunkSize: number = 800,
  overlap: number = 200
): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(text.length, start + chunkSize);
    const chunk = text.slice(start, end);
    
    // Skip very short chunks
    if (chunk.trim().length > 50) {
      chunks.push(chunk.trim());
    }
    
    start += chunkSize - overlap;
  }
  
  return chunks;
}

//  Generate AI response using Gemini
export async function generateAIResponse(
  systemPrompt: string,
  context: string,
  userQuestion: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `${systemPrompt}

Context:
${context}

Question: ${userQuestion}

Instructions: Answer based ONLY on the provided context. If information is insufficient, clearly state that. Do not invent statistics or percentages.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generating AI response:", error);
    throw new Error(`Failed to generate AI response: ${error}`);
  }
}


// Add delay between API calls to handle rate limits

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}