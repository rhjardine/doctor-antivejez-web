'use server';

// src/lib/actions/orthomolecular.actions.ts
import { prisma } from '@/lib/db';
import { calculateOrthomolecularResults } from '@/utils/orthomolecular-calculations';
import { OrthomolecularFormValues } from '@/types/orthomolecular';
import { revalidatePath } from 'next/cache';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
// consumeTestCredit NO se importa aquí — la transacción atómica se hace internamente

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
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return { success: false, error: "No autorizado. Debes iniciar sesión." };
    }

    const filledFields = Object.values(formValues).filter(
      value => typeof value === 'number' && !isNaN(value)
    );

    if (filledFields.length === 0) {
      return { success: false, error: 'Debe completar al menos un parámetro para guardar el test.' };
    }

    const results = calculateOrthomolecularResults(formValues, chronologicalAge);

    // QUOTA GUARD (Ledger)
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true }
    });

    if (!patient || !patient.user) {
      return { success: false, error: "Error de integridad: Paciente o Médico no encontrados." };
    }

    const doctorId = patient.user.id;
    const isNonAdmin = patient.user.role !== 'ADMIN';

    const dbData = {
      patientId,
      chronologicalAge,
      orthomolecularAge: results.biologicalAge,
      differentialAge: results.differentialAge,
      doctorId: session.user.id,
      ...formValues,
      ...results.partialAges,
    };

    await prisma.$transaction(async (tx) => {
      if (isNonAdmin) {
        const aggregation = await tx.creditTransaction.aggregate({
          where: { userId: doctorId, testType: 'ORTOMOLECULAR' },
          _sum: { amount: true },
        });
        const currentBalance = aggregation._sum.amount ?? 0;

        if (currentBalance <= 0) {
          throw new Error(`Créditos insuficientes para Ortomolecular. Saldo: ${currentBalance}. Contacte al administrador.`);
        }

        await tx.creditTransaction.create({
          data: {
            userId: doctorId,
            testType: 'ORTOMOLECULAR',
            amount: -1,
            description: `Test Ortomolecular consumido — Paciente ${patientId}`,
          },
        });
      }

      await tx.orthomolecularTest.create({ data: dbData });
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