'use server';

import { getPatientDetails } from './patients.actions';
import { PatientWithDetails } from '@/types';

/**
 * Genera un prompt estructurado para el modelo de IA.
 * @param patient - El objeto completo del paciente con sus detalles.
 * @returns Un string formateado que sirve como prompt para el LLM.
 */
const buildPrompt = (patient: PatientWithDetails): string => {
  // Serializa los tests para incluirlos en el prompt de forma legible.
  const biophysicsSummary = patient.biophysicsTests.map((test: any) => ({
    fecha: new Date(test.testDate).toLocaleDateString('es-VE'),
    edadBiologica: test.biologicalAge.toFixed(1),
    diferencial: test.differentialAge.toFixed(1),
  }));

  const biochemistrySummary = patient.biochemistryTests.map((test: any) => ({
    fecha: new Date(test.testDate).toLocaleDateString('es-VE'),
    edadBioquimica: test.biochemicalAge.toFixed(1),
    diferencial: test.differentialAge.toFixed(1),
  }));

  return `
    **Contexto:** Eres "Doctor AntiVejez IA", un asistente experto en medicina antienvejecimiento. Tu tarea es analizar los datos de un paciente y proporcionar un resumen claro, conciso y accionable para el médico tratante.

    **Datos del Paciente:**
    - **Nombre:** ${patient.firstName} ${patient.lastName}
    - **Edad Cronológica:** ${patient.chronologicalAge} años
    - **Género:** ${patient.gender}
    - **Resumen Historial Biofísico:** ${JSON.stringify(biophysicsSummary, null, 2)}
    - **Resumen Historial Bioquímico:** ${JSON.stringify(biochemistrySummary, null, 2)}
    - **Observaciones Generales:** ${patient.observations || 'No hay observaciones.'}

    **Tarea:**
    Basado en los datos proporcionados, genera un informe con el siguiente formato Markdown:

    ### 📝 Resumen Ejecutivo
    Un párrafo breve que resuma la condición general del paciente, destacando la relación entre su edad cronológica y sus edades biológicas.

    ### ⚠️ Puntos Críticos de Atención
    Una lista de viñetas (bullet points) con los 3 a 5 hallazgos más importantes o preocupantes de sus últimos tests. Menciona los marcadores específicos que están fuera del rango óptimo.

    ### 💡 Recomendaciones Sugeridas
    Una lista de viñetas con recomendaciones claras y accionables para el médico. Sugiere posibles áreas de intervención, estudios adicionales o cambios en el estilo de vida que podrían beneficiar al paciente.

    **Instrucciones Adicionales:**
    - Utiliza un lenguaje profesional y técnico, pero claro.
    - Sé objetivo y basa tus conclusiones únicamente en los datos proporcionados.
    - No inventes información. Si faltan datos, menciónalo.
  `;
};

/**
 * Obtiene una respuesta del Agente IA basada en los datos de un paciente.
 * @param patientId - El ID del paciente a analizar.
 * @returns Un objeto con el estado del éxito y la respuesta del modelo o un mensaje de error.
 */
export async function getAIResponse(patientId: string) {
  try {
    // 1. Obtener los detalles completos del paciente.
    const patientDetailsResult = await getPatientDetails(patientId);
    if (!patientDetailsResult.success || !patientDetailsResult.patient) {
      return { success: false, error: 'No se pudieron obtener los datos del paciente.' };
    }

    // 2. Construir el prompt.
    const prompt = buildPrompt(patientDetailsResult.patient as PatientWithDetails);

    // 3. Realizar la llamada a la API de Gemini usando fetch.
    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };
    const apiKey = process.env.GOOGLE_API_KEY || ""; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const errorBody = await res.json();
        console.error('Error from Gemini API:', errorBody);
        const errorMessage = errorBody?.error?.message || 'Error en la API de Gemini.';
        if (errorMessage.includes('API key not valid')) {
            return { success: false, error: 'La clave de API de Google no es válida. Verifícala en tus variables de entorno.' };
        }
        return { success: false, error: `Error en la API de Gemini: ${res.statusText}` };
    }

    const result = await res.json();
    
    if (result.candidates && result.candidates.length > 0 && result.candidates[0].content?.parts?.length > 0) {
      const text = result.candidates[0].content.parts[0].text;
      return { success: true, data: text };
    } else {
      console.error("Unexpected response structure from Gemini API:", result);
      return { success: false, error: 'Respuesta inesperada del Agente IA.' };
    }

  } catch (error: any) {
    console.error('Error al contactar la API de Google Gemini:', error);
    return { success: false, error: 'No se pudo obtener una respuesta del Agente IA.' };
  }
}
 