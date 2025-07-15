// src/utils/bioquimica-calculations.ts
import type { BiochemistryFormValues, BiochemistryPartialAges, BiochemistryCalculationResult } from '@/types/biochemistry';

// ===================================================================================
// INICIO: Lógica de cálculo 1:1 con el sistema legado para el Test Bioquímico
// ===================================================================================

class LegacyBiochemicalAgeCalculator {
    private ageRanges: number[][];
    private ranges: Record<string, number[][]>;

    constructor() {
        this.ageRanges = [
            [21, 28], [28, 35], [35, 42], [42, 49], [49, 56], [56, 63], [63, 70], 
            [70, 77], [77, 84], [84, 91], [91, 98], [98, 105], [105, 112], [112, 120]
        ];
        
        this.ranges = {
            somatomedin: [[350, 325], [325, 300], [300, 250], [250, 200], [200, 150], [150, 100], [100, 80], [80, 60], [60, 50], [50, 40], [40, 30], [30, 20], [20, 10], [10, 0]],
            hba1c: [[0, 0.5], [0.5, 1], [1, 1.5], [1.5, 3], [3, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14]],
            insulin: [[1, 2], [2, 5], [5, 7.5], [7.5, 10], [10, 15], [15, 30], [30, 40], [40, 50], [50, 60], [60, 80], [80, 100], [100, 120], [120, 140], [140, 160]],
            postPrandial: [[1, 4], [4, 8], [8, 12], [12, 16], [16, 20], [20, 25], [25, 30], [30, 40], [40, 60], [60, 90], [90, 120], [120, 140], [140, 160], [160, 200]],
            tgHdlRatio: [[1, 2], [2, 3], [3, 4], [4, 5], [5, 7], [7, 10], [10, 13], [13, 16], [16, 20], [20, 25], [25, 30], [30, 35], [35, 40], [40, 45]],
            dhea: [[350, 325], [325, 300], [300, 250], [250, 200], [200, 150], [150, 100], [100, 80], [80, 60], [60, 50], [50, 40], [40, 30], [30, 20], [20, 10], [10, 0]],
            homocysteine: [[0, 2.5], [2.5, 5], [5, 7.5], [7.5, 10], [10, 15], [15, 25], [25, 35], [35, 45], [45, 55], [55, 60], [60, 65], [65, 70], [70, 85], [85, 100]],
            psa: [[30, 25], [25, 20], [20, 18], [18, 15], [15, 13], [13, 11], [11, 10], [10, 9], [9, 8], [8, 7], [7, 6], [6, 5], [5, 4], [4, 2]],
            fsh: [[1, 5], [5, 10], [10, 15], [15, 20], [20, 30], [30, 40], [40, 50], [50, 60], [60, 70], [70, 80], [80, 100], [100, 120], [120, 140], [140, 160]],
            boneDensitometry: [[1.41, 1.30], [1.30, 1.25], [1.25, 1.18], [1.18, 1.06], [1.06, 1.00], [1.00, 0.94], [0.94, 0.90], [0.90, 0.88], [0.88, 0.86], [0.86, 0.84], [0.84, 0.82], [0.82, 0.72], [0.72, 0.62], [0.62, 0.58]]
        };
    }

    private interpolate(value: number, range1: number, range2: number, age1: number, age2: number): number {
        if (range1 === range2) return age1;
        const result = age1 + (value - range1) * (age2 - age1) / (range2 - range1);
        return Math.ceil(result);
    }
    
    private getAgeFromRanges(value: number, parameter: string): number {
        const ranges = this.ranges[parameter];
        if (!ranges) return 0;

        for (let i = 0; i < ranges.length; i++) {
            const [min, max] = ranges[i];
            const lower = Math.min(min, max);
            const upper = Math.max(min, max);

            if (value >= lower && value <= upper) {
                const [age1, age2] = this.ageRanges[i];
                return this.interpolate(value, min, max, age1, age2);
            }
        }
        return 0;
    }
    
    public calculate(params: BiochemistryFormValues): BiochemistryCalculationResult {
        const boneDensitometryAvg = params.boneDensitometry ? (params.boneDensitometry.field1 + params.boneDensitometry.field2) / 2 : 0;

        const ages: BiochemistryPartialAges = {
            somatomedinAge: this.getAgeFromRanges(params.somatomedin || 0, 'somatomedin'),
            hba1cAge: this.getAgeFromRanges(params.hba1c || 0, 'hba1c'),
            insulinAge: this.getAgeFromRanges(params.insulin || 0, 'insulin'),
            postPrandialAge: this.getAgeFromRanges(params.postPrandial || 0, 'postPrandial'),
            tgHdlRatioAge: this.getAgeFromRanges(params.tgHdlRatio || 0, 'tgHdlRatio'),
            dheaAge: this.getAgeFromRanges(params.dhea || 0, 'dhea'),
            homocysteineAge: this.getAgeFromRanges(params.homocysteine || 0, 'homocysteine'),
            psaAge: this.getAgeFromRanges(params.psa || 0, 'psa'),
            fshAge: this.getAgeFromRanges(params.fsh || 0, 'fsh'),
            boneDensitometryAge: this.getAgeFromRanges(boneDensitometryAvg, 'boneDensitometry'),
        };
        
        const ageValues = Object.values(ages).filter(age => age > 0);
        const totalAge = ageValues.reduce((sum, age) => sum + age, 0);
        const averageAge = ageValues.length > 0 ? totalAge / ageValues.length : 0;
        
        return {
            partialAges: ages,
            biochemicalAge: Math.round(averageAge)
        };
    }
}

const BIOCHEMISTRY_KEYS: (keyof BiochemistryFormValues)[] = [
  'somatomedin', 'hba1c', 'insulin', 'postPrandial', 'tgHdlRatio', 
  'dhea', 'homocysteine', 'psa', 'fsh', 'boneDensitometry'
];

function validateAllMetricsPresent(formValues: BiochemistryFormValues) {
    for (const key of BIOCHEMISTRY_KEYS) {
        const value = formValues[key];
        if (value === undefined || value === null) {
            throw new Error(`El campo ${key} es obligatorio.`);
        }
        if (typeof value === 'object' && 'field1' in value) {
            if (value.field1 === undefined || value.field2 === undefined || isNaN(value.field1) || isNaN(value.field2)) {
                throw new Error(`Las dos dimensiones de Densitometría Ósea son obligatorias.`);
            }
        } else if (isNaN(value as number)) {
             throw new Error(`El campo ${key} debe ser un número.`);
        }
    }
}

export function calculateBioquimicaResults(
  formValues: BiochemistryFormValues,
  chronologicalAge: number
): { biochemicalAge: number; differentialAge: number; partialAges: BiochemistryPartialAges } {
  
  validateAllMetricsPresent(formValues);
  
  const calculator = new LegacyBiochemicalAgeCalculator();
  const result = calculator.calculate(formValues);

  const differentialAge = result.biochemicalAge - chronologicalAge;

  return {
    biochemicalAge: result.biochemicalAge,
    differentialAge: differentialAge,
    partialAges: result.partialAges,
  };
}
