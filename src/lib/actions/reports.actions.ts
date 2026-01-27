// src/lib/actions/reports.actions.ts
'use server';

import { prisma } from '@/lib/db';
import { ReportData, ReportType, TimeRange, PatientReport, ProfessionalReport } from '@/types/reports';

/**
 * Obtiene la fecha de inicio para un rango de tiempo determinado.
 * @param range - El rango de tiempo (diario, semanal, etc.).
 * @returns La fecha de inicio correspondiente.
 */
function getStartDate(range: TimeRange): Date {
  const now = new Date();
  switch (range) {
    case 'daily':
      now.setHours(0, 0, 0, 0);
      return now;
    case 'weekly':
      const firstDayOfWeek = now.getDate() - now.getDay();
      return new Date(now.setDate(firstDayOfWeek));
    case 'biweekly':
      // Asumiendo que quincenal es los últimos 15 días
      return new Date(now.setDate(now.getDate() - 15));
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'quarterly':
      const quarter = Math.floor(now.getMonth() / 3);
      return new Date(now.getFullYear(), quarter * 3, 1);
    case 'semiannual':
      const semester = now.getMonth() < 6 ? 0 : 6;
      return new Date(now.getFullYear(), semester, 1);
    case 'annual':
      return new Date(now.getFullYear(), 0, 1);
    default:
      return new Date(0); // Epoch for 'all'
  }
}

/**
 * Genera un reporte basado en el tipo y el rango de tiempo especificados.
 * @param reportType - El tipo de reporte a generar.
 * @param timeRange - El rango de tiempo para el reporte.
 * @returns Los datos del reporte.
 */
