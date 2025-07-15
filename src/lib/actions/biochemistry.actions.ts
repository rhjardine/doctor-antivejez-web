'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// CORRECCIÓN: Se define un tipo específico para los datos que se guardan en la DB,
// donde `boneDensitometry` es un número, no un objeto.
type BiochemistryDbData = {
  patientId: string;
  chronologicalAge: number;
  biochemicalAge: number;
  differentialAge: number;
  somatomedin?: number;
  hba1c?: number;
  insulin?: number;
  postPrandial?: number;
  tgHdlRatio?: number;
  dhea?: number;
  homocysteine?: number;
  psa?: number;
  fsh?: number;
  boneDensitometry?: number;
};

/**
 * Guarda un nuevo registro de test bioquímico en la base de datos.
 * @param data - Los datos completos del test, con el formato correcto para la DB.
 * @returns Un objeto indicando si la operación fue exitosa y el registro creado.
 */
export async function saveBiochemistryTest(data: Partial<BiochemistryDbData>) {
  try {
    const { patientId, ...testData } = data;
    if (!patientId) {
      throw new Error('El ID del paciente es requerido para guardar el test.');
    }

    const test = await prisma.biochemistryTest.create({
      data: {
        patientId: patientId,
        testDate: new Date(),
        chronologicalAge: data.chronologicalAge!,
        biochemicalAge: data.biochemicalAge!,
        differentialAge: data.differentialAge!,
        somatomedin: data.somatomedin,
        hba1c: data.hba1c,
        insulin: data.insulin,
        postPrandial: data.postPrandial,
        tgHdlRatio: data.tgHdlRatio,
        dhea: data.dhea,
        homocysteine: data.homocysteine,
        psa: data.psa,
        fsh: data.fsh,
        boneDensitometry: data.boneDensitometry,
      },
    });

    revalidatePath(`/historias/${patientId}`);
    
    return { success: true, test };
  } catch (error) {
    console.error('Error guardando test bioquímico:', error);
    return { success: false, error: 'Error al guardar el test bioquímico' };
  }
}
