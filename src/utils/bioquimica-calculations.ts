import {
  BiochemistryFormValues,
  BiochemistryCalculationResult,
  BiochemistryPartialAges,
  ResultStatus,
  BoardWithRanges,
  BIOCHEMISTRY_ITEMS,
} from '@/types/biochemistry';

// --- Rangos de Referencia (Óptimo, Subóptimo) ---
// Define los umbrales para los colores de estado (verde, amarillo, rojo).
// La propiedad 'inverse' indica que valores más altos son mejores.
const REFERENCE_RANGES: Record<string, { ranges: [number, number]; inverse?: boolean }> = {
  somatomedinC: { ranges: [350, 150], inverse: true },
  hba1c: { ranges: [5.0, 5.7] },
  insulinBasal: { ranges: [5, 10] },
  dheaS: { ranges: [400, 150], inverse: true },
  freeTestosterone: { ranges: [50, 25], inverse: true },
  shbg: { ranges: [20, 60] },
  prostateAntigen: { ranges: [1, 2.5] },
  uricAcid: { ranges: [4.5, 6.0] },
  ferritin: { ranges: [80, 150] },
  vitaminD: { ranges: [50, 30], inverse: true },
  homocysteine: { ranges: [7, 10] },
  pcr: { ranges: [1, 3] },
  fibrinogen: { ranges: [300, 400] },
  triglycerides: { ranges: [100, 150] },
  hdl: { ranges: [60, 40], inverse: true },
  tgHdlRatio: { ranges: [1, 2] },
};

/**
 * Interpola un valor dentro de un rango para obtener una edad.
 */
function interpolate(value: number, minValue: number, maxValue: number, minAge: number, maxAge: number, inverse: boolean): number {
  if (inverse) {
    // Si es inverso, un valor más alto da una edad menor.
    if (value >= minValue) return minAge;
    if (value <= maxValue) return maxAge;
    const percentage = (value - maxValue) / (minValue - maxValue);
    return maxAge - percentage * (maxAge - minAge);
  } else {
    // Si no es inverso, un valor más alto da una edad mayor.
    if (value <= minValue) return minAge;
    if (value >= maxValue) return maxAge;
    const percentage = (value - minValue) / (maxValue - minValue);
    return minAge + percentage * (maxAge - minAge);
  }
}

/**
 * Obtiene la edad calculada a partir de los baremos.
 */
function getAgeFromBoards(value: number, boards: BoardWithRanges[]): number {
  if (boards.length === 0) return 0;

  for (const board of boards) {
    const { minValue, maxValue, inverse, range } = board;
    const checkValue = Math.max(minValue, maxValue);
    const checkInverse = Math.min(minValue, maxValue);

    if (inverse ? (value < checkValue && value >= checkInverse) : (value >= checkInverse && value < checkValue)) {
        return interpolate(value, minValue, maxValue, range.minAge, range.maxAge, inverse);
    }
  }

  // Si el valor está fuera de todos los rangos, se asigna la edad del rango extremo.
  const sortedBoards = boards.sort((a, b) => a.range.minAge - b.range.minAge);
  const lastBoard = sortedBoards[sortedBoards.length - 1];
  return lastBoard.range.maxAge;
}

/**
 * Determina el estado (óptimo, subóptimo, etc.) de un biomarcador.
 */
export function getBiochemistryStatus(value: number, key: string): ResultStatus {
    const config = REFERENCE_RANGES[key];
    if (!config) return 'NO_DATA';

    const [optimal, suboptimal] = config.ranges;

    if (config.inverse) { // Valores más altos son mejores
        if (value >= optimal) return 'OPTIMAL';
        if (value >= suboptimal) return 'SUBOPTIMAL';
        return 'HIGH_RISK';
    } else { // Valores más bajos son mejores
        if (value <= optimal) return 'OPTIMAL';
        if (value <= suboptimal) return 'SUBOPTIMAL';
        return 'HIGH_RISK';
    }
}

/**
 * Devuelve el color de Tailwind CSS correspondiente a un estado.
 */
export function getStatusColor(status: ResultStatus): string {
  const colorMap: Record<ResultStatus, string> = {
    OPTIMAL: 'bg-green-500',
    SUBOPTIMAL: 'bg-yellow-500',
    HIGH_RISK: 'bg-red-500',
    NO_DATA: 'bg-gray-400',
  };
  return colorMap[status];
}

/**
 * Función principal para calcular la edad bioquímica y otros resultados.
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

    if (typeof value === 'number' && !isNaN(value)) {
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
  }

  const biologicalAge = ageCount > 0 ? totalAge / ageCount : chronologicalAge;
  const differentialAge = biologicalAge - chronologicalAge;

  return {
    biologicalAge,
    differentialAge,
    partialAges,
    statuses,
  };
}
