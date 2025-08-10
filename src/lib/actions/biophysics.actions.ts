'use server';

import { prisma } from '@/lib/db';
import { BoardWithRanges, FormValues, CalculationResult, PartialAges } from '@/types/biophysics';
// CORRECCIÓN: Se importa la función correcta y completa que has desarrollado.
import { calculateBiofisicaResults } from '@/utils/biofisica-calculations'; 
import { revalidatePath } from 'next/cache';
import { Gender } from '@prisma/client';

// --- ENFOQUE UNIFICADO: CALCULAR Y GUARDAR EN UN SOLO PASO ---
interface CalculateAndSaveParams {
  patientId: string;
  chronologicalAge: number;
  gender: Gender;
  isAthlete: boolean;
  formValues: FormValues;
}

/**
 * Orquesta el proceso completo de cálculo y guardado en una sola llamada.
 * @returns Un objeto con los resultados calculados y serializados para la UI.
 */
export async function calculateAndSaveBiophysicsTest(params: CalculateAndSaveParams) {
  try {
    const { patientId, chronologicalAge, gender, isAthlete, formValues } = params;

    // ===== INICIO DE LA CORRECCIÓN CLAVE =====
    // Se llama a la función `calculateBiofisicaResults` (con 'a' al final), que es la
    // versión completa que acepta todos los parámetros necesarios para tu nueva lógica.
    const calculationResult = calculateBiofisicaResults(
      [], // El argumento 'boards' ya no es necesario con la nueva lógica de cálculo.
      formValues,
      chronologicalAge,
      gender,
      isAthlete
    );
    // ===== FIN DE LA CORRECCIÓN CLAVE =====

    // 3. Guardar el nuevo test en la base de datos
    const newTest = await prisma.biophysicsTest.create({
      data: {
        patientId,
        chronologicalAge,
        gender,
        isAthlete,
        testDate: new Date(),
        biologicalAge: calculationResult.biologicalAge,
        differentialAge: calculationResult.differentialAge,
        fatPercentage: formValues.fatPercentage,
        bmi: formValues.bmi,
        digitalReflexes: formValues.digitalReflexes
          ? ((formValues.digitalReflexes.high || 0) +
              (formValues.digitalReflexes.long || 0) +
              (formValues.digitalReflexes.width || 0)) / 3
          : undefined,
        visualAccommodation: formValues.visualAccommodation,
        staticBalance: formValues.staticBalance
          ? ((formValues.staticBalance.high || 0) +
              (formValues.staticBalance.long || 0) +
              (formValues.staticBalance.width || 0)) / 3
          : undefined,
        skinHydration: formValues.skinHydration,
        systolicPressure: formValues.systolicPressure,
        diastolicPressure: formValues.diastolicPressure,
        fatAge: calculationResult.partialAges.fatAge,
        bmiAge: calculationResult.partialAges.bmiAge,
        reflexesAge: calculationResult.partialAges.reflexesAge,
        visualAge: calculationResult.partialAges.visualAge,
        balanceAge: calculationResult.partialAges.balanceAge,
        hydrationAge: calculationResult.partialAges.hydrationAge,
        systolicAge: calculationResult.partialAges.systolicAge,
        diastolicAge: calculationResult.partialAges.diastolicAge,
      },
    });

    // 4. Revalidar rutas
    revalidatePath('/dashboard');
    revalidatePath(`/historias/${patientId}`); 

    // 5. Devolver los datos serializados para que el cliente los muestre
    const serializableData = {
      ...newTest,
      testDate: newTest.testDate.toISOString(),
      partialAges: calculationResult.partialAges,
    };

    return { success: true, data: serializableData };
    
  } catch (error) {
    console.error('Error en calculateAndSaveBiophysicsTest:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
    return { success: false, error: errorMessage };
  }
}


// --- FUNCIONES EXISTENTES (SE MANTIENEN SIN CAMBIOS) ---

export async function getBiophysicsBoardsAndRanges(): Promise<BoardWithRanges[]> {
  try {
    const boards = await prisma.board.findMany({
      where: { type: 'FORM_BIOPHYSICS' },
      include: { range: true },
    });
    return boards.map(board => ({ ...board }));
  } catch (error) {
    console.error('Error obteniendo boards:', error);
    return [];
  }
}

export async function deleteBiophysicsTest(testId: string, patientId: string) {
  try {
    await prisma.biophysicsTest.delete({
      where: { id: testId },
    });
    revalidatePath(`/historias/${patientId}`);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error eliminando test biofísico:', error);
    return { success: false, error: 'Error al eliminar el test' };
  }
}

export async function getLatestBiophysicsTest(patientId: string) {
  try {
    const test = await prisma.biophysicsTest.findFirst({
      where: { patientId },
      orderBy: { testDate: 'desc' },
    });
    if (test) {
      const serializableTest = { ...test, testDate: test.testDate.toISOString() };
      return { success: true, test: serializableTest };
    }
    return { success: true, test: null };
  } catch (error) {
    console.error('Error obteniendo último test:', error);
    return { success: false, error: 'Error al obtener el test' };
  }
}

export async function getBiophysicsTestHistory(patientId: string) {
  try {
    const tests = await prisma.biophysicsTest.findMany({
      where: { patientId },
      orderBy: { testDate: 'desc' },
    });
    const serializableTests = tests.map(test => ({
      ...test,
      testDate: test.testDate.toISOString(),
    }));
    return { success: true, tests: serializableTests };
  } catch (error)
  {
    console.error('Error obteniendo historial de tests:', error);
    return { success: false, error: 'Error al obtener el historial', tests: [] };
  }
}
