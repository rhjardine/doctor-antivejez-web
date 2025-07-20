// src/lib/actions/dashboard.actions.ts
'use server';

import { prisma } from '@/lib/db';
import { subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';

export type TimeRange = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'all';

// --- Función para obtener el rango de fechas ---
function getDateRange(range: TimeRange) {
  const now = new Date();
  switch (range) {
    case 'daily':
      return { gte: startOfDay(now), lte: endOfDay(now) };
    case 'weekly':
      return { gte: startOfWeek(now, { weekStartsOn: 1 }), lte: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'monthly':
      return { gte: startOfMonth(now), lte: endOfMonth(now) };
    case 'quarterly':
        return { gte: startOfQuarter(now), lte: endOfQuarter(now) };
    case 'yearly':
        return { gte: startOfYear(now), lte: endOfYear(now) };
    case 'all':
    default:
      return { gte: undefined, lte: undefined };
  }
}

// --- Lógica principal para obtener estadísticas del Dashboard ---
export async function getDashboardStats(range: TimeRange = 'monthly') {
  try {
    const dateRange = getDateRange(range);
    const whereClause = dateRange.gte ? { createdAt: { gte: dateRange.gte, lte: dateRange.lte } } : {};

    // 1. Estadísticas para las tarjetas
    const totalPatients = await prisma.patient.count();
    const newPatientsInRange = await prisma.patient.count({ where: whereClause });

    const latestTests = await prisma.biophysicsTest.findMany({
        orderBy: { testDate: 'desc' },
        distinct: ['patientId'],
    });

    const avgBiologicalAge = latestTests.length > 0
      ? latestTests.reduce((sum, test) => sum + test.biologicalAge, 0) / latestTests.length
      : 0;

    const rejuvenatedCount = latestTests.filter(t => t.differentialAge < -2).length;

    // 2. Datos para el gráfico de pastel (Estado de Pacientes - Siempre muestra el estado general)
    let rejuvenatedTotal = 0;
    let normalTotal = 0;
    let agedTotal = 0;
    latestTests.forEach(test => {
      if (test.differentialAge < -2) rejuvenatedTotal++;
      else if (test.differentialAge > 2) agedTotal++;
      else normalTotal++;
    });
    const patientStatusData = [
      { name: 'Rejuvenecidos', value: rejuvenatedTotal },
      { name: 'Normal', value: normalTotal },
      { name: 'Envejecidos', value: agedTotal },
    ];

    // 3. Datos para el gráfico de líneas (Evolución de Pacientes en el último año)
    const monthlyPatientData = [];
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = d.getMonth();
      const year = d.getFullYear();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const count = await prisma.patient.count({
        where: { createdAt: { gte: firstDay, lte: lastDay } },
      });
      monthlyPatientData.push({ month: `${monthNames[month]} ${year.toString().slice(-2)}`, pacientes: count });
    }
    
    // 4. Actividad Reciente (últimos 7 días)
    const sevenDaysAgo = subDays(new Date(), 7);
    const recentPatients = await prisma.patient.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: { firstName: true, lastName: true, createdAt: true }
    });
    const recentTests = await prisma.biophysicsTest.findMany({
      where: { testDate: { gte: sevenDaysAgo } },
      take: 3,
      orderBy: { testDate: 'desc' },
      include: { patient: { select: { firstName: true, lastName: true } } }
    });

    const recentActivity = [
      ...recentPatients.map(p => ({ type: 'new_patient', text: `Nuevo paciente: ${p.firstName} ${p.lastName}`, date: p.createdAt })),
      ...recentTests.map(t => ({ type: 'new_test', text: `Test completado: ${t.patient.firstName} ${t.patient.lastName}`, date: t.testDate }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

    // 5. **Funcionalidad Innovadora: Puntuación de Compromiso del Paciente**
    // Calcula un score basado en la frecuencia de tests y citas completadas.
    const activePatients = await prisma.patient.findMany({
        include: {
            biophysicsTests: { where: { testDate: { gte: subDays(new Date(), 90) } } }, // tests en últimos 3 meses
            appointments: { where: { status: 'COMPLETED', date: { gte: subDays(new Date(), 90) } } } // citas en últimos 3 meses
        }
    });

    const engagementScores = activePatients.map(p => {
        const testScore = Math.min(p.biophysicsTests.length * 20, 50); // Max 50 puntos por tests
        const appointmentScore = Math.min(p.appointments.length * 25, 50); // Max 50 puntos por citas
        return { name: `${p.firstName} ${p.lastName}`, score: testScore + appointmentScore };
    }).sort((a, b) => b.score - a.score).slice(0, 5); // Top 5 pacientes más comprometidos


    return {
      success: true,
      stats: {
        totalPatients,
        newPatients: newPatientsInRange,
        avgBiologicalAge: Math.round(avgBiologicalAge),
        rejuvenatedCount,
        patientStatusData,
        monthlyPatientData,
        recentActivity,
        engagementScores,
      },
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas del dashboard:', error);
    return { success: false, error: 'Error al obtener estadísticas' };
  }
}
//Cambios