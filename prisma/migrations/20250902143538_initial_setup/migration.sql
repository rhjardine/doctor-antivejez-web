/*
  Warnings:

  - The values [REMOCION] on the enum `GuideItemType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `alimentacionTipo` on the `patient_guide_selections` table. All the data in the column will be lost.
  - You are about to drop the column `cucharadas` on the `patient_guide_selections` table. All the data in the column will be lost.
  - You are about to drop the column `doseType` on the `patient_guide_selections` table. All the data in the column will be lost.
  - You are about to drop the column `frascos` on the `patient_guide_selections` table. All the data in the column will be lost.
  - You are about to drop the column `gotas` on the `patient_guide_selections` table. All the data in the column will be lost.
  - You are about to drop the column `horario` on the `patient_guide_selections` table. All the data in the column will be lost.
  - You are about to drop the column `semanas` on the `patient_guide_selections` table. All the data in the column will be lost.
  - You are about to drop the column `tacita` on the `patient_guide_selections` table. All the data in the column will be lost.
  - You are about to drop the column `tacita_qty` on the `patient_guide_selections` table. All the data in the column will be lost.
  - You are about to drop the column `vecesAlDia` on the `patient_guide_selections` table. All the data in the column will be lost.
  - You are about to drop the column `observations` on the `patient_guides` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GuideItemType_new" AS ENUM ('STANDARD', 'METABOLIC', 'REVITALIZATION');
ALTER TABLE "guide_categories" ALTER COLUMN "type" TYPE "GuideItemType_new" USING ("type"::text::"GuideItemType_new");
ALTER TYPE "GuideItemType" RENAME TO "GuideItemType_old";
ALTER TYPE "GuideItemType_new" RENAME TO "GuideItemType";
DROP TYPE "GuideItemType_old";
COMMIT;

-- DropIndex
DROP INDEX "patients_controlNumber_key";

-- AlterTable
ALTER TABLE "food_plans" ADD COLUMN     "observations" TEXT;

-- AlterTable
ALTER TABLE "patient_guide_selections" DROP COLUMN "alimentacionTipo",
DROP COLUMN "cucharadas",
DROP COLUMN "doseType",
DROP COLUMN "frascos",
DROP COLUMN "gotas",
DROP COLUMN "horario",
DROP COLUMN "semanas",
DROP COLUMN "tacita",
DROP COLUMN "tacita_qty",
DROP COLUMN "vecesAlDia";

-- AlterTable
ALTER TABLE "patient_guides" DROP COLUMN "observations";

-- DropEnum
DROP TYPE "NoniAloeVeraTime";

-- DropEnum
DROP TYPE "RemocionAlimentacionType";
