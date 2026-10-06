-- Indices sobre las columnas de alcance y de fecha.
--
-- Estrictamente aditiva: no crea ni borra tablas ni columnas, no toca una sola
-- fila y no cambia ningun valor. Lo unico que cambia es el plan de ejecucion.
--
-- `IF NOT EXISTS` en cada sentencia para que repetir la migracion sea inocuo.
--
-- Nota sobre el bloqueo: `CREATE INDEX` toma un bloqueo SHARE que impide
-- ESCRITURAS en la tabla mientras se construye (las lecturas siguen). Con ~4236
-- pacientes y volumenes similares en los tests, cada indice tarda milisegundos.
-- Si algun dia estas tablas crecen a cientos de miles de filas, habra que pasar
-- a CREATE INDEX CONCURRENTLY, que NO puede ir dentro de una transaccion y por
-- tanto no sirve en una migracion de Prisma sin marcarla aparte.

-- Toda consulta de pacientes filtra por el profesional (o su clinica) y por
-- `deletedAt`, y ordena por `createdAt`. Sin esto, cada una recorria la tabla.
CREATE INDEX IF NOT EXISTS "patients_userId_deletedAt_createdAt_idx" ON "patients"("userId", "deletedAt", "createdAt");
CREATE INDEX IF NOT EXISTS "patients_tenantId_deletedAt_createdAt_idx" ON "patients"("tenantId", "deletedAt", "createdAt");

-- Por paciente y fecha: el historico y el calculo de evolucion.
-- Por medico y fecha: las tarjetas del panel.
CREATE INDEX IF NOT EXISTS "biophysics_tests_patientId_testDate_idx" ON "biophysics_tests"("patientId", "testDate");
CREATE INDEX IF NOT EXISTS "biophysics_tests_doctorId_testDate_idx" ON "biophysics_tests"("doctorId", "testDate");

CREATE INDEX IF NOT EXISTS "biochemistry_tests_patientId_testDate_idx" ON "biochemistry_tests"("patientId", "testDate");
CREATE INDEX IF NOT EXISTS "orthomolecular_tests_patientId_testDate_idx" ON "orthomolecular_tests"("patientId", "testDate");
CREATE INDEX IF NOT EXISTS "patient_guides_patientId_createdAt_idx" ON "patient_guides"("patientId", "createdAt");
