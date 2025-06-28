/*
  Warnings:

  - You are about to drop the `BiophysicsTest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Board` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Patient` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Range` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BiophysicsTest" DROP CONSTRAINT "BiophysicsTest_patientId_fkey";

-- DropForeignKey
ALTER TABLE "Board" DROP CONSTRAINT "Board_rangeId_fkey";

-- DropForeignKey
ALTER TABLE "Patient" DROP CONSTRAINT "Patient_userId_fkey";

-- DropTable
DROP TABLE "BiophysicsTest";

-- DropTable
DROP TABLE "Board";

-- DropTable
DROP TABLE "Patient";

-- DropTable
DROP TABLE "Range";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEDICO',
    "image" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailVerified" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "photo" TEXT,
    "nationality" TEXT NOT NULL,
    "identification" TEXT NOT NULL,
    "historyDate" TIMESTAMP(3) NOT NULL,
    "lastName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "chronologicalAge" INTEGER NOT NULL,
    "gender" "Gender" NOT NULL,
    "birthPlace" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "maritalStatus" TEXT NOT NULL,
    "profession" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "bloodType" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biophysics_tests" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "chronologicalAge" DOUBLE PRECISION NOT NULL,
    "biologicalAge" DOUBLE PRECISION NOT NULL,
    "differentialAge" DOUBLE PRECISION NOT NULL,
    "gender" TEXT NOT NULL,
    "isAthlete" BOOLEAN NOT NULL DEFAULT false,
    "fatPercentage" DOUBLE PRECISION,
    "fatAge" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "bmiAge" DOUBLE PRECISION,
    "digitalReflexes" DOUBLE PRECISION,
    "reflexesAge" DOUBLE PRECISION,
    "visualAccommodation" DOUBLE PRECISION,
    "visualAge" DOUBLE PRECISION,
    "staticBalance" DOUBLE PRECISION,
    "balanceAge" DOUBLE PRECISION,
    "skinHydration" DOUBLE PRECISION,
    "hydrationAge" DOUBLE PRECISION,
    "systolicPressure" DOUBLE PRECISION,
    "systolicAge" DOUBLE PRECISION,
    "diastolicPressure" DOUBLE PRECISION,
    "diastolicAge" DOUBLE PRECISION,
    "testDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "biophysics_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boards" (
    "id" TEXT NOT NULL,
    "rangeId" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'FORM_BIOPHYSICS',
    "name" TEXT NOT NULL,
    "minValue" DOUBLE PRECISION NOT NULL,
    "maxValue" DOUBLE PRECISION NOT NULL,
    "inverse" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranges" (
    "id" SERIAL NOT NULL,
    "minAge" DOUBLE PRECISION NOT NULL,
    "maxAge" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ranges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "patients_identification_key" ON "patients"("identification");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biophysics_tests" ADD CONSTRAINT "biophysics_tests_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boards" ADD CONSTRAINT "boards_rangeId_fkey" FOREIGN KEY ("rangeId") REFERENCES "ranges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
