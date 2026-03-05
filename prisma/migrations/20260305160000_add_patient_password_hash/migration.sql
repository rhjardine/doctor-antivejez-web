-- AlterTable: agregar campo passwordHash al modelo Patient
-- Campo nullable para no afectar registros existentes (~4,111 pacientes)
ALTER TABLE "patients" ADD COLUMN "passwordHash" TEXT;
