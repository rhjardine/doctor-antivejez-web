// src/lib/actions/ai.actions.ts
'use server';

import { prisma } from '@/lib/db';
import { getGenerativeModel } from '@/lib/gemini';
import { revalidatePath } from 'next/cache';

/**
 * Generates a clinical summary for a given patient using the Gemini AI.
 * @param patientId The ID of the patient.
 * @returns An object with success status and the generated summary or an error message.
 */
export async function generateClinicalSummary(patientId: string) {
  if (!patientId) {
    return { success: false, error: 'Patient ID is required.' };
  }

  try {
    // 1. Fetch comprehensive patient data from the database
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        biophysicsTests: {
          orderBy: { testDate: 'desc' },
          take: 1,
        },
        biochemistryTests: {
          orderBy: { testDate: 'desc' },
          take: 1,
        },
        orthomolecularTests: {
          orderBy: { testDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!patient) {
      return { success: false, error: 'Patient not found.' };
    }

    // 2. Structure the data for the AI model
    // We remove fields that are not relevant for the clinical summary
    const patientDataForAI = {
      demographics: {
        firstName: patient.firstName,
        lastName: patient.lastName,
        chronologicalAge: patient.chronologicalAge,
        gender: patient.gender,
        bloodType: patient.bloodType,
      },
      physicianObservations: patient.observations,
      latestBiophysicsTest: patient.biophysicsTests[0] ? {
        biologicalAge: patient.biophysicsTests[0].biologicalAge,
        fatPercentage: patient.biophysicsTests[0].fatPercentage,
        bmi: patient.biophysicsTests[0].bmi,
        systolicPressure: patient.biophysicsTests[0].systolicPressure,
        diastolicPressure: patient.biophysicsTests[0].diastolicPressure,
        testDate: patient.biophysicsTests[0].testDate.toISOString().split('T')[0],
      } : null,
      latestBiochemistryTest: patient.biochemistryTests[0] ? {
        biochemicalAge: patient.biochemistryTests[0].biochemicalAge,
        somatomedin: patient.biochemistryTests[0].somatomedin,
        hba1c: patient.biochemistryTests[0].hba1c,
        insulin: patient.biochemistryTests[0].insulin,
        dhea: patient.biochemistryTests[0].dhea,
        homocysteine: patient.biochemistryTests[0].homocysteine,
        testDate: patient.biochemistryTests[0].testDate.toISOString().split('T')[0],
      } : null,
      latestOrthomolecularTest: patient.orthomolecularTests[0] ? {
        orthomolecularAge: patient.orthomolecularTests[0].orthomolecularAge,
        mercury: patient.orthomolecularTests[0].mercurio,
        lead: patient.orthomolecularTests[0].plomo,
        aluminum: patient.orthomolecularTests[0].aluminio,
        zinc: patient.orthomolecularTests[0].zinc,
        magnesium: patient.orthomolecularTests[0].magnesio,
        testDate: patient.orthomolecularTests[0].testDate.toISOString().split('T')[0],
      } : null,
    };

    // 3. Construct the prompt for the Gemini API
    const prompt = `
      Eres un asistente médico experto en medicina funcional y antienvejecimiento. 
      A partir de los siguientes datos de un paciente en formato JSON, genera un resumen clínico conciso y profesional en español, de no más de 200 palabras.
      El resumen debe ser fácil de leer, estar estructurado en párrafos cortos y resaltar los hallazgos más relevantes, marcadores fuera de rango o patrones significativos.
      Finaliza con una breve conclusión o recomendación general si los datos lo sugieren. No inventes información que no esté en los datos.

      Datos del Paciente:
      ${JSON.stringify(patientDataForAI, null, 2)}
    `;

    // 4. Call the Gemini API
    const model = getGenerativeModel();
    const result = await model.generateContent(prompt);
    const response = result.response;
    const summary = response.text();

    revalidatePath('/agente-ia');

    return { success: true, summary };
  } catch (error) {
    console.error('Error generating clinical summary:', error);
    return { success: false, error: 'Failed to generate summary. Please check the server logs.' };
  }
}
