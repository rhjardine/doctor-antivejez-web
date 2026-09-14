-- B1: Persistencia de adherencia del paciente a los ítems de su guía.
--
-- MIGRACIÓN ESTRICTAMENTE ADITIVA.
-- Crea una tabla nueva y sus índices. No altera, no renombra y no elimina
-- ninguna columna, tabla ni dato existente. Ningún registro de pacientes,
-- tests o guías se ve tocado por esta migración.
--
-- Reversión: DROP TABLE "protocol_item_status";

-- CreateTable
CREATE TABLE "protocol_item_status" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protocol_item_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "protocol_item_status_patientId_idx" ON "protocol_item_status"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "protocol_item_status_patientId_itemId_key" ON "protocol_item_status"("patientId", "itemId");

-- AddForeignKey
ALTER TABLE "protocol_item_status" ADD CONSTRAINT "protocol_item_status_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
