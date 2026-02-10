import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { imageBase64 } = body;

        if (!imageBase64) {
            return NextResponse.json({ error: "Image data is required" }, { status: 400, headers: corsHeaders });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Extract base64 content - strip data URI prefix if present
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        const prompt = `Analiza esta imagen y retorna un JSON.
        Si es comida o una etiqueta nutricional, el JSON debe ser:
        {
          "productName": "Nombre del producto",
          "recommendation": "RECOMMENDED" | "MODERATE" | "AVOID",
          "reasoning": "Breve explicación científica (máx 15 palabras)",
          "macros": {
            "sugar": "Bajo/Medio/Alto",
            "carbs": "Bajo/Medio/Alto",
            "protein": "Bajo/Medio/Alto"
          },
          "inflammatoryIngredients": ["ingrediente1", "ingrediente2"]
        }
        Si NO es comida, retorna: {"error": "No food detected"}
        SOLO JSON, sin markdown.`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg",
                },
            },
        ]);

        const responseText = result.response.text();
        const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
            const data = JSON.parse(cleanJson);
            return NextResponse.json(data, { headers: corsHeaders });
        } catch (e) {
            console.error("JSON Parse Error", e);
            return NextResponse.json({ error: "Invalid AI response" }, { status: 500, headers: corsHeaders });
        }

    } catch (error) {
        console.error("Vision AI Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500, headers: corsHeaders }
        );
    }
}
