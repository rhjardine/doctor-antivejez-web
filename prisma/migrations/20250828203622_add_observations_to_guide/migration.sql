/*
  Warnings:

  - A unique constraint covering the columns `[controlNumber]` on the table `patients` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RemocionAlimentacionType" AS ENUM ('Nino', 'Antienvejecimiento', 'Antidiabetica', 'Metabolica', 'Citostatica', 'Renal');

-- CreateEnum
CREATE TYPE "NoniAloeVeraTime" AS ENUM ('AntesDesayuno', 'AntesDesayunoCena', 'AntesCena');

-- AlterEnum
ALTER TYPE "GuideItemType" ADD VALUE 'REMOCION';

-- AlterTable
ALTER TABLE "patient_guide_selections" ADD COLUMN     "alimentacionTipo" "RemocionAlimentacionType"[],
ADD COLUMN     "cucharadas" INTEGER,
ADD COLUMN     "doseType" TEXT,
ADD COLUMN     "frascos" INTEGER,
ADD COLUMN     "gotas" INTEGER,
ADD COLUMN     "horario" TEXT,
ADD COLUMN     "semanas" INTEGER,
ADD COLUMN     "tacita" "NoniAloeVeraTime",
ADD COLUMN     "tacita_qty" INTEGER,
ADD COLUMN     "vecesAlDia" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "patients_controlNumber_key" ON "patients"("controlNumber");