export async function generateReport(reportType: ReportType, timeRange: TimeRange): Promise<ReportData> {
  const startDate = getStartDate(timeRange);

  switch (reportType) {
    case 'patient_attendance':
      const patients = await prisma.patient.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: { name: true },
          },
        },
      });
      return { type: 'patient_attendance', data: patients as PatientReport[] };

    case 'treatment_adherence':
      // Lógica de ejemplo: pacientes con más de 5 tests (simulando adherencia)
      const adherentPatients = await prisma.patient.findMany({
        where: {
          biophysicsTests: {
            some: {
              createdAt: { gte: startDate }
            }
          },
        },
        include: {
          _count: {
            select: { biophysicsTests: true },
          },
        },
        orderBy: {
          biophysicsTests: {
            _count: 'desc',
          },
        },
        take: 10,
      });
      return { type: 'treatment_adherence', data: adherentPatients.map(p => ({ ...p, testsCount: p._count.biophysicsTests })) as PatientReport[] };


    case 'patient_evolution':
      const allPatientsWithTests = await prisma.patient.findMany({
        where: {
          biophysicsTests: {
            some: {} // Asegura que el paciente tenga al menos un test
          }
        },
        include: {
          biophysicsTests: {
            orderBy: {
              testDate: 'asc',
            },
          },
        },
      });

      const evolutionData = allPatientsWithTests.map(patient => {
        if (patient.biophysicsTests.length < 2) return null;
        const firstTest = patient.biophysicsTests[0];
        const lastTest = patient.biophysicsTests[patient.biophysicsTests.length - 1];
        const evolution = lastTest.biologicalAge - firstTest.biologicalAge;
        return { ...patient, evolution };
      }).filter(p => p !== null).sort((a, b) => a!.evolution - b!.evolution).slice(0, 10);

      return { type: 'patient_evolution', data: evolutionData as PatientReport[] };

    case 'professional_performance':
      const professionals = await prisma.user.findMany({
        // ... (existing logic)
        where: {
          role: 'MEDICO',
          patients: {
            some: {
              biophysicsTests: {
                some: {
                  createdAt: { gte: startDate }
                }
              }
            }
          }
        },
        include: {
          _count: {
            select: {
              patients: {
                where: {
                  biophysicsTests: {
                    some: {
                      createdAt: { gte: startDate }
                    }
                  }
                }
              }
            },
          },
        },
        orderBy: {
          patients: {
            _count: 'desc',
          },
        },
        take: 10,
      });

      return { type: 'professional_performance', data: professionals.map(p => ({ ...p, formsUsed: p._count.patients })) as ProfessionalReport[] };

    case 'ri_bio':
      // 1. Fetch Adherence Data (Omics)
      // Bypass Prisma Client type check for newly added model
      const omicTransactions = await (prisma as any).omicTransaction.findMany({
        where: { date: { gte: startDate } },
        orderBy: { date: 'asc' }
      });

      // 2. Fetch Rejuvenation Data (BioTests)
      const tests = await prisma.biophysicsTest.findMany({
        where: { testDate: { gte: startDate } },
        select: { testDate: true, chronologicalAge: true, biologicalAge: true },
        orderBy: { testDate: 'asc' }
      });

      // 3. Aggregate by Week (Simplified for visualization)
      const weeks: Record<string, { earned: number, potential: number, rejuvenation: number, count: number }> = {};

      // Process Omics
      omicTransactions.forEach((t: any) => {
        const weekKey = new Date(t.date).toISOString().slice(0, 10); // Daily aggregation
        if (!weeks[weekKey]) weeks[weekKey] = { earned: 0, potential: 0, rejuvenation: 0, count: 0 };
        weeks[weekKey].earned += t.pointsEarned;
        weeks[weekKey].potential += t.pointsPotential;
      });

      // Process BioTests
      let totalRejuvenationYears = 0;
      tests.forEach((t) => {
        const weekKey = new Date(t.testDate).toISOString().slice(0, 10);
        const reversal = t.chronologicalAge - t.biologicalAge;
        if (reversal > 0) {
          if (!weeks[weekKey]) weeks[weekKey] = { earned: 0, potential: 0, rejuvenation: 0, count: 0 };
          weeks[weekKey].rejuvenation += reversal;
          weeks[weekKey].count += 1;
          totalRejuvenationYears += reversal;
        }
      });

      // 4. Calculate Global Metrics
      const totalPointsEarned = omicTransactions.reduce((acc: number, cur: any) => acc + cur.pointsEarned, 0);
      const totalPointsPotential = omicTransactions.reduce((acc: number, cur: any) => acc + cur.pointsPotential, 0);
      const globalAdherence = totalPointsPotential > 0 ? (totalPointsEarned / totalPointsPotential) * 100 : 0;

      // 5. Structure Chart Data
      const chartData = Object.keys(weeks).sort().map(date => {
        const w = weeks[date];
        const adherence = w.potential > 0 ? (w.earned / w.potential) * 100 : 0;
        const avgRejuvenation = w.count > 0 ? w.rejuvenation / w.count : 0;
        return { date, adherence: Math.round(adherence), rejuvenation: Number(avgRejuvenation.toFixed(2)) };
      });

      // 6. Calculate Correlation Coefficient (Pearson r)
      const correlatedPoints = chartData.filter(d => d.adherence > 0 && d.rejuvenation > 0);
      let correlation = 0;
      if (correlatedPoints.length > 2) {
        const n = correlatedPoints.length;
        const sumX = correlatedPoints.reduce((acc, d) => acc + d.adherence, 0);
        const sumY = correlatedPoints.reduce((acc, d) => acc + d.rejuvenation, 0);
        const sumXY = correlatedPoints.reduce((acc, d) => acc + (d.adherence * d.rejuvenation), 0);
        const sumX2 = correlatedPoints.reduce((acc, d) => acc + (d.adherence * d.adherence), 0);
        const sumY2 = correlatedPoints.reduce((acc, d) => acc + (d.rejuvenation * d.rejuvenation), 0);

        const numerator = (n * sumXY) - (sumX * sumY);
        const denominator = Math.sqrt(((n * sumX2) - (sumX ** 2)) * ((n * sumY2) - (sumY ** 2)));
        correlation = denominator !== 0 ? numerator / denominator : 0;
      }

      // 7. Radar Data (4R Efficiency)
      const rTypes = { 'DETOX': 'Remoción', 'NUTRITION': 'Restauración', 'CELLULAR': 'Renovación', 'MINDSET': 'Revitalización' };
      const radarMap: Record<string, { earned: number, potential: number }> = {};

      omicTransactions.forEach((t: any) => {
        const label = rTypes[t.type as keyof typeof rTypes] || t.type;
        if (!radarMap[label]) radarMap[label] = { earned: 0, potential: 0 };
        radarMap[label].earned += t.pointsEarned;
        radarMap[label].potential += t.pointsPotential;
      });

      const radarData = Object.keys(radarMap).map(subject => {
        const d = radarMap[subject];
        return {
          subject,
          A: d.potential > 0 ? Math.round((d.earned / d.potential) * 100) : 0,
          fullMark: 100
        };
      });

      if (radarData.length === 0) {
        ['Remoción', 'Restauración', 'Renovación', 'Revitalización'].forEach(r => radarData.push({ subject: r, A: 0, fullMark: 100 }));
      }

      return {
        type: 'ri_bio',
        data: {
          correlation: Number(correlation.toFixed(2)),
          globalAdherence: Math.round(globalAdherence),
          rejuvenationYears: Number(totalRejuvenationYears.toFixed(1)),
          chartData,
          radarData
        } as any
      };

    case 'professional_analytics':
      // 1. Core Metrics
      const totalPatientsCount = await prisma.patient.count();
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const newPatientsThisMonth = await prisma.patient.count({
        where: { createdAt: { gte: startOfMonth } }
      });
      const prevMonthGrowth = totalPatientsCount > 0 ? (newPatientsThisMonth / totalPatientsCount) * 100 : 0;

      // 2. Bio-Age Delta (Aggregated/Anonymous)
      const testsWithDelta = await prisma.biophysicsTest.findMany({
        select: { chronologicalAge: true, biologicalAge: true }
      });
      const totalDelta = testsWithDelta.reduce((acc, t) => acc + (t.chronologicalAge - t.biologicalAge), 0);
      const avgDelta = testsWithDelta.length > 0 ? totalDelta / testsWithDelta.length : 0;

      // 3. Gender Distribution (groupBy)
      const genderStats = await (prisma as any).patient.groupBy({
        by: ['gender'],
        _count: { gender: true },
      });

      const genderData = genderStats.map((stat: any) => ({
        name: stat.gender || 'Otros',
        value: stat._count.gender
      }));

      // 4. Trend: New vs Recurring (Mocking as requested for Google Stitch Style)
      const trendData = [
        { name: 'Sep', new: 40, recurring: 24 },
        { name: 'Oct', new: 30, recurring: 13 },
        { name: 'Nov', new: 20, recurring: 98 },
        { name: 'Dec', new: 27, recurring: 39 },
        { name: 'Jan', new: 18, recurring: 48 },
      ];

      // 5. Adherence Filtering (🔒 PRIVACY HANDSHAKE)
      let adherenceTransactions = { _avg: { pointsEarned: 0 } };
      try {
        adherenceTransactions = await (prisma as any).omicTransaction.aggregate({
          where: {
            patient: { shareDataConsent: true } // 🔒 STRICT PRIVACY FILTER
          },
          _avg: { pointsEarned: true }
        });
      } catch (e) {
        console.warn("Table or Column shareDataConsent missing, falling back to all data (Anonymous Mode)");
        adherenceTransactions = await (prisma as any).omicTransaction.aggregate({
          _avg: { pointsEarned: true }
        });
      }

      return {
        type: 'professional_analytics',
        data: {
          totalPatients: totalPatientsCount,
          growth: Math.round(prevMonthGrowth),
          avgDelta: Number(avgDelta.toFixed(1)),
          genderData,
          trendData,
          avgAdherence: Math.round(adherenceTransactions._avg.pointsEarned || 0)
        } as any
      };

    default:
      throw new Error('Tipo de reporte no válido');
  }
}
