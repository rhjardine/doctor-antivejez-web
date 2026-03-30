import { NextResponse } from "next/server";
import { getCorsHeaders, handleCorsPreflightOrReject } from "@/lib/cors";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateDualText } from "@/lib/ai/router";

export const dynamic = 'force-dynamic';

export async function OPTIONS(req: Request) {
    return handleCorsPreflightOrReject(req, "POST, OPTIONS");
}

export async function POST(req: Request) {
    const rateLimitResponse = await checkRateLimit(req, undefined, {
        limit: 20,
        window: '1 m',
        prefix: 'ratelimit:ai'
    });
    if (rateLimitResponse) return rateLimitResponse;

    const corsHeaders = getCorsHeaders(req, "POST, OPTIONS");

    try {
        const { message, history, patientContext } = await req.json();

        const systemPrompt = `Eres el VCoach de Doctor Antivejez. 
    Paciente: ${patientContext?.name || 'Paciente'}. 
    Edad Bio: ${patientContext?.bioAge || '?'}. 
    Grupo Sanguíneo: ${patientContext?.bloodType || '?'}.
    
    Responde de manera concisa, médica y motivadora.
    Usa el contexto del paciente para personalizar la respuesta.
    Si pregunta sobre alimentos, verifica compatibilidad con su grupo sanguíneo ${patientContext?.bloodType || '?'}.`;

        // Convert history to CoreMessage format for AI SDK
        const messages = [
            ...history.map((h: any) => ({
                role: h.role === 'model' ? 'assistant' : 'user',
                content: h.parts?.[0]?.text || h.text || '',
            })),
            { role: 'user', content: message }
        ];

        const result = await generateDualText({
            messages,
            system: systemPrompt,
            type: 'VCOACH',
        });

        return NextResponse.json({ text: result.text }, { headers: corsHeaders });

    } catch (error) {
        console.error("VCoach API Error:", (error as Error).message);
        return NextResponse.json(
            { error: "Servicio temporalmente no disponible. Reintentando vía gateway secundario..." },
            { status: 500, headers: corsHeaders }
        );
    }
}
