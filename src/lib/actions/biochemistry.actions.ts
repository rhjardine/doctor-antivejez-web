// src/lib/actions/biochemistry.actions.ts
'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// ===== INICIO DE LA MODIFICACIÓN: Corregir el tipo de dato esperado =====
// Se define explícitamente el tipo para que coincida con lo que se guarda en la base de datos.
// `boneDensitometry` ahora es `number | undefined`, no un objeto.
type BiochemistryTestData = {
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
// ===== FIN DE LA MODIFICACIÓN =====

/**
 * Guarda un nuevo registro de test bioquímico en la base de datos.
 * @param data - Los datos completos del test, incluyendo el ID del paciente y los resultados.
 * @returns Un objeto indicando si la operación fue exitosa y el registro creado.
 */
export async function saveBiochemistryTest(data: BiochemistryTestData) {
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
        // El resto de los datos ya coinciden con el esquema
        ...testData,
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

/**
 * Elimina un test bioquímico de la base de datos.
 * @param testId - El ID del test a eliminar.
 * @param patientId - El ID del paciente para revalidar la ruta.
 * @returns Un objeto indicando si la operación fue exitosa.
 */
export async function deleteBiochemistryTest(testId: string, patientId: string) {
  try {
    await prisma.biochemistryTest.delete({
      where: { id: testId },
    });

    revalidatePath(`/historias/${patientId}`);
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    console.error('Error eliminando test bioquímico:', error);
    return { success: false, error: 'Error al eliminar el test' };
  }
}
