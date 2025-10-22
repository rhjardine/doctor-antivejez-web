'use server';

import { prisma } from '@/lib/db';
// ✅ CORRECCIÓN FINAL: Se cambia la importación de geminiModel para que sea una
// importación por defecto (sin llaves), que es como se exporta en gemini.ts.
import geminiModel from '@/lib/gemini';
import { PatientWithDetails } from '@/types';
import { anonymizePatientData } from '@/lib/ai/anonymize';

/**
 * Construye un prompt estructurado y de alta calidad para el análisis clínico.
 */
function buildClinicalPrompt(anonymizedData: any): string {
  return `
Rol: Eres un médico experto en medicina funcional, antienvejecimiento y longevidad con 20 años de experiencia.

Contexto: Estás analizando los datos clínicos anonimizados de un paciente.
Datos del Paciente:
${JSON.stringify(anonymizedData, null, 2)}

Tarea: Genera un análisis clínico conciso y profesional en formato Markdown. La respuesta debe estar estructurada en las siguientes secciones exactas:
1.  **Resumen Ejecutivo:** Una breve sinopsis (2-3 frases) del perfil del paciente.
2.  **Hallazgos Clave:** Identifica los 3 a 5 biomarcadores o métricas más preocupantes o fuera del rango óptimo. Para cada uno, explica su implicación clínica de forma clara.
3.  **Evaluación de Riesgos:** Basado en los hallazgos, describe los riesgos potenciales para la salud a mediano plazo (ej. riesgo cardiometabólico, estrés oxidativo, desequilibrio hormonal).
4.  **Recomendaciones Priorizadas:** Sugiere de 3 a 4 áreas de enfoque para el tratamiento, ordenadas por prioridad. Deben ser recomendaciones de alto nivel (ej. "Optimizar metabolismo de la glucosa", "Reducir inflamación sistémica", "Soporte al eje adrenal").

Restricciones:
- Basa tu análisis únicamente en los datos proporcionados.
- No inventes información ni des diagnósticos definitivos.
- Utiliza terminología médica precisa pero comprensible.
- La respuesta final DEBE ser únicamente el texto en formato Markdown, sin preámbulos como "Claro, aquí está tu análisis".
`;
}

/**
 * Genera un resumen clínico para un paciente, registrando la interacción.
 */
export async function generateClinicalSummary(patientId: string) {
  const startTime = Date.now();
  
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        biophysicsTests: { orderBy: { testDate: 'desc' }, take: 1 },
        biochemistryTests: { orderBy: { testDate: 'desc' }, take: 1 },
        orthomolecularTests: { orderBy: { testDate: 'desc' }, take: 1 },
        guides: { orderBy: { createdAt: 'desc' }, take: 3, select: { createdAt: true, observations: true } },
        user: { select: { id: true, name: true, email: true } },
        appointments: false,
        foodPlans: false,
        aiAnalyses: false,
      },
    });

    if (!patient) {
      return { success: false, error: 'Paciente no encontrado.' };
    }

    const fullPatientDetails = {
        ...patient,
        appointments: [],
        foodPlans: [],
        aiAnalyses: [],
    } as PatientWithDetails;

    const anonymizedData = anonymizePatientData(fullPatientDetails);
    const prompt = buildClinicalPrompt(anonymizedData);
    
    const result = await geminiModel.generateContent(prompt);
    const response = result.response;
    const summary = response.text();
    
    if (!summary) {
      throw new Error('La respuesta de la IA estaba vacía.');
    }

    const endTime = Date.now();
    const responseTime = (endTime - startTime) / 1000;

    await prisma.aiAnalysis.create({
      data: {
        patientId,
        analysisType: 'clinical_summary',
        prompt,
        response: summary,
        responseTime,
        modelUsed: 'gemini-1.5-flash',
      },
    });

    return { success: true, summary };

  } catch (error: any) {
    console.error('Error en generateClinicalSummary:', {
      error: error.message,
      patientId,
    });
    
    return { 
      success: false, 
      error: 'El agente de IA no pudo generar el análisis. Por favor, inténtelo de nuevo más tarde.' 
    };
  }
}