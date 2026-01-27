// src/types/reports.ts
import { Patient, User } from '@prisma/client';

export type ReportType =
  | 'patient_attendance'
  | 'treatment_adherence'
  | 'patient_evolution'
  | 'professional_performance'
  | 'ri_bio'
  | 'professional_analytics'; // ✅ NEW Professional Analytics

export interface ProfessionalAnalyticsData {
  totalPatients: number;
  growth: number;
  avgDelta: number;
  genderData: Array<{ name: string, value: number }>;
  trendData: Array<{ name: string, new: number, recurring: number }>;
  avgAdherence: number;
}


export type TimeRange =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual'
  | 'all';

export interface PatientReport extends Patient {
  user?: { name: string };
  testsCount?: number;
  evolution?: number;
}

export interface ProfessionalReport extends User {
  formsUsed?: number;
}

// ✅ Estructura de Datos para el Reporte RI-Bio
export interface RiBioReport {
  correlation: number; // Coeficiente r (-1 a 1)
  globalAdherence: number; // Porcentaje (0-100)
  rejuvenationYears: number; // Total años revertidos
  chartData: Array<{
    date: string;
    adherence: number;
    rejuvenation: number;
  }>;
  radarData: Array<{
    subject: string; // 'Remoción', 'Restauración', etc.
    A: number; // Eficiencia Actual
    fullMark: number;
  }>;
}

export type ReportData = {
  type: ReportType;
  data: PatientReport[] | ProfessionalReport[] | RiBioReport | ProfessionalAnalyticsData;
};
