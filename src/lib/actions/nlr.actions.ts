'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { NlrRiskLevel } from '@prisma/client';

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

    const doctor = patient.user;
    const isNonAdmin = doctor.role !== 'ADMIN';

    if (isNonAdmin && doctor.quotaUsed >= doctor.quotaMax) {
      return { success: false, error: "Quota Exhausted: Límite de formularios alcanzado." };
    }

    const [updatedUser, newTest] = await prisma.$transaction([
      prisma.user.update({
        where: { id: doctor.id },
        data: { quotaUsed: isNonAdmin ? { increment: 1 } : undefined }
      }),
      prisma.nlrTest.create({
        data: {
          patientId,
          neutrophils,
          lymphocytes,
          nlrValue,
          riskLevel,
          testDate,
          recordedBy: session.user.id, // Audit Trail
        },
      })
    ]);

    revalidatePath(`/historias/${patientId}`);

    return { success: true, data: newTest };
  } catch (error) {
    console.error('Error guardando el test de NLR:', error);
    return { success: false, error: 'Ocurrió un error al guardar el resultado.' };
  }
}

export async function getNlrHistory(patientId: string) {
  try {
    const history = await prisma.nlrTest.findMany({
      where: { patientId },
      orderBy: { testDate: 'desc' },
    });
    return { success: true, data: history };
  } catch (error) {
    console.error('Error obteniendo el historial de NLR:', error);
    return { success: false, error: 'No se pudo cargar el historial.' };
  }
}