// src/lib/actions/biophysics.actions.ts
'use server';

import { prisma } from '@/lib/db';
import { BoardWithRanges } from '@/types/biophysics';
import { revalidatePath } from 'next/cache';

// ... (otras funciones sin cambios)

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


// --- FUNCIÓN DEL DASHBOARD ACTUALIZADA ---
export async function getDashboardStats() {
  try {
    // 1. Estadísticas para las tarjetas
    const totalPatients = await prisma.patient.count();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const newPatientsLastMonth = await prisma.patient.count({
      where: { createdAt: { gte: oneMonthAgo } },
    });

    const latestTests = await prisma.biophysicsTest.groupBy({
      by: ['patientId'],
      _max: { testDate: true },
    });
    const latestTestDates = latestTests.map(t => t._max.testDate!);
    const latestTestsData = await prisma.biophysicsTest.findMany({
      where: { testDate: { in: latestTestDates } },
    });

    const avgBiologicalAge = latestTestsData.length > 0
      ? latestTestsData.reduce((sum, test) => sum + test.biologicalAge, 0) / latestTestsData.length
      : 0;
    
    // 2. Datos para el gráfico de pastel (Estado de Pacientes)
    let rejuvenatedCount = 0;
    let normalCount = 0;
    let agedCount = 0;
    latestTestsData.forEach(test => {
      if (test.differentialAge < -2) rejuvenatedCount++;
      else if (test.differentialAge > 2) agedCount++;
      else normalCount++;
    });
    const patientStatusData = [
      { name: 'Rejuvenecidos', value: rejuvenatedCount },
      { name: 'Normal', value: normalCount },
      { name: 'Envejecidos', value: agedCount },
    ];

    // 3. Datos para el gráfico de líneas (Evolución de Pacientes)
    const monthlyPatientData = [];
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = d.getMonth();
      const year = d.getFullYear();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const count = await prisma.patient.count({
        where: {
          createdAt: {
            gte: firstDay,
            lte: lastDay,
          },
        },
      });
      monthlyPatientData.push({ month: monthNames[month], pacientes: count });
    }

    // 4. Datos para Actividad Reciente
    const recentPatients = await prisma.patient.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: { firstName: true, lastName: true, createdAt: true }
    });
    const recentTests = await prisma.biophysicsTest.findMany({
      take: 3,
      orderBy: { testDate: 'desc' },
      include: { patient: { select: { firstName: true, lastName: true } } }
    });

    const recentActivity = [
      ...recentPatients.map(p => ({ type: 'new_patient', text: `Nuevo paciente registrado: ${p.firstName} ${p.lastName}`, date: p.createdAt })),
      ...recentTests.map(t => ({ type: 'new_test', text: `Test biofísico completado: ${t.patient.firstName} ${t.patient.lastName}`, date: t.testDate }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

    return {
      success: true,
      stats: {
        totalPatients,
        newPatientsLastMonth,
        avgBiologicalAge: Math.round(avgBiologicalAge),
        rejuvenatedCount,
        patientStatusData,
        monthlyPatientData,
        recentActivity,
      },
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas del dashboard:', error);
    return { success: false, error: 'Error al obtener estadísticas' };
  }
}
