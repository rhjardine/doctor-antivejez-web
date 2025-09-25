-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MEDICO', 'ADMINISTRATIVO');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MASCULINO', 'FEMENINO', 'MASCULINO_DEPORTIVO', 'FEMENINO_DEPORTIVO');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GuideItemType" AS ENUM ('STANDARD', 'METABOLIC', 'REVITALIZATION');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('DESAYUNO', 'ALMUERZO', 'CENA', 'MERIENDAS_POSTRES');

-- CreateEnum
CREATE TYPE "BloodTypeGroup" AS ENUM ('ALL', 'O_B', 'A_AB');

-- CreateEnum
CREATE TYPE "GeneralGuideType" AS ENUM ('AVOID', 'SUBSTITUTE');

-- CreateEnum
CREATE TYPE "DietType" AS ENUM ('NINO', 'METABOLICA', 'ANTIDIABETICA', 'CITOSTATICA', 'RENAL');

-- CreateEnum
CREATE TYPE "BoardType" AS ENUM ('FORM_BIOPHYSICS', 'FORM_BIOCHEMISTRY');

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
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" "Role" NOT NULL DEFAULT 'MEDICO',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "controlNumber" SERIAL NOT NULL,
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
    "selectedDiets" "DietType"[],

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "biochemistry_tests" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
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
    "testDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "biochemistry_tests_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "ranges" (
    "id" INTEGER NOT NULL,
    "minAge" DOUBLE PRECISION NOT NULL,
    "maxAge" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ranges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boards" (
    "id" TEXT NOT NULL,
    "rangeId" INTEGER NOT NULL,
    "type" "BoardType" NOT NULL DEFAULT 'FORM_BIOPHYSICS',
    "name" TEXT NOT NULL,
    "minValue" DOUBLE PRECISION NOT NULL,
    "maxValue" DOUBLE PRECISION NOT NULL,
    "inverse" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boards_pkey" PRIMARY KEY ("id")
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
    "observations" TEXT,

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

-- CreateTable
CREATE TABLE "food_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mealType" "MealType" NOT NULL,
    "bloodTypeGroup" "BloodTypeGroup" NOT NULL DEFAULT 'ALL',
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "foodPlanId" TEXT,

    CONSTRAINT "food_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_plans" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_plans_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "messageBody" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "channels" TEXT[],
    "totalContacts" INTEGER NOT NULL,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_messages" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactInfo" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "providerId" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "patients_identification_key" ON "patients"("identification");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biophysics_tests" ADD CONSTRAINT "biophysics_tests_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biochemistry_tests" ADD CONSTRAINT "biochemistry_tests_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orthomolecular_tests" ADD CONSTRAINT "orthomolecular_tests_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boards" ADD CONSTRAINT "boards_rangeId_fkey" FOREIGN KEY ("rangeId") REFERENCES "ranges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_items" ADD CONSTRAINT "guide_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "guide_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_guides" ADD CONSTRAINT "patient_guides_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_guide_selections" ADD CONSTRAINT "patient_guide_selections_patientGuideId_fkey" FOREIGN KEY ("patientGuideId") REFERENCES "patient_guides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_guide_selections" ADD CONSTRAINT "patient_guide_selections_guideItemId_fkey" FOREIGN KEY ("guideItemId") REFERENCES "guide_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_items" ADD CONSTRAINT "food_items_foodPlanId_fkey" FOREIGN KEY ("foodPlanId") REFERENCES "food_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_plans" ADD CONSTRAINT "food_plans_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_messages" ADD CONSTRAINT "campaign_messages_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

