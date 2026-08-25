import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// Abstraction for AI provider
export class AIProvider {
  private ai: GoogleGenerativeAI | null = null;

  constructor() {
    const key = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
    if (key) {
      this.ai = new GoogleGenerativeAI(key);
    } else {
      console.warn("⚠️ No AI_API_KEY found. Running in MOCK AI mode.");
    }
  }

  async createEmbedding(text: string): Promise<number[]> {
    if (!this.ai) {
      return Array(3072).fill(0).map(() => Math.random() * 2 - 1);
    }
    
    try {
      const model = this.ai.getGenerativeModel({ model: process.env.EMBEDDING_MODEL || "gemini-embedding-001" });
      const result = await model.embedContent(text);
      if (process.env.CHATBOT_DEBUG === 'true') {
        console.log(`[CHATBOT_DEBUG] Generated embedding for text (length: ${text.length}).`);
      }
      return result.embedding.values;
    } catch (err) {
      console.warn("⚠️ Embedding failed. Falling back to mock 768-d vector. Error:", err);
      return Array(768).fill(0).map(() => Math.random() * 2 - 1);
    }
  }

  async generateResponse(systemPrompt: string, userMessage: string, maxTokens: number = 1000): Promise<string> {
    if (!this.ai) {
      return "This is a mock response from the WeDonate AI Assistant because no API key was provided in the .env file.";
    }
    
    const modelName = process.env.AI_MODEL || "gemini-3.6-flash";
    if (process.env.CHATBOT_DEBUG === 'true') {
      console.log(`[CHATBOT_DEBUG] Calling Gemini with model: ${modelName}`);
    }

    try {
      const model = this.ai.getGenerativeModel({ 
        model: modelName,
        systemInstruction: systemPrompt 
      });
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.1 }
      });
      
      if (process.env.CHATBOT_DEBUG === 'true') {
        console.log(`[CHATBOT_DEBUG] Gemini response received. Candidates:`, result.response.candidates?.length);
      }
      return result.response.text();
    } catch (error) {
      console.error("[CHATBOT_DEBUG] Gemini generation error:", error);
      throw error;
    }
  }
}

export const aiProvider = new AIProvider();
