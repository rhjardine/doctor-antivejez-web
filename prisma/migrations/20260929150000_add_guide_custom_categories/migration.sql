-- Categorías de la Guía del Paciente creadas por el médico.
--
-- MIGRACIÓN ESTRICTAMENTE ADITIVA.
-- Crea una tabla nueva y sus índices. No altera, no renombra y no elimina
-- ninguna columna, tabla ni dato existente. Ningún registro de pacientes,
-- tests, guías o usuarios se ve tocado por esta migración. La única clave
-- foránea apunta DESDE la tabla nueva hacia "users", de modo que "users"
-- tampoco se modifica.
--
-- Respaldo verificado antes de aplicar: respaldo_20260929.backup (456 kB).
--
-- Reversión: DROP TABLE "guide_custom_categories";

-- CreateTable
CREATE TABLE "guide_custom_categories" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "archivada" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guide_custom_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- Título único: evita acabar con dos categorías que se llaman igual, que en la
-- Guía serían indistinguibles para el médico.
CREATE UNIQUE INDEX "guide_custom_categories_title_key" ON "guide_custom_categories"("title");

-- CreateIndex
CREATE INDEX "guide_custom_categories_archivada_idx" ON "guide_custom_categories"("archivada");

-- AddForeignKey
ALTER TABLE "guide_custom_categories" ADD CONSTRAINT "guide_custom_categories_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
