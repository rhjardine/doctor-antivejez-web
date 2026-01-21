// src/types/index.ts

// 1. Importar los tipos base directamente desde el cliente de Prisma
import type {
  User as PrismaUser,
  Patient as PrismaPatient,
  BiophysicsTest as PrismaBiophysicsTest,
  BiochemistryTest as PrismaBiochemistryTest,
  OrthomolecularTest as PrismaOrthomolecularTest,
  Board as PrismaBoard,
  Range as PrismaRange,
  Appointment as PrismaAppointment,
  PatientGuide as PrismaPatientGuide,
  FoodPlan as PrismaFoodPlan,
  FoodItem as PrismaFoodItem,
  AIAnalysis as PrismaAIAnalysis // ✅ NUEVO: Importar el tipo AIAnalysis
} from '@prisma/client';

// 2. Re-exportar los tipos base de Prisma
export type User = PrismaUser;
export type Patient = PrismaPatient;
export type BiophysicsTest = PrismaBiophysicsTest;
export type BiochemistryTest = PrismaBiochemistryTest;
export type OrthomolecularTest = PrismaOrthomolecularTest;
export type Board = PrismaBoard;
export type Range = PrismaRange;
export type Appointment = PrismaAppointment;
export type PatientGuide = PrismaPatientGuide;
export type FoodPlan = PrismaFoodPlan;
export type FoodItem = PrismaFoodItem;
export type AIAnalysis = PrismaAIAnalysis; // ✅ NUEVO: Re-exportar el tipo

// 3. Crear un tipo específico para cuando un paciente se obtiene con sus relaciones
export type PatientWithDetails = Patient & {
  user: Pick<User, 'id' | 'name' | 'email'>;
  biophysicsTests: BiophysicsTest[];
  biochemistryTests: BiochemistryTest[];
  orthomolecularTests: OrthomolecularTest[];
  appointments: Appointment[];
  guides: PatientGuide[];
  foodPlans: (FoodPlan & { items: FoodItem[] })[];
  aiAnalyses: AIAnalysis[]; // ✅ NUEVO: Añadir la nueva relación
};

// 4. Mantener tipos personalizados
export type Gender = 'MASCULINO' | 'FEMENINO' | 'MASCULINO_DEPORTIVO' | 'FEMENINO_DEPORTIVO';
export type TabId = 'resumen' | 'historia' | 'biofisica' | 'biomarcadores' | 'guia' | 'alimentacion' | 'omicas';