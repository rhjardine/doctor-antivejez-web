'use server';

import { prisma } from '@/lib/db';
import { getGenerativeModel } from '@/lib/gemini';
import { PatientWithDetails } from '@/types';
import { anonymizePatientData } from '@/lib/ai/anonymize';

// La función buildClinicalPrompt no necesita cambios.
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

export async function generateClinicalSummary(patientId: string) {
  const startTime = Date.now();
  console.log(`[AI_ACTION] Iniciando análisis para paciente ID: ${patientId}`);

  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        biophysicsTests: { orderBy: { testDate: 'desc' }, take: 1 },
        biochemistryTests: { orderBy: { testDate: 'desc' }, take: 1 },
        orthomolecularTests: { orderBy: { testDate: 'desc' }, take: 1 },
        guides: { orderBy: { createdAt: 'desc' }, take: 3 },
        appointments: { take: 0 },
        foodPlans: { take: 0 },
        aiAnalyses: { take: 0 },
      },
    });

    if (!patient) {
      console.error(`[AI_ACTION] Paciente no encontrado con ID: ${patientId}`);
      return { success: false, error: 'Paciente no encontrado.' };
    }

    const hasClinicalData = patient.biophysicsTests.length > 0 || patient.biochemistryTests.length > 0 || patient.orthomolecularTests.length > 0;
    if (!hasClinicalData) {
        console.warn(`[AI_ACTION] El paciente ${patientId} no tiene datos de tests para analizar.`);
        return { success: false, error: 'El paciente no tiene resultados de tests registrados para generar un análisis.' };
    }

    const patientDetails = patient as PatientWithDetails;
    const anonymizedData = anonymizePatientData(patientDetails);
    const prompt = buildClinicalPrompt(anonymizedData);
    
    console.log(`[AI_ACTION] Enviando prompt a Gemini para paciente ID: ${patientId}`);

    const model = getGenerativeModel();
    const result = await model.generateContent(prompt);
    
    const response = result.response;
    const summary = response.text();
    
    if (!summary) {
      console.error(`[AI_ACTION] La respuesta de Gemini para el paciente ${patientId} estaba vacía.`);
      throw new Error('La respuesta de la IA estaba vacía.');
    }

    console.log(`[AI_ACTION] Análisis generado exitosamente para paciente ID: ${patientId}`);
    const endTime = Date.now();
    const responseTime = (endTime - startTime) / 1000;

    await prisma.aIAnalysis.create({
      data: {
        patientId,
        analysisType: 'clinical_summary',
        prompt,
        response: summary,
        responseTime,
        // ✅ SOLUCIÓN: Actualizamos el nombre del modelo para consistencia.
        modelUsed: 'gemini-pro',
      },
    });

    return { success: true, summary };

  } catch (error: any) {
    console.error(`[AI_ACTION] Error catastrófico en generateClinicalSummary para paciente ID: ${patientId}`, error);
    
    return { 
      success: false, 
      error: 'El agente de IA no pudo generar el análisis. Por favor, inténtelo de nuevo más tarde.' 
    };
  }
}