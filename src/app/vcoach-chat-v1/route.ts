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
        return NextResponse.json({ text: result.response.text() }, { headers: corsHeaders });
    } catch (e) { return NextResponse.json({ error: "IA Offline" }, { status: 500, headers: corsHeaders }); }
}
