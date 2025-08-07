'use server';

import { prisma } from '@/lib/db';
import { calculateBioquimicaResults } from '@/utils/bioquimica-calculations';
import { BiochemistryFormValues } from '@/types/biochemistry';
import { revalidatePath } from 'next/cache';

/**
 * Obtiene los baremos y rangos para el test bioquímico.
 */
export async function getBiochemistryBoardsAndRanges() {
  try {
    const boards = await prisma.board.findMany({
      where: {
        type: 'FORM_BIOCHEMISTRY',
      },
      include: {
        range: true,
      },
    });
    return boards;
  } catch (error) {
    console.error('Error fetching biochemistry boards:', error);
    throw new Error('No se pudieron cargar los baremos bioquímicos.');
  }
}

interface SaveTestParams {
  patientId: string;
  chronologicalAge: number;
  formValues: BiochemistryFormValues;
}

/**
 * Calcula y guarda un nuevo test bioquímico para un paciente.
 */
export async function calculateAndSaveBiochemistryTest(params: SaveTestParams) {
  const { patientId, chronologicalAge, formValues } = params;

  try {
    // 1. Validar que todos los campos estén completos
    for (const key in formValues) {
      if (formValues[key as keyof BiochemistryFormValues] === undefined) {
        return { success: false, error: `El campo ${key} es obligatorio.` };
      }
    }

    // 2. Obtener los baremos de la base de datos
    const allBoards = await getBiochemistryBoardsAndRanges();

    // 3. Calcular los resultados
    const results = calculateBioquimicaResults(formValues, allBoards, chronologicalAge);

    // 4. Preparar los datos para guardar en la base de datos
    const dbData = {
      patientId,
      chronologicalAge,
      biologicalAge: results.biologicalAge,
      differentialAge: results.differentialAge,
      ...formValues,
      ...results.partialAges,
    };

    // 5. Crear el nuevo registro del test
    await prisma.biochemistryTest.create({
      data: dbData,
    });
    
    // 6. Revalidar la caché para que la UI se actualice
    revalidatePath(`/historias/${patientId}`);

    // 7. Devolver los resultados completos para la UI
    return { success: true, data: results };

  } catch (error: any) {
    console.error('Error saving biochemistry test:', error);
    return { success: false, error: error.message || 'Error desconocido al guardar el test.' };
  }
}

/**
 * Elimina un test bioquímico por su ID.
 */
export async function deleteBiochemistryTest(testId: string) {
  try {
    const test = await prisma.biochemistryTest.findUnique({ where: { id: testId } });
    if (!test) {
      return { success: false, error: 'Test no encontrado.' };
    }

    await prisma.biochemistryTest.delete({
      where: { id: testId },
    });

    revalidatePath(`/historias/${test.patientId}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting biochemistry test:', error);
    return { success: false, error: 'No se pudo eliminar el test.' };
  }
}
