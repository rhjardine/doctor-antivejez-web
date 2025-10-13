sql
-- AlterTable
-- Modifica la tabla 'patient_guides' para añadir las nuevas columnas y eliminar la antigua.
-- NOTA: Como la tabla está vacía en producción, no necesitamos preocuparnos por la pérdida de datos.
ALTER TABLE "patient_guides" DROP COLUMN "guideDate",
ADD COLUMN     "selections" JSONB NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
-- Elimina la tabla 'patient_guide_selections', que ya no es necesaria.
DROP TABLE "patient_guide_selections";