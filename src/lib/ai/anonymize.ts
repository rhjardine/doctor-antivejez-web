// src/lib/ai/anonymize.ts

import { PatientWithDetails } from '@/types';

/**
 * Filtra y estructura los datos de un paciente para enviar solo la información clínica 
 * relevante y no identificable a un servicio de IA externo.
 * @param patient El objeto completo del paciente con sus relaciones.
 * @returns Un objeto anonimizado y seguro para el análisis.
 */
export function anonymizePatientData(patient: PatientWithDetails) {
  const lastBiophysics = patient.biophysicsTests?.[0];
  const lastBiochemistry = patient.biochemistryTests?.[0];
  const lastOrthomolecular = patient.orthomolecularTests?.[0];

  return {
    // Datos demográficos no identificables
    chronologicalAge: patient.chronologicalAge,
    gender: patient.gender,
    
    // Datos clínicos de los últimos tests
    biophysicsTest: lastBiophysics ? {
      biologicalAge: lastBiophysics.biologicalAge,
      fatPercentage: lastBiophysics.fatPercentage,
      bodyMassIndex: lastBiophysics.bmi,
      digitalReflexes: lastBiophysics.digitalReflexes,
      testDate: lastBiophysics.testDate.toISOString().split('T')[0],
    } : null,
    
    biochemistryTest: lastBiochemistry ? {
      somatomedinC: lastBiochemistry.somatomedin,
      hba1c: lastBiochemistry.hba1c,
      insulinBasal: lastBiochemistry.insulin,
      tgHdlRatio: lastBiochemistry.tgHdlRatio,
      dheaS: lastBiochemistry.dhea,
      homocysteine: lastBiochemistry.homocysteine,
      prostateAntigenPSA: lastBiochemistry.psa,
      testDate: lastBiochemistry.testDate.toISOString().split('T')[0],
    } : null,

    // Incluir una selección de metales pesados si existen datos
    orthomolecularTest: lastOrthomolecular ? {
      mercury: lastOrthomolecular.mercurio,
      lead: lastOrthomolecular.plomo,
      aluminum: lastOrthomolecular.aluminio,
      arsenic: lastOrthomolecular.arsenico,
      testDate: lastOrthomolecular.testDate.toISOString().split('T')[0],
    } : null,

    // Historial de observaciones médicas
    previousObservations: patient.guides?.slice(0, 3).map(g => ({
      date: g.createdAt.toISOString().split('T')[0],
      observation: g.observations,
    })) || [],
  };
}