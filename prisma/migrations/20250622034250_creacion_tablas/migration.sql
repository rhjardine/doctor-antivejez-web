-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MEDICO', 'ADMINISTRATIVO', 'PACIENTE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MASCULINO', 'FEMENINO', 'MASCULINO_DEPORTIVO', 'FEMENINO_DEPORTIVO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEDICO',
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
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

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiophysicsTest" (
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

    CONSTRAINT "BiophysicsTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL,
    "rangeId" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'FORM_BIOPHYSICS',
    "name" TEXT NOT NULL,
    "minValue" DOUBLE PRECISION NOT NULL,
    "maxValue" DOUBLE PRECISION NOT NULL,
    "inverse" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Range" (
    "id" SERIAL NOT NULL,
    "minAge" DOUBLE PRECISION NOT NULL,
    "maxAge" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Range_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_identification_key" ON "Patient"("identification");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiophysicsTest" ADD CONSTRAINT "BiophysicsTest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_rangeId_fkey" FOREIGN KEY ("rangeId") REFERENCES "Range"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
