import { streamText, generateText, type ModelMessage } from 'ai';
import { openrouter, siliconflow, MODELS } from './providers';

/**
 * Dual Gateway Router (H24)
 * 
 * Orchestrates AI requests with a "Primary-First" strategy.
 * If the primary gateway (OpenRouter) fails or is blocked, 
 * it silently falls back to the secondary gateway (SiliconFlow).
 */

interface RouterOptions {
    messages: ModelMessage[];
    system: string;
    type: keyof typeof MODELS; // 'ALMA' | 'VCOACH'
}

export async function generateDualStream({ messages, system, type }: RouterOptions) {
    const modelPair = MODELS[type];

    try {
        // Attempt Primary (OpenRouter)
        return await streamText({
            model: openrouter(modelPair.primary),
            system,
            messages,
            temperature: 0.6,
            maxOutputTokens: 1000,
        });
    } catch (primaryError) {
        console.error(`[AI Router] Primary Gateway (${type}) failed:`, primaryError);

        // Silent Fallback to Secondary (SiliconFlow)
        try {
            console.log(`[AI Router] Falling back to Secondary Gateway for ${type}...`);
            return await streamText({
                model: siliconflow(modelPair.secondary),
                system,
                messages,
                temperature: 0.6,
                maxOutputTokens: 1000,
            });
        } catch (secondaryError) {
            console.error(`[AI Router] Secondary Gateway also failed:`, secondaryError);
            throw new Error('Lo sentimos, el servicio de inteligencia médica no está disponible en este momento. Intente más tarde.');
        }
    }
}

/**
 * Non-streaming version of the Dual Gateway Router.
 * Used for maintaining compatibility with existing frontend services (VCoach).
 */
export async function generateDualText({ messages, system, type }: RouterOptions) {
    const modelPair = MODELS[type];

    try {
        // Attempt Primary (OpenRouter)
        return await generateText({
            model: openrouter(modelPair.primary),
            system,
            messages,
            temperature: 0.6,
            maxOutputTokens: 1000,
        });
    } catch (primaryError) {
        console.error(`[AI Router] Primary Gateway (${type}) failed:`, primaryError);

        // Silent Fallback to Secondary (SiliconFlow)
        try {
            console.log(`[AI Router] Falling back to Secondary Gateway for ${type}...`);
            return await generateText({
                model: siliconflow(modelPair.secondary),
                system,
                messages,
                temperature: 0.6,
                maxOutputTokens: 1000,
            });
        } catch (secondaryError) {
            console.error(`[AI Router] Secondary Gateway also failed:`, secondaryError);
            throw new Error('Lo sentimos, el servicio de inteligencia médica no está disponible en este momento. Intente más tarde.');
        }
    }
}
