'use server';

// src/lib/actions/biochemistry.actions.ts
import { prisma } from '@/lib/db';
import { calculateBioquimicaResults } from '@/utils/bioquimica-calculations';
import { BiochemistryFormValues, BiochemistryCalculationResult } from '@/types/biochemistry';
import { revalidatePath } from 'next/cache';

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
    // ===== CAMBIO: Se ajusta la validación para requerir al menos un campo =====
    const filledFields = Object.values(formValues).filter(
      value => typeof value === 'number' && !isNaN(value)
    );
    
    if (filledFields.length === 0) {
      return { success: false, error: 'Debe completar al menos un biomarcador para guardar el test.' };
    }
    // ========================================================================

    // 2. Calcular los resultados usando la lógica centralizada
    const results = calculateBioquimicaResults(formValues, chronologicalAge);

    // 3. Preparar los datos para guardar en la base de datos
    const dbData = {
      patientId,
      chronologicalAge,
      biochemicalAge: results.biologicalAge,
      differentialAge: results.differentialAge,
      ...formValues,
      ...results.partialAges,
    };

    // 4. Crear el nuevo registro del test
    await prisma.biochemistryTest.create({
      data: dbData,
    });
    
    // 5. Revalidar la caché para que la UI se actualice
    revalidatePath(`/historias/${patientId}`);

    // 6. Devolver los resultados completos para la UI
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