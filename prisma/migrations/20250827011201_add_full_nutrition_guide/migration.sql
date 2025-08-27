-- CreateEnum
CREATE TYPE "GeneralGuideType" AS ENUM ('AVOID', 'SUBSTITUTE');

-- CreateEnum
CREATE TYPE "DietType" AS ENUM ('NINO', 'METABOLICA', 'ANTIDIABETICA', 'CITOSTATICA', 'RENAL');

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "selectedDiets" "DietType"[];

-- CreateTable
CREATE TABLE "general_guide_items" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" "GeneralGuideType" NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "general_guide_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wellness_keys" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wellness_keys_pkey" PRIMARY KEY ("id")
);
