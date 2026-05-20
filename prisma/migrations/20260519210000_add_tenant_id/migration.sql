-- AlterTable: Agregar columna tenantId a users
ALTER TABLE "users" ADD COLUMN "tenantId" TEXT;

-- AlterTable: Agregar columna tenantId a patients
ALTER TABLE "patients" ADD COLUMN "tenantId" TEXT;