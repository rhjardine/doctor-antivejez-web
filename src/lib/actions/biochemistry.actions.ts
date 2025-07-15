// src/lib/actions/biochemistry.actions.ts
'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { BiochemistryFormValues } from '@/types/biochemistry';

// Tipo combinado para los datos que se guardarán en la base de datos.
type BiochemistryTestData = BiochemistryFormValues & {
  patientId: string;
  chronologicalAge: number;
  biochemicalAge: number;
  differentialAge: number;
};

/**
 * Guarda un nuevo registro de test bioquímico en la base de datos.
 * @param data - Los datos completos del test, incluyendo el ID del paciente y los resultados.
 * @returns Un objeto indicando si la operación fue exitosa y el registro creado.
 */
export async function saveBiochemistryTest(data: Partial<BiochemistryTestData>) {
  try {
    const { patientId, ...testData } = data;
    if (!patientId) {
      throw new Error('El ID del paciente es requerido para guardar el test.');
    }

    // Crea el nuevo registro en la tabla 'BiochemistryTest'
    const test = await prisma.biochemistryTest.create({
      data: {
        patientId: patientId,
        testDate: new Date(),
        chronologicalAge: data.chronologicalAge!,
        biochemicalAge: data.biochemicalAge!,
        differentialAge: data.differentialAge!,
        // Mapea los valores del formulario a los campos del modelo de Prisma
        somatomedin: data.somatomedin,
        hba1c: data.hba1c,
        insulin: data.insulin,
        postPrandial: data.postPrandial,
        tgHdlRatio: data.tgHdlRatio,
        dhea: data.dhea,
        homocysteine: data.homocysteine,
        psa: data.psa,
        fsh: data.fsh,
        // Guarda el promedio de la densitometría
        boneDensitometry: data.boneDensitometry,
      },
    });

    // Revalida la ruta de la historia del paciente para que los datos se actualicen sin recargar la página.
    revalidatePath(`/historias/${patientId}`);
    
    return { success: true, test };
  } catch (error) {
    console.error('Error guardando test bioquímico:', error);
    return { success: false, error: 'Error al guardar el test bioquímico' };
  }
}
