-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('BIOFISICA', 'BIOQUIMICA', 'ORTOMOLECULAR', 'GENETICA');

-- AlterTable (Eliminando las cuotas antiguas)
ALTER TABLE "users" DROP COLUMN "quotaMax",
DROP COLUMN "quotaUsed";

-- AlterTable (Añadiendo el doctor a los tests existentes de forma opcional para no romper datos)
ALTER TABLE "biophysics_tests" ADD COLUMN "doctorId" TEXT;
ALTER TABLE "biochemistry_tests" ADD COLUMN "doctorId" TEXT;
ALTER TABLE "orthomolecular_tests" ADD COLUMN "doctorId" TEXT;
ALTER TABLE "genetic_tests" ADD COLUMN "doctorId" TEXT;

-- CreateTable (El nuevo Libro Mayor / Ledger)
CREATE TABLE "credit_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testType" "TestType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "credit_transactions_userId_idx" ON "credit_transactions"("userId");
CREATE INDEX "credit_transactions_userId_testType_idx" ON "credit_transactions"("userId", "testType");

-- AddForeignKey (Relación Ledger -> Usuario)
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (Relaciones Tests -> Doctor)
ALTER TABLE "biophysics_tests" ADD CONSTRAINT "biophysics_tests_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "biochemistry_tests" ADD CONSTRAINT "biochemistry_tests_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "orthomolecular_tests" ADD CONSTRAINT "orthomolecular_tests_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "genetic_tests" ADD CONSTRAINT "genetic_tests_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;