-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('DESAYUNO', 'ALMUERZO', 'CENA', 'MERIENDAS_POSTRES');

-- CreateEnum
CREATE TYPE "BloodTypeGroup" AS ENUM ('ALL', 'O_B', 'A_AB');

-- CreateTable
CREATE TABLE "food_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mealType" "MealType" NOT NULL,
    "bloodTypeGroup" "BloodTypeGroup" NOT NULL DEFAULT 'ALL',
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "food_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_plans" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FoodItemToFoodPlan" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_FoodItemToFoodPlan_AB_unique" ON "_FoodItemToFoodPlan"("A", "B");

-- CreateIndex
CREATE INDEX "_FoodItemToFoodPlan_B_index" ON "_FoodItemToFoodPlan"("B");

-- AddForeignKey
ALTER TABLE "food_plans" ADD CONSTRAINT "food_plans_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FoodItemToFoodPlan" ADD CONSTRAINT "_FoodItemToFoodPlan_A_fkey" FOREIGN KEY ("A") REFERENCES "food_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FoodItemToFoodPlan" ADD CONSTRAINT "_FoodItemToFoodPlan_B_fkey" FOREIGN KEY ("B") REFERENCES "food_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
