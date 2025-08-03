import {
  BiochemistryFormValues,
  BiochemistryCalculationResult,
  BiochemistryPartialAges,
  ResultStatus,
  BoardWithRanges,
  BIOCHEMISTRY_ITEMS,
} from '@/types/biochemistry';

// Rangos de referencia para cada biomarcador [OPTIMAL, SUBOPTIMAL_UPPER_BOUND]
// Estos definen los umbrales para los colores verde, amarillo y rojo.
const REFERENCE_RANGES: Record<string, { ranges: [number, number]; inverse?: boolean }> = {
  somatomedinC: { ranges: [350, 150], inverse: true }, // Más es mejor
  hba1c: { ranges: [5.0, 5.7] },
  insulinBasal: { ranges: [5, 10] },
  dheaS: { ranges: [400, 150], inverse: true }, // Más es mejor
  freeTestosterone: { ranges: [50, 25], inverse: true }, // Más es mejor
  shbg: { ranges: [20, 60] },
  prostateAntigen: { ranges: [1, 2.5] },
  uricAcid: { ranges: [4.5, 6.0] },
  ferritin: { ranges: [80, 150] },
  vitaminD: { ranges: [50, 30], inverse: true }, // Más es mejor
  homocysteine: { ranges: [7, 10] },
  pcr: { ranges: [0.5, 1.0] },
  fibrinogen: { ranges: [250, 350] },
  triglycerides: { ranges: [70, 150] },
  hdl: { ranges: [70, 40], inverse: true }, // Más es mejor
  tgHdlRatio: { ranges: [1, 2] },
};

/**
 * Interpola un valor dentro de un rango para obtener una edad biológica.
 */
function interpolate(
  value: number,
  valueMin: number,
  valueMax: number,
  ageMin: number,
  ageMax: number,
): number {
  if (valueMax === valueMin) return ageMin;
  const result = ageMin + ((value - valueMin) * (ageMax - ageMin)) / (valueMax - valueMin);
  return result;
}

/**
 * Calcula la edad biológica para un solo biomarcador.
 */
function getAgeFromBoards(
  value: number,
  boards: BoardWithRanges[],
): number {
  // Asegurar que los baremos estén ordenados por edad
  const sortedBoards = [...boards].sort((a, b) => a.range.minAge - b.range.minAge);

  // Encontrar el baremo correspondiente al valor
  for (const board of sortedBoards) {
    const lower = Math.min(board.minValue, board.maxValue);
    const upper = Math.max(board.minValue, board.maxValue);

    if (value >= lower && value <= upper) {
      return interpolate(value, board.minValue, board.maxValue, board.range.minAge, board.range.maxAge);
    }
  }

  // Si el valor está fuera de todos los rangos, se extrapola desde el más cercano
  if (sortedBoards.length > 0) {
    const firstBoard = sortedBoards[0];
    const lastBoard = sortedBoards[sortedBoards.length - 1];
    if (value < Math.min(firstBoard.minValue, firstBoard.maxValue)) return firstBoard.range.minAge;
    if (value > Math.max(lastBoard.minValue, lastBoard.maxValue)) return lastBoard.range.maxAge;
  }

  return 0; // Fallback
}

/**
 * Determina el estado de un biomarcador (Óptimo, Subóptimo, Alto Riesgo).
 */
export function getBiochemistryStatus(value: number, biomarkerKey: string): ResultStatus {
  const ref = REFERENCE_RANGES[biomarkerKey];
  if (!ref) return 'SUBOPTIMAL';

  const [optimal, suboptimal] = ref.ranges;

  if (ref.inverse) { // Para valores donde "más es mejor"
    if (value >= optimal) return 'OPTIMAL';
    if (value >= suboptimal) return 'SUBOPTIMAL';
    return 'HIGH_RISK';
  } else { // Para valores donde "menos es mejor"
    if (value <= optimal) return 'OPTIMAL';
    if (value <= suboptimal) return 'SUBOPTIMAL';
    return 'HIGH_RISK';
  }
}

/**
 * Devuelve la clase de color de Tailwind CSS según el estado.
 */
export function getStatusColor(status: ResultStatus): string {
  const colorMap: Record<ResultStatus, string> = {
    OPTIMAL: 'bg-status-green',
    SUBOPTIMAL: 'bg-status-yellow',
    HIGH_RISK: 'bg-status-red',
  };
  return colorMap[status];
}

/**
 * Función principal para calcular la edad bioquímica total.
 */
export function calculateBioquimicaResults(
  formValues: BiochemistryFormValues,
  allBoards: BoardWithRanges[],
  chronologicalAge: number,
): BiochemistryCalculationResult {
  const partialAges: BiochemistryPartialAges = {};
  const statuses: Record<string, ResultStatus> = {};
  let totalAge = 0;
  let ageCount = 0;

  for (const item of BIOCHEMISTRY_ITEMS) {
    const key = item.key;
    const value = formValues[key];

    if (typeof value !== 'number') {
      throw new Error(`El valor para ${item.label} no es válido.`);
    }

    const itemBoards = allBoards.filter(b => b.name === key);
    const calculatedAge = getAgeFromBoards(value, itemBoards);
    
    const ageKey = `${key}Age` as keyof BiochemistryPartialAges;
    partialAges[ageKey] = calculatedAge;
    statuses[key] = getBiochemistryStatus(value, key);

    if (calculatedAge > 0) {
      totalAge += calculatedAge;
      ageCount++;
    }
  }

  const biologicalAge = ageCount > 0 ? totalAge / ageCount : chronologicalAge;
  const differentialAge = biologicalAge - chronologicalAge;

  return {
    biologicalAge: parseFloat(biologicalAge.toFixed(1)),
    differentialAge: parseFloat(differentialAge.toFixed(1)),
    partialAges,
    statuses: statuses as Record<typeof BIOCHEMISTRY_ITEMS[number]['key'], ResultStatus>,
  };
}
