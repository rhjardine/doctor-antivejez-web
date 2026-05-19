-- AlterTable: Agregar columna deletedAt al modelo User (Profesionales)
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable: Agregar columna deletedAt al modelo Patient (Pacientes)
ALTER TABLE "Patient" ADD COLUMN "deletedAt" TIMESTAMP(3);