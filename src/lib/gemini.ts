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
 * @param modelName The name of the model to use.
 * @returns The generative model instance.
 */
export function getGenerativeModel(modelName = 'gemini-pro') { // ✅ CORRECCIÓN: Cambiado a 'gemini-pro'
  // El modelo 'gemini-pro' es el modelo estándar, estable y ampliamente disponible
  // para tareas de generación de texto, y es compatible con la API v1beta.
  // 'gemini-1.5-flash' puede requerir acceso anticipado o estar en una API diferente.
  return genAI.getGenerativeModel({ model: modelName });
}