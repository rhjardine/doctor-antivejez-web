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
       return { type: 'treatment_adherence', data: adherentPatients.map(p => ({...p, testsCount: p._count.biophysicsTests})) as PatientReport[] };


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

      return { type: 'professional_performance', data: professionals.map(p => ({...p, formsUsed: p._count.patients})) as ProfessionalReport[] };

    default:
      throw new Error('Tipo de reporte no válido');
  }
}
