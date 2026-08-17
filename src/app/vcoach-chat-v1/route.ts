import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCorsHeaders, handleCorsPreflightOrReject } from "@/lib/cors";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateMobileSession } from '@/lib/auth-guards';
import { sanitizePatientContext } from '@/lib/ai/anonymize';

export const dynamic = 'force-dynamic';

export async function OPTIONS(req: Request) {
    return handleCorsPreflightOrReject(req, "POST, OPTIONS");
}

export async function POST(req: Request) {
    // Rate limit check
    const rateLimitResponse = await checkRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    const corsHeaders = getCorsHeaders(req, "POST, OPTIONS");

    try {
        // ── MOBILE AUTH GUARD (Centralizado) ──────────────────────────────────
        const session = await validateMobileSession(req);
        // ────────────────────────────────────────────────────────────────────────

        const { message, history, patientContext } = await req.json();

        // SECURITY: Verificar que el patientContext.id del body coincide con el token
        if (!patientContext || patientContext.id !== session.id) {
            console.warn(
                `[SECURITY WARN] VCoach IDOR attempt | ` +
                `tokenId=${session.id} bodyId=${patientContext?.id ?? 'NULL'}`
            );
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403, headers: corsHeaders });
        }

        // Multi-Tenant: verificar existencia y pertenencia del paciente
        const { db } = await import("@/lib/db");
        const tenantFilter = session.tenantId
            ? { id: session.id, tenantId: session.tenantId, deletedAt: null }
            : { id: session.id, deletedAt: null };

        const patientExists = await db.patient.findFirst({
            where: tenantFilter,
            select: { id: true },
        });

        if (!patientExists) {
            return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404, headers: corsHeaders });
        }

        // ─── S3: saneado obligatorio antes de construir el prompt ───────────
        // Este endpoint sí exigía sesión, pero interpolaba el nombre real del
        // paciente en el systemInstruction, que viaja a Google. El nombre no
        // aporta nada clínico y es un identificador directo.
        const contextoSeguro = sanitizePatientContext(patientContext);
        const grupoSanguineo = contextoSeguro.bloodType ?? '?';
        const gap =
            typeof contextoSeguro.bioAge === 'number' &&
            typeof contextoSeguro.chronologicalAge === 'number'
                ? contextoSeguro.bioAge - contextoSeguro.chronologicalAge
                : '?';
        // ────────────────────────────────────────────────────────────────────

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: `Eres el VCoach de "Doctor Antivejez", un experto en medicina preventiva, antienvejecimiento y nutrigenómica.
            Tu misión es guiar al paciente hacia su regeneración celular basándote en sus biomarcadores.
            
            DATOS CRÍTICOS DEL PACIENTE (anonimizados — sin identificadores):
            - Edad Cronológica: ${contextoSeguro.chronologicalAge ?? '?'} años
            - Edad Biológica: ${contextoSeguro.bioAge ?? '?'} años
            - BRECHA (GAP): ${gap} años (Si es positivo, hay rezago; si es negativo, hay rejuvenecimiento).
            - Grupo Sanguíneo: ${grupoSanguineo} (Crucial para recomendaciones nutrigenómicas).
            
            REGLAS DE RESPUESTA:
            1. Sé motivador pero científico. 
            2. Usa los datos del paciente para personalizar cada consejo. Si su GAP es alto, enfatiza la urgencia de seguir la "Guía del Paciente".
            3. En nutrición, respeta estrictamente las reglas del grupo ${grupoSanguineo}.
            4. Si te preguntan algo fuera de la medicina preventiva, redirige amablemente al paciente a consultar con su médico tratante.`
        });

        const chat = model.startChat({
            history: history.map((h: any) => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.content || h.text }]
            })),
            generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
        });

        const result = await chat.sendMessage(message);
        const text = result.response.text();

        // AUDIT LOGGING (non-blocking) — usa session.id del token (nunca del body)
        try {
            await db.aIAnalysis.create({
                data: {
                    patientId: session.id,  // SECURE: del token JWT, no del body
                    analysisType: 'vcoach_chat',
                    prompt: message,
                    response: text,
                    modelUsed: 'gemini-1.5-flash',
                    responseTime: 0,
                }
            });
        } catch (auditError) {
            console.error("Audit logging failed:", (auditError as Error).message);
        }

        return NextResponse.json({ text }, { headers: corsHeaders });
    } catch (e: any) {
        const isAuthError = e?.message?.startsWith('UNAUTHORIZED');
        if (isAuthError) {
            return NextResponse.json({ error: e.message }, { status: 401, headers: corsHeaders });
        }
        return NextResponse.json({ error: "IA Offline" }, { status: 500, headers: corsHeaders });
    }
}
