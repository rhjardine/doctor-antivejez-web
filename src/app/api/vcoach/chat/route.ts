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

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("Missing GEMINI_API_KEY in server environment");
            return NextResponse.json({ error: "Server misconfiguration" }, { status: 500, headers: corsHeaders });
        }

        // La clave aquí se lee del servidor (seguro)
        const genAI = new GoogleGenerativeAI(apiKey);

        const systemInstruction = `Eres el VCoach de Doctor Antivejez. 
    Paciente: ${patientContext?.name || 'Paciente'}. 
    Edad Cronológica: ${patientContext?.chronoAge || '?'}.
    Edad Biológica: ${patientContext?.bioAge || '?'}. 
    Grupo Sanguíneo: ${patientContext?.bloodType || '?'}.
    
    MISIÓN: Proveer asesoría de alta precisión en medicina funcional y longevidad. 
    REGLAS:
    1. Todas las recomendaciones de suplementos o dieta deben respetar el grupo sanguíneo ${patientContext?.bloodType || '?'}.
    2. Usa la diferencia de edad (Bono de Vitalidad) para motivar.
    3. Si el paciente pregunta algo fuera de su protocolo, indícale que 'el Dr. Admin debe validar este cambio en la próxima consulta'.
    4. Sé empático, profesional y evita tecnicismos innecesarios.
    Responde en español.`;

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: systemInstruction
        });

        // Validar history para evitar errores si es undefined o mal formado
        const validHistory = Array.isArray(history) ? history.map((h: any) => ({
            role: h.role === 'user' || h.role === 'model' ? h.role : 'user',
            parts: h.parts || [{ text: "" }]
        })) : [];

        const chat = model.startChat({ history: validHistory });
        const result = await chat.sendMessage(message);

        return NextResponse.json({ text: result.response.text() }, {
            headers: corsHeaders
        });
    } catch (error) {
        console.error("VCoach Backend Error:", error);
        return NextResponse.json({ error: "IA Offline" }, { status: 500, headers: corsHeaders });
    }
}
