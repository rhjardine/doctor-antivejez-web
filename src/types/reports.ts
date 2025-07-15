// src/types/reports.ts
import { Patient, User } from '@prisma/client';

export type ReportType =
  | 'patient_attendance'
  | 'treatment_adherence'
  | 'patient_evolution'
  | 'professional_performance';

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

export type ReportData = {
  type: ReportType;
  data: PatientReport[] | ProfessionalReport[];
};
