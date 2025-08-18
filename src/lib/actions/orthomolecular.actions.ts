'use server';

// src/lib/actions/orthomolecular.actions.ts
import { prisma } from '@/lib/db';
import { calculateOrthomolecularResults } from '@/utils/orthomolecular-calculations';
import { OrthomolecularFormValues } from '@/types/orthomolecular';
import { revalidatePath } from 'next/cache';

interface SaveTestParams {
  patientId: string;
  chronologicalAge: number;
  formValues: OrthomolecularFormValues;
}

/**
 * Calcula y guarda un nuevo test ortomolecular para un paciente.
 */
export async function calculateAndSaveOrthomolecularTest(params: SaveTestParams) {
  const { patientId, chronologicalAge, formValues } = params;

  try {
    const filledFields = Object.values(formValues).filter(
      value => typeof value === 'number' && !isNaN(value)
    );
    
    if (filledFields.length === 0) {
      return { success: false, error: 'Debe completar al menos un parámetro para guardar el test.' };
    }

    const results = calculateOrthomolecularResults(formValues, chronologicalAge);

    const dbData = {
      patientId,
      chronologicalAge,
      orthomolecularAge: results.biologicalAge,
      differentialAge: results.differentialAge,
      ...formValues,
      ...results.partialAges,
    };

    await prisma.orthomolecularTest.create({
      data: dbData,
    });
    
    revalidatePath(`/historias/${patientId}`);

    return { success: true, data: results };

  } catch (error: any) {
    console.error('Error saving orthomolecular test:', error);
    return { success: false, error: error.message || 'Error desconocido al guardar el test.' };
  }
}

/**
 * Elimina un test ortomolecular por su ID.
 */
export async function deleteOrthomolecularTest(testId: string) {
  try {
    const test = await prisma.orthomolecularTest.findUnique({ where: { id: testId } });
    if (!test) {
      return { success: false, error: 'Test no encontrado.' };
    }

    await prisma.orthomolecularTest.delete({
      where: { id: testId },
    });

    revalidatePath(`/historias/${test.patientId}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting orthomolecular test:', error);
    return { success: false, error: 'No se pudo eliminar el test.' };
  }
}