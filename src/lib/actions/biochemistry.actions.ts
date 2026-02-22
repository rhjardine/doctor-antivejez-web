'use server';

// src/lib/actions/biochemistry.actions.ts
import { prisma } from '@/lib/db';
import { calculateBioquimicaResults } from '@/utils/bioquimica-calculations';
import { BiochemistryFormValues, BiochemistryCalculationResult, BIOCHEMISTRY_ITEMS } from '@/types/biochemistry';
import { revalidatePath } from 'next/cache';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { consumeTestCredit } from './professionals.actions';

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

    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return { success: false, error: "No autorizado. Debes iniciar sesión." };
    }

    // 2. Calcular los resultados usando la lógica centralizada
    const results = calculateBioquimicaResults(formValues, chronologicalAge);

    // 3. Preparar los datos para guardar en la base de datos
    const mappedFormValues = BIOCHEMISTRY_ITEMS.reduce((acc, item) => {
      // @ts-ignore - Dynamic key access
      acc[item.key] = formValues[item.key];
      return acc;
    }, {} as Record<string, number | undefined>);

    const mappedPartialAges = BIOCHEMISTRY_ITEMS.reduce((acc, item) => {
      const ageKey = `${item.key}Age` as keyof BiochemistryCalculationResult['partialAges'];
      // @ts-ignore - Dynamic key access
      acc[ageKey] = results.partialAges[ageKey];
      return acc;
    }, {} as Record<string, number | undefined>);

    const dbData = {
      patientId,
      chronologicalAge,
      biochemicalAge: results.biologicalAge,
      differentialAge: results.differentialAge,
      doctorId: session.user.id,
      ...mappedFormValues,
      ...mappedPartialAges,
    };

    // 4. QUOTA GUARD CHECK (Ledger)
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true }
    });

    if (!patient || !patient.user) {
      throw new Error("Error de integridad: Paciente o Médico no encontrados.");
    }

    const doctor = patient.user;
    const isNonAdmin = doctor.role !== 'ADMIN';

    if (isNonAdmin) {
      const creditResult = await consumeTestCredit(doctor.id, 'BIOQUIMICA', 'Test Bioquímica consumido');
      if (!creditResult.success) {
        throw new Error(creditResult.error || 'Créditos insuficientes para Bioquímica.');
      }
    }

    // 5. Crear el nuevo registro del test
    const newTest = await prisma.biochemistryTest.create({
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
