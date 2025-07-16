/*
  Warnings:

  - You are about to drop the column `emailVerified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "boards" DROP CONSTRAINT "boards_rangeId_fkey";

-- DropIndex
DROP INDEX "patients_controlNumber_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "emailVerified",
DROP COLUMN "image",
ADD COLUMN     "avatar" TEXT;

-- CreateTable
CREATE TABLE "biochemistry_tests" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "testDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chronologicalAge" DOUBLE PRECISION NOT NULL,
    "biochemicalAge" DOUBLE PRECISION NOT NULL,
    "differentialAge" DOUBLE PRECISION NOT NULL,
    "somatomedin" DOUBLE PRECISION,
    "somatomedinAge" DOUBLE PRECISION,
    "hba1c" DOUBLE PRECISION,
    "hba1cAge" DOUBLE PRECISION,
    "insulin" DOUBLE PRECISION,
    "insulinAge" DOUBLE PRECISION,
    "postPrandial" DOUBLE PRECISION,
    "postPrandialAge" DOUBLE PRECISION,
    "tgHdlRatio" DOUBLE PRECISION,
    "tgHdlRatioAge" DOUBLE PRECISION,
    "dhea" DOUBLE PRECISION,
    "dheaAge" DOUBLE PRECISION,
    "homocysteine" DOUBLE PRECISION,
    "homocysteineAge" DOUBLE PRECISION,
    "psa" DOUBLE PRECISION,
    "psaAge" DOUBLE PRECISION,
    "fsh" DOUBLE PRECISION,
    "fshAge" DOUBLE PRECISION,
    "boneDensitometry" DOUBLE PRECISION,
    "boneDensitometryAge" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "biochemistry_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "biochemistry_tests" ADD CONSTRAINT "biochemistry_tests_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boards" ADD CONSTRAINT "boards_rangeId_fkey" FOREIGN KEY ("rangeId") REFERENCES "ranges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
