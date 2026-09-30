// src/types/reports.ts
import type { Patient, User } from '@prisma/client';
import type {
  CAMPOS_PACIENTE_SEGUROS,
  CAMPOS_PROFESIONAL_SEGUROS,
} from '@/lib/scope/patient-scope';

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

/**
 * Un paciente tal y como sale en un reporte.
 *
 * NO extiende `Patient`. Extenderlo era la causa de fondo de la fuga: el tipo
 * *exigia* el registro completo, asi que la consulta usaba `include` suelto y
 * Prisma devolvia todos los escalares —identificacion, email, telefono,
 * direccion, observaciones y `passwordHash`— a quien invocara la accion.
 *
 * Ahora la forma se deriva de la lista blanca. La consecuencia es la que se
 * busca: para ensanchar lo que viaja al navegador hay que ensanchar la lista
 * blanca a mano, y eso se ve en la revision.
 */
export interface PatientReport
  extends Pick<Patient, keyof typeof CAMPOS_PACIENTE_SEGUROS> {
  user?: { name: string | null } | null;
  testsCount?: number;
  evolution?: number;
}

/** Igual que arriba: extender `User` arrastraba `password`, `email` y `permissions`. */
export interface ProfessionalReport
  extends Pick<User, keyof typeof CAMPOS_PROFESIONAL_SEGUROS> {
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
