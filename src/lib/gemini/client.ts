import { GoogleGenAI } from "@google/genai";

let geminiInstance: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  if (!geminiInstance) {
    geminiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "placeholder-key",
    });
  }
  return geminiInstance;
}

export const client = getGemini();
