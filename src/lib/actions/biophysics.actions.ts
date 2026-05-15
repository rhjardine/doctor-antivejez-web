'use server';

import { prisma } from '@/lib/db';
import { BoardWithRanges, FormValues, CalculationResult, PartialAges } from '@/types/biophysics';
// CORRECCIÓN: Se importa la función correcta y completa que has desarrollado.
import { calculateBiofisicaResults } from '@/utils/biofisica-calculations';
import { revalidatePath } from 'next/cache';
import { Gender } from '@prisma/client';
// consumeTestCredit NO se importa aquí — la transacción atómica se hace internamente

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
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ... (existing imports)

export async function calculateAndSaveBiophysicsTest(params: CalculateAndSaveParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return { success: false, error: "No autorizado. Debes iniciar sesión." };
    }

    const { patientId, chronologicalAge, gender, isAthlete, formValues } = params;

    // 1. Calcular resultados ANTES de la transacción (CPU-only, sin IO)
    const calculationResult = calculateBiofisicaResults(
      [],
      formValues,
      chronologicalAge,
      gender,
      isAthlete
    );

    // 2. Verificar integridad del paciente/médico
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: { select: { id: true, role: true } } }
    });

    if (!patient || !patient.user) {
      return { success: false, error: "Error de integridad: Paciente o Médico no encontrados." };
    }

    const doctorId = patient.user.id;
    const isNonAdmin = patient.user.role !== 'ADMIN';

    // ================================================================
    // 3. TRANSACCIÓN ATÓMICA: Verificar crédito + Crear test en un solo bloque.
    //    Si el INSERT del test falla, el débito de crédito hace ROLLBACK automático.
    // ================================================================
    const newTest = await prisma.$transaction(async (tx) => {
      // 3a. Verificar y consumir crédito (solo para no-admin)
      if (isNonAdmin) {
        const aggregation = await tx.creditTransaction.aggregate({
          where: { userId: doctorId, testType: 'BIOFISICA' },
          _sum: { amount: true },
        });
        const currentBalance = aggregation._sum.amount ?? 0;

        if (currentBalance <= 0) {
          throw new Error(`Créditos insuficientes para Biofísica. Saldo: ${currentBalance}. Contacte al administrador.`);
        }

        await tx.creditTransaction.create({
          data: {
            userId: doctorId,
            testType: 'BIOFISICA',
            amount: -1,
            description: `Test Biofísico consumido — Paciente ${patientId}`,
          },
        });
      }

      // 3b. Crear el test (dentro del mismo bloque atómico)
      return await tx.biophysicsTest.create({
        data: {
          patientId,
          chronologicalAge,
          gender,
          isAthlete,
          testDate: new Date(),
          recordedBy: session.user.id,
          doctorId: session.user.id,
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
    });

    // 4. Revalidar rutas DESPUÉS de confirmar la transacción
    revalidatePath('/dashboard');
    revalidatePath(`/historias/${patientId}`);

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
  } catch (error) {
    console.error('Error obteniendo historial de tests:', error);
    return { success: false, error: 'Error al obtener el historial', tests: [] };
  }
}
