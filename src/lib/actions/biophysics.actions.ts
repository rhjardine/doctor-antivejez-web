//Comentario de Prueba
'use server';

import { prisma } from '@/lib/db';
import { BoardWithRanges } from '@/types/biophysics';
import { revalidatePath } from 'next/cache';

export async function getBiophysicsBoardsAndRanges(): Promise<BoardWithRanges[]> {
  try {
    const boards = await prisma.board.findMany({
      where: {
        type: 'FORM_BIOPHYSICS',
      },
      include: {
        range: true,
      },
    });

    return boards.map(board => ({
      id: board.id,
      rangeId: board.rangeId,
      type: board.type,
      name: board.name,
      minValue: board.minValue,
      maxValue: board.maxValue,
      inverse: board.inverse,
      range: {
        id: board.range.id,
        minAge: board.range.minAge,
        maxAge: board.range.maxAge,
      },
    }));
  } catch (error) {
    console.error('Error obteniendo boards:', error);
    return [];
  }
}

export async function saveBiophysicsTest(data: {
  patientId: string;
  chronologicalAge: number;
  biologicalAge: number;
  differentialAge: number;
  gender: string;
  isAthlete: boolean;
  fatPercentage?: number;
  fatAge?: number;
  bmi?: number;
  bmiAge?: number;
  digitalReflexes?: number;
  reflexesAge?: number;
  visualAccommodation?: number;
  visualAge?: number;
  staticBalance?: number;
  balanceAge?: number;
  skinHydration?: number;
  hydrationAge?: number;
  systolicPressure?: number;
  systolicAge?: number;
  diastolicPressure?: number;
  diastolicAge?: number;
}) {
  try {
    const test = await prisma.biophysicsTest.create({
      data: {
        ...data,
        testDate: new Date(),
      },
    });

    revalidatePath(`/historias/${data.patientId}`);

    return { success: true, test };
  } catch (error) {
    console.error('Error guardando test biofísico:', error);
    return { success: false, error: 'Error al guardar el test' };
  }
}

export async function getLatestBiophysicsTest(patientId: string) {
  try {
    const test = await prisma.biophysicsTest.findFirst({
      where: { patientId },
      orderBy: { testDate: 'desc' },
    });

    return { success: true, test };
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

    return { success: true, tests };
  } catch (error) {
    console.error('Error obteniendo historial de tests:', error);
    return { success: false, error: 'Error al obtener el historial', tests: [] };
  }
}

// Función para obtener estadísticas del dashboard
export async function getDashboardStats() {
  try {
    const totalPatients = await prisma.patient.count();

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const newPatientsLastMonth = await prisma.patient.count({
      where: {
        createdAt: {
          gte: lastMonth,
        },
      },
    });

    // Obtener todos los tests más recientes de cada paciente
    const latestTests = await prisma.biophysicsTest.findMany({
      distinct: ['patientId'],
      orderBy: { testDate: 'desc' },
      select: {
        biologicalAge: true,
        patient: {
          select: {
            chronologicalAge: true,
          },
        },
      },
    });

    // Calcular edad biológica promedio
    const avgBiologicalAge = latestTests.length > 0
      ? latestTests.reduce((sum, test) => sum + test.biologicalAge, 0) / latestTests.length
      : 0;

    // Calcular cuántos pacientes están rejuvenecidos
    const rejuvenatedCount = latestTests.filter(test => 
      test.biologicalAge < test.patient.chronologicalAge - 2
    ).length;

    return {
      success: true,
      stats: {
        totalPatients,
        newPatientsLastMonth,
        avgBiologicalAge: Math.round(avgBiologicalAge),
        rejuvenatedCount,
      },
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return {
      success: false,
      error: 'Error al obtener estadísticas',
      stats: {
        totalPatients: 0,
        newPatientsLastMonth: 0,
        avgBiologicalAge: 0,
        rejuvenatedCount: 0,
      },
    };
  }
}
