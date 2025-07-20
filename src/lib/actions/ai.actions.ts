// src/lib/actions/ai.actions.ts
'use server';

import { z } from 'zod';

// Esquema para validar la entrada del usuario
const chatSchema = z.object({
  prompt: z.string().min(1, "El prompt no puede estar vacío."),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    text: z.string(),
  })).optional(),
});

interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

/**
 * Obtiene una respuesta de un modelo de lenguaje generativo (LLM).
 * Por ahora, simula la respuesta sin conectar a la base de datos.
 * @param prompt - La pregunta del usuario.
 * @param history - El historial de la conversación.
 * @returns Un objeto con la respuesta del modelo o un error.
 */
export async function getAiChatResponse(prompt: string, history: { role: 'user' | 'model'; text: string }[]) {
  const validation = chatSchema.safeParse({ prompt, history });

  if (!validation.success) {
    return { success: false, error: "La entrada no es válida." };
  }

  // --- Construcción del Historial para la API ---
  // Se añade un prompt de sistema para darle contexto al LLM sobre su rol.
  const systemPrompt = `Eres un asistente experto en análisis de datos para un software de medicina antienvejecimiento llamado 'Doctor AntiVejez'. Tu propósito es ayudar a los profesionales de la salud a obtener información valiosa de sus pacientes. Responde de manera concisa, profesional y amigable. IMPORTANTE: Aún no tienes acceso a la base de datos real, por lo que tus respuestas sobre datos específicos de pacientes deben ser simuladas y debes indicar amablemente que la conexión a datos en tiempo real está en desarrollo.`;
  
  const chatHistory: ChatMessage[] = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: "Entendido. Soy un asistente de IA para 'Doctor AntiVejez'. Mis respuestas sobre datos de pacientes serán simuladas hasta que se complete la integración." }] }
  ];

  history.forEach(msg => {
      chatHistory.push({
          role: msg.role,
          parts: [{ text: msg.text }]
      });
  });
  chatHistory.push({ role: 'user', parts: [{ text: prompt }] });

  // --- Llamada a la API de Gemini (Simulada por ahora) ---
  // En un futuro, aquí iría la llamada a la API de Google u otro proveedor.
  // Por ahora, devolvemos una respuesta simulada para demostrar la funcionalidad.
  try {
    // Simulación de una llamada de red
    await new Promise(resolve => setTimeout(resolve, 1500));

    let simulatedResponse = "Gracias por tu pregunta. ";

    if (prompt.toLowerCase().includes("juan perez")) {
        simulatedResponse = "El paciente Juan Pérez, de 55 años, ha mostrado una mejora en su perfil cardiovascular en los últimos 3 meses, con una reducción de 5 años en su edad biológica vascular. Se recomienda continuar con el tratamiento actual y reevaluar en 60 días.";
    } else if (prompt.toLowerCase().includes("envejecimiento acelerado")) {
        simulatedResponse = "He identificado a 3 pacientes que han mostrado un envejecimiento acelerado (diferencial de edad biológica > +5 años) en el último mes: María Rodríguez, Carlos Sánchez y Ana Gómez. Sugiero revisar sus últimos tests y guías de tratamiento.";
    } else {
        simulatedResponse += "Estoy aquí para ayudarte a analizar los datos de tus pacientes. Una vez que esté completamente integrado, podré darte información en tiempo real sobre la evolución, biomarcadores y mucho más.";
    }

    return { success: true, response: simulatedResponse };

  } catch (error) {
    console.error("Error en la simulación de IA:", error);
    return { success: false, error: "El servicio de IA no está disponible en este momento." };
  }
}
