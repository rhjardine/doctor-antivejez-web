// src/lib/ai/anonymize.ts

import { PatientWithDetails } from '@/types';

// ─── S3: saneado del contexto que viaja a los prompts ───────────────────────

/**
 * Campos que identifican a una persona y que NUNCA deben salir hacia un
 * proveedor de IA externo, ni siquiera dentro de un system prompt.
 */
const CAMPOS_IDENTIFICADORES = [
  'name', 'firstName', 'lastName', 'fullName', 'nombre', 'apellido',
  'email', 'correo', 'phone', 'telefono', 'identification', 'documento',
  'cedula', 'address', 'direccion', 'birthDate', 'fechaNacimiento',
  'patientId', 'id', 'userId',
] as const;

/** Contexto clínico no identificable, apto para incluirse en un prompt. */
export interface SafePatientContext {
  bioAge?: number | string;
  chronologicalAge?: number | string;
  bloodType?: string;
  gender?: string;
}

/**
 * Sanea el contexto de paciente antes de construir cualquier prompt.
 *
 * Los asistentes (ALMA, VCoach) recibían `patientContext` directamente del
 * cliente e interpolaban `patientContext.name` —el nombre real del paciente—
 * en el system prompt, que acaba en un proveedor externo. Esto anulaba el
 * trabajo de anonimización del resto del módulo.
 *
 * Devuelve únicamente valores clínicos no identificables. Todo lo demás se
 * descarta, incluidas claves desconocidas: la lista es de permitidos, no de
 * prohibidos, para que un campo nuevo no se filtre por olvido.
 */
export function sanitizePatientContext(raw: unknown): SafePatientContext {
  if (!raw || typeof raw !== 'object') return {};
  const source = raw as Record<string, unknown>;

  const safe: SafePatientContext = {};

  const asScalar = (v: unknown): string | number | undefined =>
    typeof v === 'number' || typeof v === 'string' ? v : undefined;

  if (asScalar(source.bioAge) !== undefined) safe.bioAge = asScalar(source.bioAge);
  if (asScalar(source.chronologicalAge) !== undefined) {
    safe.chronologicalAge = asScalar(source.chronologicalAge);
  }
  if (typeof source.bloodType === 'string') safe.bloodType = source.bloodType;
  if (typeof source.gender === 'string') safe.gender = source.gender;

  return safe;
}

/**
 * Comprueba que un texto ya construido no contiene campos identificadores.
 * Se usa en tests como red de seguridad ante futuras regresiones.
 */
export function contienePosibleIdentificador(texto: string): boolean {
  const lower = texto.toLowerCase();
  return CAMPOS_IDENTIFICADORES.some((campo) => lower.includes(`"${campo}"`));
}

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