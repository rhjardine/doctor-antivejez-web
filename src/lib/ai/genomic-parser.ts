// src/lib/ai/genomic-parser.ts
// Genomic Intelligence Module - AI Extraction Service
// Uses Gemini for structured extraction from Fagron lab reports (TeloTest & NutriGen PDFs)

import { GoogleGenerativeAI } from "@google/generative-ai";

// ============================================================
// TYPES — Structured Output Schemas
// ============================================================

export interface TeloTestExtraction {
    reportType: 'TELOTEST';
    sampleCode: string;
    sampleDate: string;
    analysisDate: string;
    patientName: string;
    averageTelomereLength: string;   // e.g., "1.34 kb"
    estimatedBiologicalAge: number;  // e.g., 53
    chronologicalAge: number;        // e.g., 56
    agingDifference: number;         // e.g., -3
    interpretation: string;
    therapeuticRecommendations: Array<{ category: string; items: string[] }>;
    generalRecommendations: Array<{ category: string; points: string[] }>;
    // PWA summary field
    summary: {
        telomereLength: string;
        biologicalAge: number;
        agingDelta: number;
        rejuvenationScore: number; // 0-100
    };
}

export interface NutriGenExtraction {
    reportType: 'NUTRIGEN';
    sampleCode: string;
    patientName: string;
    analysisDate: string;
    geneticVariants: Array<{
        gene: string;
        variant: string;
        genotype: string;
        clinicalSignificance: string;
    }>;
    categories: Array<{
        name: string;
        riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
        findings: string[];
        recommendations: string[];
    }>;
    // PWA summary field
    summary: {
        totalVariantsAnalyzed: number;
        highRiskCount: number;
        moderateRiskCount: number;
        rejuvenationScore: number; // 0-100
    };
}

export type GenomicExtraction = TeloTestExtraction | NutriGenExtraction;

export interface ExtractionResult {
    success: boolean;
    data?: GenomicExtraction;
    clinicalError?: string;
}

// ============================================================
// PROMPTS — Clinical-grade extraction prompts
// ============================================================

const TELOTEST_PROMPT = `You are a clinical genomics data extraction specialist. 
Analyze this Fagron TeloTest laboratory report PDF and extract ONLY the data present in the document.

Return a JSON object with this EXACT structure (no markdown, ONLY JSON):
{
  "reportType": "TELOTEST",
  "sampleCode": "the sample/client code from the report",
  "sampleDate": "sample collection date in DD/MM/YYYY format",
  "analysisDate": "analysis date in DD/MM/YYYY format", 
  "patientName": "patient full name from the report",
  "averageTelomereLength": "telomere length value with unit (e.g. '1.34 kb')",
  "estimatedBiologicalAge": <number - biological age in years>,
  "chronologicalAge": <number - chronological age in years>,
  "agingDifference": <number - difference between biological and chronological age>,
  "interpretation": "the interpretation text from the report",
  "therapeuticRecommendations": [
    { "category": "category name", "items": ["item1", "item2"] }
  ],
  "generalRecommendations": [
    { "category": "category name", "points": ["point1", "point2"] }
  ],
  "summary": {
    "telomereLength": "value with unit",
    "biologicalAge": <number>,
    "agingDelta": <number>,
    "rejuvenationScore": <number 0-100, where 100 = youngest biological age relative to chronological>
  }
}

RULES:
- Extract ONLY data that exists in the document
- For rejuvenationScore: calculate as max(0, min(100, 50 + (chronologicalAge - biologicalAge) * 5))
- If a field is not found, use null
- Return ONLY the JSON object, no markdown formatting`;

const NUTRIGEN_PROMPT = `You are a clinical genomics data extraction specialist.
Analyze this Fagron NutriGen laboratory report PDF and extract the genetic variant data.

Return a JSON object with this EXACT structure (no markdown, ONLY JSON):
{
  "reportType": "NUTRIGEN",
  "sampleCode": "the sample code from the report",
  "patientName": "patient full name from the report",
  "analysisDate": "analysis date in DD/MM/YYYY format",
  "geneticVariants": [
    {
      "gene": "gene name",
      "variant": "variant identifier (e.g. rs12345)",
      "genotype": "e.g. AG, CC, TT",
      "clinicalSignificance": "brief clinical meaning"
    }
  ],
  "categories": [
    {
      "name": "category name (e.g. Detoxification, Inflammation)",
      "riskLevel": "LOW" | "MODERATE" | "HIGH",
      "findings": ["finding1", "finding2"],
      "recommendations": ["recommendation1", "recommendation2"]
    }
  ],
  "summary": {
    "totalVariantsAnalyzed": <number>,
    "highRiskCount": <number>,
    "moderateRiskCount": <number>,
    "rejuvenationScore": <number 0-100, calculated from risk profile>
  }
}

RULES:
- Extract ALL genetic variants found in the document
- Categorize findings by their clinical area
- For rejuvenationScore: calculate as max(0, 100 - (highRiskCount * 10) - (moderateRiskCount * 5))
- Return ONLY the JSON object, no markdown formatting`;

// ============================================================
// CORE — Extraction Engine
// ============================================================

/**
 * Extract structured genomic data from a PDF using Gemini AI.
 * PII PROTECTION: The patientId is an internal identifier — the patient's
 * actual name from the PDF is only stored in the clinical record, never
 * sent as a query parameter to external services.
 */
export async function extractGenomicData(
    pdfBase64: string,
    reportType: 'TELOTEST' | 'NUTRIGEN'
): Promise<ExtractionResult> {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return {
                success: false,
                clinicalError: 'Error de configuración: API Key de Gemini no encontrada. Contacte al administrador del sistema.',
            };
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Use Gemini 1.5 Pro for its large context window (handles 71-page PDFs)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const prompt = reportType === 'TELOTEST' ? TELOTEST_PROMPT : NUTRIGEN_PROMPT;

        console.log(`[GenomicParser] Starting extraction for ${reportType}...`);

        // Strip data URI prefix if present
        const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, "");

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: cleanBase64,
                    mimeType: "application/pdf",
                },
            },
        ]);

        const responseText = result.response.text();
        console.log(`[GenomicParser] AI Response received (Length: ${responseText.length})`);

        // Clean potential markdown wrapping
        const cleanJson = responseText
            .replace(/```json\s*/g, "")
            .replace(/```\s*/g, "")
            .trim();

        try {
            const data = JSON.parse(cleanJson) as GenomicExtraction;
            console.log(`[GenomicParser] JSON parsed successfully for ${reportType}`);
            return { success: true, data };
        } catch (parseError) {
            console.error("[GenomicParser] JSON parsing failed:", parseError);
            console.debug("[GenomicParser] Raw response text:", responseText);
            return {
                success: false,
                clinicalError: 'El informe no pudo ser interpretado correctamente. Verifique que es un PDF válido de Fagron y reintente.',
            };
        }
    } catch (error: any) {
        console.error("[GenomicParser] Extraction error:", error);

        // Graceful clinical errors instead of code crashes
        if (error.message?.includes('SAFETY')) {
            return {
                success: false,
                clinicalError: 'El contenido del documento fue bloqueado por el filtro de seguridad. Contacte soporte técnico.',
            };
        }

        if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
            return {
                success: false,
                clinicalError: 'Límite de procesamiento alcanzado. Espere unos minutos y reintente.',
            };
        }

        return {
            success: false,
            clinicalError: 'Error interno al procesar el informe genómico. Si el problema persiste, contacte soporte técnico.',
        };
    }
}
