/*
  Warnings:

  - You are about to drop the column `avatar` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[controlNumber]` on the table `patients` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "controlNumber" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "avatar";

-- CreateIndex
CREATE UNIQUE INDEX "patients_controlNumber_key" ON "patients"("controlNumber");
