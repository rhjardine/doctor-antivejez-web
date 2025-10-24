'use server';

import { prisma } from '@/lib/db';
// ✅ CAMBIO: Importar el cliente de OpenAI en lugar de Gemini
import openai from '@/lib/openai';
import { PatientWithDetails } from '@/types';
import { anonymizePatientData } from '@/lib/ai/anonymize';

// La función buildClinicalPrompt no necesita cambios. Es universal.
function buildClinicalPrompt(anonymizedData: any): string {
  // ... (el contenido de esta función es exactamente el mismo)
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
    // La lógica para obtener el paciente no cambia
    const patient = await prisma.patient.findUnique({ /* ... */ });
    // ... (el resto de la lógica de obtención y validación de datos es la misma)

    // --- CÓDIGO DE OBTENCIÓN DE PACIENTE (SIN CAMBIOS) ---
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
    // --- FIN DEL CÓDIGO SIN CAMBIOS ---

    console.log(`[AI_ACTION] Enviando prompt a OpenAI para paciente ID: ${patientId}`);

    // ✅ CAMBIO: Lógica para llamar a la API de OpenAI
    const model = 'gpt-3.5-turbo';
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente médico experto en medicina antienvejecimiento y longevidad. Tu tarea es analizar los datos clínicos de un paciente y generar un resumen conciso y profesional en formato Markdown.',
        },
        { role: 'user', content: prompt },
      ],
    });

    const summary = completion.choices[0]?.message?.content;
    
    if (!summary) {
      console.error(`[AI_ACTION] La respuesta de OpenAI para el paciente ${patientId} estaba vacía.`);
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
        modelUsed: model, // ✅ CAMBIO: Registrar el modelo de OpenAI
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