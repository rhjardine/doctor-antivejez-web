// src/lib/actions/biophysics.actions.ts
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
    revalidatePath('/dashboard'); // Revalidar dashboard al guardar un test

    return { success: true, test };
  } catch (error) {
    console.error('Error guardando test biofísico:', error);
    return { success: false, error: 'Error al guardar el test' };
  }
}

// --- NUEVA FUNCIÓN PARA ELIMINAR UN TEST ---
export async function deleteBiophysicsTest(testId: string, patientId: string) {
  try {
    await prisma.biophysicsTest.delete({
      where: { id: testId },
    });

    // Revalida las rutas afectadas para que Next.js actualice la cache
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
