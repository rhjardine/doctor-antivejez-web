// src/utils/bioquimica-calculations.ts
import {
  BiochemistryFormValues,
  BiochemistryCalculationResult,
  BiochemistryPartialAges,
  ResultStatus,
  BIOCHEMISTRY_ITEMS,
} from '@/types/biochemistry';

// Rangos de edad definidos en la tabla
const AGE_RANGES = [
    [21, 28], [28, 35], [35, 42], [42, 49], [49, 56], [56, 63], [63, 70],
    [70, 77], [77, 84], [84, 91], [91, 98], [98, 105], [105, 112], [112, 120]
];

// Baremos oficiales extraídos de la tabla
const BIOMARKER_RANGES: Record<string, { ranges: number[][], inverse: boolean }> = {
    somatomedinC: { ranges: [[350, 325], [325, 300], [300, 250], [250, 200], [200, 150], [150, 100], [100, 80], [80, 60], [60, 50], [50, 40], [40, 30], [30, 20], [20, 10], [10, 0]], inverse: true },
    hba1c: { ranges: [[0, 0.5], [0.5, 1], [1, 1.5], [1.5, 3], [3, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14]], inverse: false },
    insulinBasal: { ranges: [[1, 2], [2, 5], [5, 7.5], [7.5, 10], [10, 15], [15, 30], [30, 40], [40, 50], [50, 60], [60, 80], [80, 100], [100, 120], [120, 140], [140, 160]], inverse: false },
    postPrandial: { ranges: [[1, 4], [4, 8], [8, 12], [12, 16], [16, 20], [20, 25], [25, 30], [30, 40], [20, 60], [60, 90], [90, 120], [120, 140], [140, 160], [160, 200]], inverse: false },
    tgHdlRatio: { ranges: [[1, 2], [2, 3], [3, 4], [4, 5], [5, 7], [7, 10], [10, 13], [13, 16], [16, 20], [20, 25], [25, 30], [30, 35], [35, 40], [40, 45]], inverse: false },
    dheaS: { ranges: [[350, 325], [325, 300], [300, 250], [250, 200], [200, 150], [150, 100], [100, 80], [80, 60], [60, 50], [50, 40], [40, 30], [30, 20], [20, 10], [10, 0]], inverse: true },
    homocysteine: { ranges: [[0, 2.5], [2.5, 5], [5, 7.5], [7.5, 10], [10, 15], [15, 25], [25, 35], [35, 45], [45, 55], [55, 60], [60, 65], [65, 70], [70, 85], [85, 100]], inverse: false },
    psa: { ranges: [[30, 25], [25, 20], [20, 18], [18, 15], [15, 13], [13, 11], [10, 9], [9, 8], [8, 7], [7, 6], [6, 5], [5, 4], [4, 3], [3, 2]], inverse: true },
    fsh: { ranges: [[1, 5], [5, 10], [10, 15], [15, 20], [20, 30], [30, 40], [40, 50], [50, 60], [60, 70], [70, 80], [80, 100], [100, 120], [120, 140], [140, 160]], inverse: false },
    boneDensitometry: { ranges: [[1.41, 1.30], [1.30, 1.25], [1.25, 1.18], [1.18, 1.06], [1.06, 1.00], [1.00, 0.94], [0.94, 0.90], [0.90, 0.88], [0.88, 0.86], [0.86, 0.84], [0.84, 0.82], [0.82, 0.72], [0.72, 0.62], [0.62, 0.58]], inverse: true },
};

function getAgeFromValue(value: number, key: keyof BiochemistryFormValues): number | null {
    const biomarkerData = BIOMARKER_RANGES[key];
    if (!biomarkerData) return null;

    const { ranges, inverse } = biomarkerData;

    for (let i = 0; i < ranges.length; i++) {
        let [valMin, valMax] = ranges[i];
        
        if (inverse) {
            [valMin, valMax] = [valMax, valMin];
        }

        if (value >= valMin && value <= valMax) {
            const [ageMin, ageMax] = AGE_RANGES[i];
            const rangeWidth = valMax - valMin;
            if (rangeWidth === 0) return ageMin;

            const ratio = (value - valMin) / rangeWidth;
            return ageMin + ratio * (ageMax - ageMin);
        }
    }
    
    const firstRange = inverse ? ranges[0].slice().reverse() : ranges[0];
    const lastRange = inverse ? ranges[ranges.length - 1].slice().reverse() : ranges[ranges.length - 1];

    if (value < firstRange[0]) return AGE_RANGES[0][0];
    if (value > lastRange[1]) return AGE_RANGES[AGE_RANGES.length - 1][1];

    return null;
}

// ===== SOLUCIÓN: Se añade 'export' para que la función sea visible desde otros archivos =====
export function getBiochemistryStatus(
  calculatedAge: number,
  chronologicalAge: number
): ResultStatus {
  const difference = calculatedAge - chronologicalAge;

  if (difference >= 7) return 'ENVEJECIDO';
  if (difference > 0) return 'NORMAL';
  return 'REJUVENECIDO';
}
// ========================================================================================

// ===== SOLUCIÓN: Se añade 'export' para que la función sea visible desde otros archivos =====
export function getStatusColorClass(status: ResultStatus, isBackground: boolean = false): string {
  const colorMap = {
    REJUVENECIDO: { bg: 'bg-green-500', text: 'text-green-500' },
    NORMAL: { bg: 'bg-yellow-500', text: 'text-yellow-500' },
    ENVEJECIDO: { bg: 'bg-red-500', text: 'text-red-500' },
    'SIN CALCULAR': { bg: 'bg-gray-400', text: 'text-gray-400' },
  };
  const style = colorMap[status] || colorMap['SIN CALCULAR'];
  return isBackground ? style.bg : style.text;
}
// ========================================================================================

export function calculateBioquimicaResults(
  formValues: BiochemistryFormValues,
  chronologicalAge: number,
): BiochemistryCalculationResult {
  const partialAges: BiochemistryPartialAges = {};
  let totalAge = 0;
  let ageCount = 0;

  for (const item of BIOCHEMISTRY_ITEMS) {
    const key = item.key;
    const value = formValues[key];

    if (typeof value === 'number' && !isNaN(value)) {
      const calculatedAge = getAgeFromValue(value, key);
      if (calculatedAge !== null) {
        const ageKey = `${key}Age` as keyof BiochemistryPartialAges;
        partialAges[ageKey] = calculatedAge;
        totalAge += calculatedAge;
        ageCount++;
      }
    }
  }

  const biologicalAge = ageCount > 0 ? totalAge / ageCount : chronologicalAge;
  const differentialAge = biologicalAge - chronologicalAge;
  const overallStatus = getBiochemistryStatus(biologicalAge, chronologicalAge);

  return {
    biologicalAge,
    differentialAge,
    chronologicalAge,
    partialAges,
    status: overallStatus,
  };
}