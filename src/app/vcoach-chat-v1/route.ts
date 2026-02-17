import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCorsHeaders, handleCorsPreflightOrReject } from "@/lib/cors";
import { checkRateLimit } from "@/lib/rate-limit";

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
        const { message, history, patientContext } = await req.json();
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: `Eres el VCoach de "Doctor Antivejez", un experto en medicina preventiva, antienvejecimiento y nutrigenómica. 
            Tu misión es guiar al paciente hacia su regeneración celular basándote en sus biomarcadores.
            
            DATOS CRÍTICOS DEL PACIENTE:
            - Nombre: ${patientContext.name}
            - Edad Cronológica: ${patientContext.chronoAge} años
            - Edad Biológica: ${patientContext.bioAge} años
            - BRECHA (GAP): ${patientContext.gap} años (Si es positivo, hay rezago; si es negativo, hay rejuvenecimiento).
            - Grupo Sanguíneo: ${patientContext.bloodType} (Crucial para recomendaciones nutrigenómicas).
            
            REGLAS DE RESPUESTA:
            1. Sé motivador pero científico. 
            2. Usa los datos del paciente para personalizar cada consejo. Si su GAP es alto, enfatiza la urgencia de seguir la "Guía del Paciente".
            3. En nutrición, respeta estrictamente las reglas del grupo ${patientContext.bloodType}.
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

        // AUDIT LOGGING (non-blocking)
        try {
            const { db } = await import("@/lib/db");
            await db.aIAnalysis.create({
                data: {
                    patientId: patientContext.id,
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
    } catch (e) {
        return NextResponse.json({ error: "IA Offline" }, { status: 500, headers: corsHeaders });
    }
}
