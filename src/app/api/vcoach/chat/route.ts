import { NextResponse } from "next/server";
import { getCorsHeaders, handleCorsPreflightOrReject } from "@/lib/cors";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateDualText } from "@/lib/ai/router";
import { requireAnySession } from "@/lib/auth-guards";
import { guardErrorResponse } from "@/lib/api-guards";
import { sanitizePatientContext } from "@/lib/ai/anonymize";

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

    // ─── S3: BLINDAJE ───────────────────────────────────────────────────────
    try {
        await requireAnySession(req);
    } catch (error) {
        return guardErrorResponse(error, corsHeaders);
    }
    // ────────────────────────────────────────────────────────────────────────

    try {
        const { message, history, patientContext } = await req.json();

        // Saneado obligatorio: fuera nombre y cualquier otro identificador.
        const contexto = sanitizePatientContext(patientContext);
        const grupoSanguineo = contexto.bloodType ?? '?';

        const systemPrompt = `Eres el VCoach de Doctor Antivejez.
    Edad Bio: ${contexto.bioAge ?? '?'}.
    Grupo Sanguíneo: ${grupoSanguineo}.

    Responde de manera concisa, médica y motivadora.
    Usa el contexto clínico para personalizar la respuesta.
    Si pregunta sobre alimentos, verifica compatibilidad con su grupo sanguíneo ${grupoSanguineo}.`;

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
