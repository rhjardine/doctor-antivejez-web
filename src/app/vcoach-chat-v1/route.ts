import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
export const dynamic = 'force-dynamic';
const corsHeaders = {
    "Access-Control-Allow-Origin": "https://doctorantivejez-patients.onrender.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
export async function OPTIONS() { return NextResponse.json({}, { headers: corsHeaders }); }
export async function POST(req: Request) {
    try {
        const { message, history, patientContext } = await req.json();
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        // CAMBIO CRÍTICO: Usar modelo estable sin prefijos beta
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const chat = model.startChat({
            history,
            generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
        });
        const result = await chat.sendMessage(`Contexto: Paciente ${patientContext.name}, Grupo ${patientContext.bloodType}. Pregunta: ${message}`);
        const text = result.response.text();

        // AUDIT LOGGING
        try {
            // Un-comment and ensure db is imported if available, or assume global db for now based on snippet
            // Since db import is missing in original file, I need to add it. 
            // Wait, I should add the import in a separate step or include it if I can access top of file. 
            // The constraint is 3 tasks. I will assume db is needed.
            // Let's rely on the user snippet behavior: "Inyecta este código".
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
            console.error("⚠️ Fallo al registrar auditoría de IA:", auditError);
        }

        return NextResponse.json({ text }, { headers: corsHeaders });
    } catch (e) { return NextResponse.json({ error: "IA Offline" }, { status: 500, headers: corsHeaders }); }
}
