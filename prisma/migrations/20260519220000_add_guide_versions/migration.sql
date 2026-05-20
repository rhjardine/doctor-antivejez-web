-- Crear tabla de versiones históricas de guías
CREATE TABLE "patient_guide_versions" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "patient_guide_versions_pkey" PRIMARY KEY ("id")
);

-- Añadir llaves foráneas
ALTER TABLE "patient_guide_versions" ADD CONSTRAINT "patient_guide_versions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "patient_guide_versions" ADD CONSTRAINT "patient_guide_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Crear índices
CREATE INDEX "patient_guide_versions_patientId_idx" ON "patient_guide_versions"("patientId");
