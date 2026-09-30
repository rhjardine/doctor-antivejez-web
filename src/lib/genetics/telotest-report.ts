// Construccion del informe Telotest a partir del registro real del paciente.
//
// Por que existe: la ficha clinica mostraba `telotestReportData`, un informe
// inventado que vivia en `src/lib/mock-data.ts`. No era un placeholder vacio:
// llevaba dentro el nombre y la fecha de nacimiento de una persona concreta, una
// longitud telomerica, una edad biologica y una lista de tratamientos. Y se
// mostraba en la ficha de CUALQUIER paciente que abriera el medico.
//
// Eso no es un defecto de presentacion. Es una fuente directa de error clinico:
// un informe con tratamientos concretos, bajo el epigrafe de otro paciente.
//
// Logica pura, sin React ni base de datos, porque en este proyecto las pruebas
// corren en entorno node y no hay pruebas de componente.

import type {
  TelotestReport,
  TherapeuticResult,
  GeneralRecommendation,
  ScientificReference,
} from '@/types/genetics';

/** El registro real, tal y como sale de Prisma. */
export interface RegistroGenetico {
  averageTelomereLength: string;
  biologicalAge: number;
  chronologicalAge: number;
  differentialAge: number;
  interpretation?: string | null;
  therapeuticResults?: unknown;
  recommendations?: unknown;
  testDate: Date | string;
}

export interface PacienteDelInforme {
  firstName: string;
  lastName: string;
  birthDate: Date | string;
  chronologicalAge: number;
}

/**
 * Bibliografia sobre longitud telomerica.
 *
 * Son citas reales de literatura, no datos de paciente, asi que se conservan.
 * Viven aqui y no en un archivo llamado «mock-data» para que no se confundan con
 * lo que se retiro.
 */
export const REFERENCIAS_TELOMEROS: ScientificReference[] = [
  {
    id: 1,
    text: 'Ventura Marra M, et al. Nutrition Risk is Associated with Leukocyte Telomere Length...',
    url: '#',
  },
  {
    id: 2,
    text: 'Reichert S, Stier A. Does oxidative stress shorten telomeres in vivo? A review.',
    url: '#',
  },
  {
    id: 3,
    text: "Crous-Bou M, et al. Mediterranean diet and telomere length in Nurses' Health Study...",
    url: '#',
  },
];

/**
 * Normaliza un campo Json de Prisma a una lista, o a lista vacia.
 *
 * `therapeuticResults` y `recommendations` son `Json?`: pueden venir null, o
 * traer lo que se guardo. No se inventa contenido cuando faltan — es justo lo
 * que hacia el informe retirado.
 */
function comoLista<T>(valor: unknown): T[] {
  return Array.isArray(valor) ? (valor as T[]) : [];
}

/** El codigo de cliente que imprimia el informe. No se fabrica uno. */
export const SIN_CODIGO_CLIENTE = '—';

/**
 * Devuelve el informe del ULTIMO test genetico del paciente, o null si no tiene
 * ninguno.
 *
 * `null` es una respuesta legitima y la vista debe saber representarla: la
 * alternativa —rellenar con un informe de ejemplo— es exactamente el fallo que
 * se esta corrigiendo.
 */
export function informeDesdeRegistros(
  paciente: PacienteDelInforme | null | undefined,
  registros: readonly RegistroGenetico[] | null | undefined
): TelotestReport | null {
  if (!paciente) return null;
  if (!Array.isArray(registros) || registros.length === 0) return null;

  const masReciente = [...registros].sort(
    (a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime()
  )[0];

  return {
    patient: {
      firstName: paciente.firstName,
      lastName: paciente.lastName,
      birthDate: new Date(paciente.birthDate),
      chronologicalAge: paciente.chronologicalAge,
      customerCode: SIN_CODIGO_CLIENTE,
    },
    results: {
      averageTelomereLength: masReciente.averageTelomereLength,
      // El formato del laboratorio lleva las unidades; aqui solo se compone.
      estimatedBiologicalAge: `${masReciente.biologicalAge} years`,
      agingDifference: masReciente.differentialAge,
    },
    // Cadena vacia y no un texto de relleno: si el laboratorio no interpreto,
    // la ficha no debe afirmar que si.
    interpretation: masReciente.interpretation ?? '',
    therapeuticResults: comoLista<TherapeuticResult>(masReciente.therapeuticResults),
    generalRecommendations: comoLista<GeneralRecommendation>(masReciente.recommendations),
    references: REFERENCIAS_TELOMEROS,
  };
}
