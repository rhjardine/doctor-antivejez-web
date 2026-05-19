-- AlterTable: Agregar columna deletedAt al modelo users (Profesionales)
ALTER TABLE "users" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable: Agregar columna deletedAt al modelo patients (Pacientes)
ALTER TABLE "patients" ADD COLUMN "deletedAt" TIMESTAMP(3);