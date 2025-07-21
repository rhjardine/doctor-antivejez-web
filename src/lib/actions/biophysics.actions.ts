'use server';

import { prisma } from '@/lib/db';
import { BoardWithRanges, FormValues, CalculationResult } from '@/types/biophysics';
import { calculateBiofisicaResults } from '@/utils/biofisica-calculations'; 
import { revalidatePath } from 'next/cache';

// --- ACCIÓN CENTRALIZADA PARA CALCULAR Y GUARDAR ---
interface CalculateAndSaveParams {
  patientId: string;
  chronologicalAge: number;
  gender: string;
  isAthlete: boolean;
  formValues: FormValues;
}

/**
 * Orquesta todo el proceso de cálculo y guardado en el servidor.
 * 1. Obtiene los baremos de la base de datos.
 * 2. Ejecuta la lógica de cálculo que ya tenías.
 * 3. Guarda el test completo en la base de datos.
 * @returns Un objeto con el resultado del test o un mensaje de error.
 */
export async function calculateAndSaveBiophysicsTest(params: CalculateAndSaveParams) {
  try {
    const { patientId, chronologicalAge, gender, isAthlete, formValues } = params;

    // 1. Obtener baremos (se ejecuta de forma segura en el servidor)
    const boards = await getBiophysicsBoardsAndRanges();
    if (!boards || boards.length === 0) {
      throw new Error('No se pudieron cargar los baremos para el cálculo.');
    }

    // 2. Realizar el cálculo usando tu lógica existente con el nombre de función correcto.
    const calculationResult: CalculationResult = calculateBiofisicaResults(
      boards,
      formValues,
      chronologicalAge,
      gender,
      isAthlete
    );

    // 3. Guardar el nuevo test en la base de datos
    const newTest = await prisma.biophysicsTest.create({
      data: {
        patientId,
        chronologicalAge,
        gender,
        isAthlete,
        testDate: new Date(),
        // Resultados principales
        biologicalAge: calculationResult.biologicalAge,
        differentialAge: calculationResult.differentialAge,
        // Valores del formulario
        fatPercentage: formValues.fatPercentage,
        bmi: formValues.bmi,
        // Guardar el promedio de las dimensiones, como en la lógica original.
        digitalReflexes: formValues.digitalReflexes
          ? ((formValues.digitalReflexes.high || 0) +
              // CORRECCIÓN: Se corrige el error de tipeo de 'digitalRefles' a 'digitalReflexes'.
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
        // Edades parciales
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

    // CORRECCIÓN FINAL: Revalidamos rutas generales para actualizar historiales en otras
    // pantallas, pero EVITAMOS revalidar la ruta actual (`/historias/${patientId}`)
    // para prevenir que el estado del formulario en el cliente se reinicie.
    revalidatePath('/dashboard');
    revalidatePath('/historias');

    // Se mantiene la serialización de la fecha para evitar errores de transferencia de datos.
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


// --- TUS FUNCIONES EXISTENTES (SE MANTIENEN SIN CAMBIOS) ---

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
    // Se serializa la fecha por seguridad, aunque esta función podría no pasarla al cliente.
    if (test) {
      return { success: true, test: { ...test, testDate: test.testDate.toISOString() } };
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
    // Se serializan las fechas de todo el historial para el cliente.
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
