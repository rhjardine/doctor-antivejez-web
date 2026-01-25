import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';

const corsHeaders = {
    "Access-Control-Allow-Origin": "https://doctorantivejez-patients.onrender.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
    try {
        const { message, history, patientContext } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error("❌ GEMINI_API_KEY no configurada");
            return NextResponse.json({ error: "IA temporalmente fuera de línea" }, { status: 500, headers: corsHeaders });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Construcción del cerebro contextual
        const systemInstruction = `Eres el VCoach Senior de Doctor Antivejez. Hablas con ${patientContext.name}. 
                                    Su Edad Cronológica es ${patientContext.chronoAge}, su Edad Biográfica es ${patientContext.bioAge}. 
                                    Tiene un bono de vitalidad de ${patientContext.gap} años. 
                                    Su Grupo Sanguíneo es ${patientContext.bloodType}. 
                                    DA CONSEJOS BASADOS ESTRICTAMENTE EN ESTE PERFIL Y EL PROTOCOLO DE LONGEVIDAD.`;

        const chat = model.startChat({
            history: history,
            generationConfig: { maxOutputTokens: 800, temperature: 0.5 }
        });

        const result = await chat.sendMessage(`${systemInstruction}\n\nPregunta del paciente: ${message}`);
        const response = await result.response;

        return NextResponse.json({ text: response.text() }, { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error("🔥 Error en VCoach Proxy:", error);
        return NextResponse.json({ error: "Error de comunicación con el laboratorio" }, { status: 500, headers: corsHeaders });
    }
}
