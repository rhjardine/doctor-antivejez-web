import { NextResponse } from "next/server";
import { getCorsHeaders, handleCorsPreflightOrReject } from "@/lib/cors";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateDualStream } from "@/lib/ai/router";
import { requireAnySession } from "@/lib/auth-guards";
import { guardErrorResponse } from "@/lib/api-guards";
import { sanitizePatientContext } from "@/lib/ai/anonymize";

export const dynamic = 'force-dynamic';

export async function OPTIONS(req: Request) {
    return handleCorsPreflightOrReject(req, "POST, OPTIONS");
}

export async function POST(req: Request) {
    const rateLimitResponse = await checkRateLimit(req, undefined, {
        limit: 10,
        window: '1 m',
        prefix: 'ratelimit:alma'
    });
    if (rateLimitResponse) return rateLimitResponse;

    const corsHeaders = getCorsHeaders(req, "POST, OPTIONS");

    // ─── S3: BLINDAJE ───────────────────────────────────────────────────────
    // Sin este guard el endpoint era anónimo: cualquiera podía consumir las
    // claves de IA de la clínica sin límite (coste) e inyectar contenido
    // arbitrario en el system prompt vía patientContext.
    try {
        await requireAnySession(req);
    } catch (error) {
        return guardErrorResponse(error, corsHeaders);
    }
    // ────────────────────────────────────────────────────────────────────────

    try {
        const { messages, patientContext } = await req.json();

        // El contexto lo envía el cliente: se sanea SIEMPRE antes de construir
        // el prompt. El nombre real del paciente nunca sale hacia el proveedor.
        const contexto = sanitizePatientContext(patientContext);

        const systemPrompt = `Eres ALMA (Asistente de Longevidad Médica Avanzada), el copiloto de inteligencia médica de Doctor Antivejez.

    EDAD BIO: ${contexto.bioAge ?? 'No disponible'}.

    REGLAS CRÍTICAS:
    1. Responde de forma profesional, empática y basada en evidencia.
    2. CITA SIEMPRE TUS FUENTES usando el formato [1], [2] al final de las afirmaciones.
    3. NUNCA des consejos sobre autolesión o procedimientos médicos riesgosos sin supervisión.
    4. Proyecta autoridad médica refiriéndote a "nuestro equipo médico" o "protocolos de Doctor Antivejez".
    5. Mantén las respuestas concisas y estructuradas.`;

        const result = await generateDualStream({
            messages,
            system: systemPrompt,
            type: 'ALMA',
        });

        return result.toTextStreamResponse({ headers: corsHeaders });

    } catch (error) {
        console.error("ALMA API Error:", (error as Error).message);
        return NextResponse.json(
            { error: "El servicio de copiloto médico no está disponible. Contacte a soporte." },
            { status: 500, headers: corsHeaders }
        );
    }
}
