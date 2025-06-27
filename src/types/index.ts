// src/types/index.ts

// 1. Importar los tipos base directamente desde el cliente de Prisma
// Esto asegura que nuestros tipos siempre estarán sincronizados con el esquema de la base de datos.
import type { 
  User as PrismaUser, 
  Patient as PrismaPatient, 
  BiophysicsTest as PrismaBiophysicsTest,
  Board as PrismaBoard,
  Range as PrismaRange
} from '@prisma/client';

// 2. Re-exportar los tipos base de Prisma para usarlos en toda la aplicación
export type User = PrismaUser;
export type Patient = PrismaPatient;
export type BiophysicsTest = PrismaBiophysicsTest;
export type Board = PrismaBoard;
export type Range = PrismaRange;

// 3. Crear un tipo específico para cuando un paciente se obtiene con sus relaciones
// Esto soluciona el error de "tipado" que bloquea el despliegue en Vercel.
export type PatientWithDetails = Patient & {
  user: Pick<User, 'id' | 'name' | 'email'>;
  biophysicsTests: BiophysicsTest[];
};

// 4. Mantener la definición de Gender, ya que es un tipo de unión personalizado
export type Gender = 'MASCULINO' | 'FEMENINO' | 'MASCULINO_DEPORTIVO' | 'FEMENINO_DEPORTIVO';