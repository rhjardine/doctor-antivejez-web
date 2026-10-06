'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { NlrRiskLevel } from '@prisma/client';
// El cobro vive en `@/lib/credits`: aislamiento Serializable, débito al
// profesional que actúa y reintento real ante un choque entre transacciones.
import { cobrarCredito, enTransaccionDeCredito } from '@/lib/credits/consume';

// Función para determinar el nivel de riesgo basado en el valor de NLR
function determineNlrRiskLevel(nlr: number): NlrRiskLevel {
  if (nlr < 0.7) return 'OPTIMAL';
  if (nlr <= 2) return 'LOW_INFLAMMATION';
  if (nlr <= 3) return 'BORDERLINE';
  if (nlr <= 7) return 'MODERATE_INFLAMMATION';
  if (nlr <= 11) return 'HIGH_INFLAMMATION';
  if (nlr <= 17) return 'SEVERE_INFLAMMATION';
  if (nlr <= 23) return 'CRITICAL_INFLAMMATION';
  return 'EXTREME_RISK';
}

interface SaveNlrTestParams {
  patientId: string;
  neutrophils: number;
  lymphocytes: number;
  testDate: Date;
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validatePatientAccess } from '@/lib/auth-guards';

export async function saveNlrTest(params: SaveNlrTestParams) {
  const { patientId, neutrophils, lymphocytes, testDate } = params;

  if (lymphocytes === 0) {
    return { success: false, error: 'El valor de linfocitos no puede ser cero.' };
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return { success: false, error: "No autorizado. Debes iniciar sesión." };
    }
    await validatePatientAccess(patientId);

    const nlrValue = parseFloat((neutrophils / lymphocytes).toFixed(2));
    const riskLevel = determineNlrRiskLevel(nlrValue);

    // QUOTA GUARD CHECK
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true }
    });

    if (!patient || !patient.user) {
      return { success: false, error: "Error de integridad: Paciente o Médico no encontrados." };
    }

    // Cobro y creación en la MISMA transacción.
    //
    // Antes el crédito se consumía en una transacción aparte, antes de crear el
    // test. Si el `create` fallaba después, el crédito quedaba gastado sin que
    // existiera el test: el profesional pagaba por nada y no había forma de
    // notarlo. Los otros cuatro tipos de test ya lo hacían junto; éste no.
    //
    // Y cobra a quien ACTÚA, no al dueño del paciente.
    const actor = { id: session.user.id, role: session.user.role };

    const newTest = await enTransaccionDeCredito(async (tx) => {
      // NLR es un marcador biofísico y consume del mismo cupo.
      await cobrarCredito(tx, actor, 'BIOFISICA', 'Test NLR consumido');

      return await tx.nlrTest.create({
        data: {
          patientId,
          neutrophils,
          lymphocytes,
          nlrValue,
          riskLevel,
          testDate,
          recordedBy: session.user.id, // Audit Trail
        },
      });
    });

    revalidatePath(`/historias/${patientId}`);

    return { success: true, data: newTest };
  } catch (error) {
    console.error('Error guardando el test de NLR:', error);
    return { success: false, error: 'Ocurrió un error al guardar el resultado.' };
  }
}

export async function getNlrHistory(patientId: string) {
  try {
    await validatePatientAccess(patientId);
    const history = await prisma.nlrTest.findMany({
      where: { patientId },
      orderBy: { testDate: 'desc' },
    });
    return { success: true, data: history };
  } catch (error: any) {
    console.error('Error obteniendo el historial de NLR:', error);
    return { success: false, error: error.message || 'No se pudo cargar el historial.' };
  }
}