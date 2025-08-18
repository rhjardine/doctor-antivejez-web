// src/types/index.ts

// 1. Importar los tipos base directamente desde el cliente de Prisma
// Esto asegura que nuestros tipos siempre estarán sincronizados con el esquema de la base de datos.
import type { 
  User as PrismaUser, 
  Patient as PrismaPatient, 
  BiophysicsTest as PrismaBiophysicsTest,
  BiochemistryTest as PrismaBiochemistryTest,
  OrthomolecularTest as PrismaOrthomolecularTest, // ===== NUEVO: Se importa el tipo del nuevo test =====
  Board as PrismaBoard,
  Range as PrismaRange,
  Appointment as PrismaAppointment
} from '@prisma/client';

// 2. Re-exportar los tipos base de Prisma para usarlos en toda la aplicación
export type User = PrismaUser;
export type Patient = PrismaPatient;
export type BiophysicsTest = PrismaBiophysicsTest;
export type BiochemistryTest = PrismaBiochemistryTest;
export type OrthomolecularTest = PrismaOrthomolecularTest; // ===== NUEVO: Se re-exporta el tipo del nuevo test =====
export type Board = PrismaBoard;
export type Range = PrismaRange;
export type Appointment = PrismaAppointment;

// 3. Crear un tipo específico para cuando un paciente se obtiene con sus relaciones
export type PatientWithDetails = Patient & {
  user: Pick<User, 'id' | 'name' | 'email'>;
  biophysicsTests: BiophysicsTest[];
  biochemistryTests: BiochemistryTest[];
  orthomolecularTests: OrthomolecularTest[]; // ===== NUEVO: Se añade la propiedad al tipo detallado =====
  appointments: Appointment[];
};

// 4. Mantener la definición de Gender, ya que es un tipo de unión personalizado
export type Gender = 'MASCULINO' | 'FEMENINO' | 'MASCULINO_DEPORTIVO' | 'FEMENINO_DEPORTIVO';

// Se añade el tipo TabId para poder ser compartido entre componentes.
export type TabId = 'resumen' | 'historia' | 'biofisica' | 'guia' | 'alimentacion' | 'omicas' | 'seguimiento';