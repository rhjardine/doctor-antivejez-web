import { createOpenAI } from '@ai-sdk/openai';

/**
 * AI Providers Configuration (H24)
 * 
 * Configures the Vercel AI SDK providers for the dual-gateway architecture.
 * Uses OpenRouter as primary and SiliconFlow as secondary.
 */

// Primary: OpenRouter (Higher Availability, Global Access)
export const openrouter = createOpenAI({
    baseURL: process.env.AI_GATEWAY_URL || 'https://openrouter.ai/api/v1',
    apiKey: process.env.AI_GATEWAY_KEY,
    headers: {
        'HTTP-Referer': 'https://doctor-antivejez.com', // Required by OpenRouter
        'X-Title': 'Doctor Antivejez WebApp',
    },
});

// Secondary: SiliconFlow (Geopolitical Resilience, Fast Inference)
export const siliconflow = createOpenAI({
    baseURL: process.env.AI_GATEWAY_SECONDARY_URL || 'https://api.siliconflow.cn/v1',
    apiKey: process.env.AI_GATEWAY_SECONDARY_KEY,
});

// Model Constants
export const MODELS = {
    ALMA: {
        primary: 'deepseek/deepseek-chat', // OpenRouter path
        secondary: 'deepseek-ai/DeepSeek-V3', // SiliconFlow path
    },
    VCOACH: {
        primary: 'nvidia/llama-3.1-nemotron-70b-instruct',
        secondary: 'qwen/qwen-2.5-72b-instruct',
    }
};
