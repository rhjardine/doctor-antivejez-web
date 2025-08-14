'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getPatientDetails } from './patients.actions';

// --- Inicialización del Cliente de Google AI ---
// Se asegura de que la clave de API exista y, de lo contrario, lanza un error.
const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  throw new Error('La variable de entorno GOOGLE_API_KEY no está definida.');
}
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Genera un prompt estructurado para el modelo de IA.
 * @param patient - El objeto completo del paciente con sus detalles.
 * @returns Un string formateado que sirve como prompt para el LLM.
 */
const buildPrompt = (patient: any): string => {
  // Serializa los tests para incluirlos en el prompt de forma legible.
  const biophysicsSummary = patient.biophysicsTests.map((test: any) => ({
    fecha: new Date(test.testDate).toLocaleDateString('es-VE'),
    edadBiologica: test.biologicalAge.toFixed(1),
    diferencial: test.differentialAge.toFixed(1),
  }));

  const biochemistrySummary = patient.biochemistryTests.map((test: any) => ({
    fecha: new Date(test.testDate).toLocaleDateString('es-VE'),
    edadBioquimica: test.biologicalAge.toFixed(1),
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
    const prompt = buildPrompt(patientDetailsResult.patient);

    // 3. Seleccionar el modelo y generar el contenido.
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return { success: true, data: text };
  } catch (error: any) {
    console.error('Error al contactar la API de Google Gemini:', error);
    // Devuelve un mensaje de error más específico si es posible.
    const errorMessage = error.message?.includes('API key not valid')
      ? 'La clave de API de Google no es válida. Verifícala en tus variables de entorno.'
      : 'No se pudo obtener una respuesta del Agente IA.';
    return { success: false, error: errorMessage };
  }
}
