// src/lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

// Get the API key from environment variables
const apiKey = process.env.GEMINI_API_KEY;

// Ensure the API key is available
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not defined in the environment variables.');
}

// Initialize the GoogleGenerativeAI client
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Gets the generative model from Google AI.
 * @param modelName The name of the model to use (e.g., 'gemini-1.5-flash').
 * @returns The generative model instance.
 */
export function getGenerativeModel(modelName = 'gemini-1.5-flash') {
  return genAI.getGenerativeModel({ model: modelName });
}
//Move