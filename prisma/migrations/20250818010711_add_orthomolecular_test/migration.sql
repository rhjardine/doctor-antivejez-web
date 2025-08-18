/*
  Warnings:

  - The values [PACIENTE] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - The `type` column on the `boards` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `createdAt` on the `ranges` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ranges` table. All the data in the column will be lost.
  - You are about to drop the column `avatar` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "GuideItemType" AS ENUM ('STANDARD', 'METABOLIC', 'REVITALIZATION');

-- CreateEnum
CREATE TYPE "BoardType" AS ENUM ('FORM_BIOPHYSICS', 'FORM_BIOCHEMISTRY');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('MEDICO', 'ADMINISTRATIVO');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'MEDICO';
COMMIT;

-- AlterTable
ALTER TABLE "boards" DROP COLUMN "type",
ADD COLUMN     "type" "BoardType" NOT NULL DEFAULT 'FORM_BIOPHYSICS';

-- AlterTable
ALTER TABLE "ranges" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "ranges_id_seq";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "avatar",
DROP COLUMN "createdAt",
DROP COLUMN "isActive",
DROP COLUMN "updatedAt",
ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "image" TEXT,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "name" DROP NOT NULL;

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "orthomolecular_tests" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "chronologicalAge" DOUBLE PRECISION NOT NULL,
    "orthomolecularAge" DOUBLE PRECISION NOT NULL,
    "differentialAge" DOUBLE PRECISION NOT NULL,
    "testDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "aluminio" DOUBLE PRECISION,
    "antimonio" DOUBLE PRECISION,
    "arsenico" DOUBLE PRECISION,
    "bario" DOUBLE PRECISION,
    "berilio" DOUBLE PRECISION,
    "bismuto" DOUBLE PRECISION,
    "cadmio" DOUBLE PRECISION,
    "mercurio" DOUBLE PRECISION,
    "niquel" DOUBLE PRECISION,
    "plata" DOUBLE PRECISION,
    "platino" DOUBLE PRECISION,
    "plomo" DOUBLE PRECISION,
    "talio" DOUBLE PRECISION,
    "tinio" DOUBLE PRECISION,
    "titanio" DOUBLE PRECISION,
    "torio" DOUBLE PRECISION,
    "uranio" DOUBLE PRECISION,
    "calcio" DOUBLE PRECISION,
    "calcioAlt" DOUBLE PRECISION,
    "magnesio" DOUBLE PRECISION,
    "magnesioAlt" DOUBLE PRECISION,
    "sodio" DOUBLE PRECISION,
    "potasio" DOUBLE PRECISION,
    "potasioAlt" DOUBLE PRECISION,
    "cobre" DOUBLE PRECISION,
    "cobreAlt" DOUBLE PRECISION,
    "zinc" DOUBLE PRECISION,
    "zincAlt" DOUBLE PRECISION,
    "manganeso" DOUBLE PRECISION,
    "manganesoAlt" DOUBLE PRECISION,
    "cromo" DOUBLE PRECISION,
    "cromoAlt" DOUBLE PRECISION,
    "vanadio" DOUBLE PRECISION,
    "molibdeno" DOUBLE PRECISION,
    "boro" DOUBLE PRECISION,
    "yodo" DOUBLE PRECISION,
    "litio" DOUBLE PRECISION,
    "phosphoro" DOUBLE PRECISION,
    "selenio" DOUBLE PRECISION,
    "estroncio" DOUBLE PRECISION,
    "azufre" DOUBLE PRECISION,
    "cobalto" DOUBLE PRECISION,
    "hierro" DOUBLE PRECISION,
    "germanio" DOUBLE PRECISION,
    "rubidio" DOUBLE PRECISION,
    "zirconio" DOUBLE PRECISION,
    "aluminioAge" DOUBLE PRECISION,
    "antimonioAge" DOUBLE PRECISION,
    "arsenicoAge" DOUBLE PRECISION,
    "barioAge" DOUBLE PRECISION,
    "berilioAge" DOUBLE PRECISION,
    "bismutoAge" DOUBLE PRECISION,
    "cadmioAge" DOUBLE PRECISION,
    "mercurioAge" DOUBLE PRECISION,
    "niquelAge" DOUBLE PRECISION,
    "plataAge" DOUBLE PRECISION,
    "platinoAge" DOUBLE PRECISION,
    "plomoAge" DOUBLE PRECISION,
    "talioAge" DOUBLE PRECISION,
    "tinioAge" DOUBLE PRECISION,
    "titanioAge" DOUBLE PRECISION,
    "torioAge" DOUBLE PRECISION,
    "uranioAge" DOUBLE PRECISION,
    "calcioAge" DOUBLE PRECISION,
    "calcioAltAge" DOUBLE PRECISION,
    "magnesioAge" DOUBLE PRECISION,
    "magnesioAltAge" DOUBLE PRECISION,
    "sodioAge" DOUBLE PRECISION,
    "potasioAge" DOUBLE PRECISION,
    "potasioAltAge" DOUBLE PRECISION,
    "cobreAge" DOUBLE PRECISION,
    "cobreAltAge" DOUBLE PRECISION,
    "zincAge" DOUBLE PRECISION,
    "zincAltAge" DOUBLE PRECISION,
    "manganesoAge" DOUBLE PRECISION,
    "manganesoAltAge" DOUBLE PRECISION,
    "cromoAge" DOUBLE PRECISION,
    "cromoAltAge" DOUBLE PRECISION,
    "vanadioAge" DOUBLE PRECISION,
    "molibdenoAge" DOUBLE PRECISION,
    "boroAge" DOUBLE PRECISION,
    "yodoAge" DOUBLE PRECISION,
    "litioAge" DOUBLE PRECISION,
    "phosphoroAge" DOUBLE PRECISION,
    "selenioAge" DOUBLE PRECISION,
    "estroncioAge" DOUBLE PRECISION,
    "azufreAge" DOUBLE PRECISION,
    "cobaltoAge" DOUBLE PRECISION,
    "hierroAge" DOUBLE PRECISION,
    "germanioAge" DOUBLE PRECISION,
    "rubidioAge" DOUBLE PRECISION,
    "zirconioAge" DOUBLE PRECISION,

    CONSTRAINT "orthomolecular_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guide_categories" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "GuideItemType" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "guide_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guide_items" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dose" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guide_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_guides" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "guideDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_guide_selections" (
    "id" TEXT NOT NULL,
    "patientGuideId" TEXT NOT NULL,
    "guideItemId" TEXT NOT NULL,
    "qty" TEXT,
    "freq" TEXT,
    "custom" TEXT,
    "complejoB_cc" TEXT,
    "bioquel_cc" TEXT,
    "frequency" TEXT,

    CONSTRAINT "patient_guide_selections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orthomolecular_tests" ADD CONSTRAINT "orthomolecular_tests_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_items" ADD CONSTRAINT "guide_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "guide_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_guides" ADD CONSTRAINT "patient_guides_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_guide_selections" ADD CONSTRAINT "patient_guide_selections_patientGuideId_fkey" FOREIGN KEY ("patientGuideId") REFERENCES "patient_guides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_guide_selections" ADD CONSTRAINT "patient_guide_selections_guideItemId_fkey" FOREIGN KEY ("guideItemId") REFERENCES "guide_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
