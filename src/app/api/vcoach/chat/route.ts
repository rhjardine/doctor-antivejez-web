import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';

const corsHeaders = {
    "Access-Control-Allow-Origin": "https://doctorantivejez-patients.onrender.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
    try {
        const { message, history, patientContext } = await req.json();

        // Server-side API Key check
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("❌ Missing GEMINI_API_KEY in server environment");
            return NextResponse.json(
                { error: "Server Configuration Error: API Key missing" },
                { status: 500, headers: corsHeaders }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // Construct robust system prompt
        const systemInstruction = `Eres el VCoach de Doctor Antivejez. 
    Paciente: ${patientContext?.name || 'Paciente'}. 
    Edad Bio: ${patientContext?.bioAge || '?'}. 
    Grupo Sanguíneo: ${patientContext?.bloodType || '?'}.
    
    Responde de manera concisa, médica y motivadora.
    Usa el contexto del paciente para personalizar la respuesta.
    Si pregunta sobre alimentos, verifica compatibilidad con su grupo sanguíneo ${patientContext?.bloodType || '?'}.`;

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: systemInstruction
        });

        // Sanitize history
        const validHistory = Array.isArray(history) ? history.map((h: any) => ({
            role: h.role === 'user' || h.role === 'model' ? h.role : 'user',
            parts: h.parts || [{ text: "" }]
        })) : [];

        const chat = model.startChat({ history: validHistory });
        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

        return NextResponse.json({ text: responseText }, {
            headers: corsHeaders
        });

    } catch (error) {
        console.error("🔥 VCoach Backend Error:", error);
        return NextResponse.json(
            { error: "El servicio de IA está temporalmente no disponible." },
            { status: 500, headers: corsHeaders }
        );
    }
}
