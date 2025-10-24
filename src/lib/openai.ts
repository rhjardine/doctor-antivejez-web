// src/lib/openai.ts
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  // Este error detendrá el build si la variable de entorno no está configurada,
  // lo cual es una medida de seguridad importante.
  throw new Error('OPENAI_API_KEY is not defined in the environment variables.');
}

const openai = new OpenAI({
  apiKey: apiKey,
});

export default openai;