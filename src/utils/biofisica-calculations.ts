/**
 * @file src/utils/biofisica-calculations.ts
 * @description Lógica de cálculo para el test de edad biológica biofísica, implementando baremos con rangos dobles.
 * @version 3.0.0 - Versión Definitiva
 * @date 2025-08-07
 */

import { FormValues, PartialAges, CalculationResult, BiophysicsTestKeys } from '@/types/biophysics';
import { Gender } from '@prisma/client';
import { AGE_DIFF_RANGES } from '@/lib/constants';

// ===================================================================================
// TIPOS E INTERFACES INTERNAS PARA EL CÁLCULO AVANZADO
// ===================================================================================

interface ParameterRange {
    upper: [number, number] | null;
    lower: [number, number] | null;
}

interface CalculationParams {
    fatPercentage: number;
    bmi: number;
    reflexes: number[];
    accommodation: number;
    balance: number[];
    hydration: number;
    systolic: number;
    diastolic: number;
    gender: 'male' | 'female';
    isAthlete: boolean;
}

interface InternalCalculationResult {
    individualAges: Partial<PartialAges>;
    biophysicalAge: number;
}

// ===================================================================================
// CLASE DE CÁLCULO AVANZADO CON LÓGICA DE BAREMOS DOBLES
// ===================================================================================

class AdvancedBiophysicalAgeCalculator {
    private readonly ageRanges: [number, number][];
    private readonly parameterRanges: Record<string, ParameterRange[]>;

    constructor() {
        this.ageRanges = [
            [21, 28], [28, 35], [35, 42], [42, 49], [49, 56], [56, 63], [63, 70],
            [70, 77], [77, 84], [84, 91], [91, 98], [98, 105], [105, 112], [112, 120]
        ];

        this.parameterRanges = {
            fatPercentageMale: [
                { upper: [10, 14], lower: null }, { upper: [14, 18], lower: null },
                { upper: [18, 21], lower: null }, { upper: [21, 24], lower: null },
                { upper: [24, 27], lower: null }, { upper: [27, 30], lower: null },
                { upper: [30, 33], lower: [9.99, 7] }, { upper: [33, 36], lower: [7, 6] },
                { upper: [36, 39], lower: [6, 5] }, { upper: [39, 42], lower: [5, 4] },
                { upper: [42, 45], lower: [4, 3] }, { upper: [45, 48], lower: [3, 2] },
                { upper: [48, 51], lower: [2, 1] }, { upper: [51, 54], lower: [1, 0] }
            ],
            fatPercentageMaleAthlete: [
                { upper: [1, 7], lower: null }, { upper: [7, 14], lower: null },
                { upper: [14, 17], lower: null }, { upper: [17, 21], lower: null },
                { upper: [21, 25], lower: null }, { upper: [25, 28], lower: null },
                { upper: [28, 31], lower: null }, { upper: [31, 34], lower: null },
                { upper: [34, 37], lower: null }, { upper: [37, 40], lower: null },
                { upper: [40, 43], lower: null }, { upper: [43, 46], lower: null },
                { upper: [46, 49], lower: null }, { upper: [49, 52], lower: null }
            ],
            fatPercentageFemale: [
                { upper: [18, 22], lower: null }, { upper: [22, 26], lower: null },
                { upper: [26, 29], lower: null }, { upper: [29, 32], lower: null },
                { upper: [32, 35], lower: null }, { upper: [35, 38], lower: null },
                { upper: [38, 41], lower: [17.99, 15] }, { upper: [41, 44], lower: [15, 14] },
                { upper: [44, 47], lower: [14, 13] }, { upper: [47, 50], lower: [13, 12] },
                { upper: [50, 53], lower: [12, 11] }, { upper: [53, 56], lower: [11, 10] },
                { upper: [56, 59], lower: [10, 9] }, { upper: [59, 62], lower: [9, 8] }
            ],
            fatPercentageFemaleAthlete: [
                { upper: [1, 9], lower: null }, { upper: [9, 18], lower: null },
                { upper: [18, 22], lower: null }, { upper: [22, 25], lower: null },
                { upper: [25, 27], lower: null }, { upper: [27, 30], lower: null },
                { upper: [30, 33], lower: null }, { upper: [33, 36], lower: null },
                { upper: [36, 39], lower: null }, { upper: [39, 42], lower: null },
                { upper: [42, 45], lower: null }, { upper: [45, 48], lower: null },
                { upper: [48, 51], lower: null }, { upper: [51, 54], lower: null }
            ],
            bmi: [
                { upper: [18, 22], lower: null }, { upper: [22, 25], lower: null },
                { upper: [25, 27], lower: null }, { upper: [27, 30], lower: null },
                { upper: [30, 33], lower: null }, { upper: [33, 36], lower: null },
                { upper: [36, 39], lower: null }, { upper: [39, 42], lower: [17.99, 16] },
                { upper: [42, 45], lower: [16, 15] }, { upper: [45, 48], lower: [15, 14] },
                { upper: [48, 51], lower: [13, 12] }, { upper: [51, 54], lower: [12, 11] },
                { upper: [54, 57], lower: [11, 10] }, { upper: [57, 60], lower: [10, 9] }
            ],
            digitalReflexes: [
                { upper: [50, 45], lower: null }, { upper: [45, 35], lower: null },
                { upper: [35, 30], lower: null }, { upper: [30, 25], lower: null },
                { upper: [25, 20], lower: null }, { upper: [20, 15], lower: null },
                { upper: [15, 10], lower: null }, { upper: [10, 8], lower: null },
                { upper: [8, 6], lower: null }, { upper: [6, 4], lower: null },
                { upper: [4, 3], lower: null }, { upper: [3, 2], lower: null },
                { upper: [2, 1], lower: null }, { upper: [1, 0], lower: null }
            ],
            visualAccommodation: [
                { upper: [0, 10], lower: null }, { upper: [10, 15], lower: null },
                { upper: [15, 18], lower: null }, { upper: [18, 21], lower: null },
                { upper: [21, 24], lower: null }, { upper: [24, 27], lower: null },
                { upper: [27, 30], lower: null }, { upper: [30, 33], lower: null },
                { upper: [33, 37], lower: null }, { upper: [37, 40], lower: null },
                { upper: [40, 43], lower: null }, { upper: [43, 47], lower: null },
                { upper: [47, 50], lower: null }, { upper: [50, 53], lower: null }
            ],
            staticBalance: [
                { upper: [120, 30], lower: null }, { upper: [30, 25], lower: null },
                { upper: [25, 20], lower: null }, { upper: [20, 15], lower: null },
                { upper: [15, 12], lower: null }, { upper: [12, 9], lower: null },
                { upper: [9, 7], lower: null }, { upper: [7, 6], lower: null },
                { upper: [6, 5], lower: null }, { upper: [5, 4], lower: null },
                { upper: [4, 3], lower: null }, { upper: [3, 2], lower: null },
                { upper: [2, 1], lower: null }, { upper: [1, 0], lower: null }
            ],
            skinHydration: [
                { upper: [0, 1], lower: null }, { upper: [1, 2], lower: null },
                { upper: [2, 4], lower: null }, { upper: [4, 8], lower: null },
                { upper: [8, 16], lower: null }, { upper: [16, 32], lower: null },
                { upper: [32, 64], lower: null }, { upper: [64, 74], lower: null },
                { upper: [74, 84], lower: null }, { upper: [84, 94], lower: null },
                { upper: [94, 104], lower: null }, { upper: [104, 108], lower: null },
                { upper: [108, 112], lower: null }, { upper: [112, 120], lower: null }
            ],
            systolicPressure: [
                { upper: [100, 110], lower: null }, { upper: [110, 120], lower: null },
                { upper: [120, 130], lower: [99.99, 95] }, { upper: [130, 140], lower: [95, 90] },
                { upper: [140, 150], lower: [90, 85] }, { upper: [150, 160], lower: [85, 80] },
                { upper: [160, 170], lower: [80, 75] }, { upper: [170, 180], lower: [75, 70] },
                { upper: [180, 190], lower: [70, 65] }, { upper: [190, 200], lower: [65, 60] },
                { upper: [200, 210], lower: [60, 55] }, { upper: [210, 220], lower: [55, 50] },
                { upper: [220, 230], lower: [50, 45] }, { upper: [230, 240], lower: [45, 40] }
            ],
            diastolicPressure: [
                { upper: [60, 65], lower: null }, { upper: [65, 70], lower: null },
                { upper: [70, 75], lower: null }, { upper: [75, 80], lower: null },
                { upper: [80, 85], lower: null }, { upper: [85, 90], lower: null },
                { upper: [90, 95], lower: [59.99, 57] }, { upper: [95, 100], lower: [57, 53] },
                { upper: [100, 110], lower: [53, 50] }, { upper: [110, 120], lower: [50, 47] },
                { upper: [120, 130], lower: [47, 44] }, { upper: [130, 140], lower: [44, 41] },
                { upper: [140, 150], lower: [41, 38] }, { upper: [150, 160], lower: [38, 35] }
            ]
        };
    }

    private interpolateLinear(value: number, range1: number, range2: number, age1: number, age2: number): number {
        if (Math.abs(range1 - range2) < 0.001) return age1;
        const ratio = (value - range1) / (range2 - range1);
        const result = age1 + ratio * (age2 - age1);
        return Math.ceil(result);
    }

    private calculateParameterAge(value: number, parameter: BiophysicsTestKeys, isAthlete: boolean, gender: 'male' | 'female'): number {
        let paramKey = parameter as string;
        if (parameter === 'fatPercentage') {
            if (gender === 'male') {
                paramKey = isAthlete ? 'fatPercentageMaleAthlete' : 'fatPercentageMale';
            } else {
                paramKey = isAthlete ? 'fatPercentageFemaleAthlete' : 'fatPercentageFemale';
            }
        }

        const ranges = this.parameterRanges[paramKey];
        if (!ranges) {
            console.warn(`Parámetro no encontrado: ${paramKey}`);
            return 0;
        }

        for (let i = 0; i < ranges.length; i++) {
            const range = ranges[i];
            const [ageMin, ageMax] = this.ageRanges[i];

            if (range.upper) {
                const [upperMin, upperMax] = range.upper;
                const lowerBound = Math.min(upperMin, upperMax);
                const upperBound = Math.max(upperMin, upperMax);
                if (value >= lowerBound && value <= upperBound) {
                    return this.interpolateLinear(value, upperMin, upperMax, ageMin, ageMax);
                }
            }

            if (range.lower) {
                const [lowerMin, lowerMax] = range.lower;
                const lowerBound = Math.min(lowerMin, lowerMax);
                const upperBound = Math.max(lowerMin, lowerMax);
                if (value >= lowerBound && value <= upperBound) {
                    return this.interpolateLinear(value, lowerMax, lowerMin, ageMin, ageMax);
                }
            }
        }

        return this.handleOutOfRangeValue(value, paramKey);
    }

    private handleOutOfRangeValue(value: number, parameter: string): number {
        const ranges = this.parameterRanges[parameter];
        if (!ranges || ranges.length === 0) return 0;

        const firstRange = ranges[0].upper;
        if (firstRange) {
            const firstMin = Math.min(firstRange[0], firstRange[1]);
            if (value < firstMin) {
                return this.ageRanges[0][0];
            }
        }

        const lastRange = ranges[ranges.length - 1].upper;
        if (lastRange) {
            const lastMax = Math.max(lastRange[0], lastRange[1]);
            if (value > lastMax) {
                return this.ageRanges[this.ageRanges.length - 1][1];
            }
        }
        return 0;
    }

    private calculateAverage(values: number[]): number {
        if (values.length === 0) return 0;
        const sum = values.reduce((acc, val) => acc + val, 0);
        return sum / values.length;
    }

    public calculate(params: CalculationParams): InternalCalculationResult {
        const avgReflexes = this.calculateAverage(params.reflexes);
        const avgBalance = this.calculateAverage(params.balance);

        const individualAges: Partial<PartialAges> = {
            fatAge: this.calculateParameterAge(params.fatPercentage, 'fatPercentage', params.isAthlete, params.gender),
            bmiAge: this.calculateParameterAge(params.bmi, 'bmi', params.isAthlete, params.gender),
            reflexesAge: this.calculateParameterAge(avgReflexes, 'digitalReflexes', params.isAthlete, params.gender),
            visualAge: this.calculateParameterAge(params.accommodation, 'visualAccommodation', params.isAthlete, params.gender),
            balanceAge: this.calculateParameterAge(avgBalance, 'staticBalance', params.isAthlete, params.gender),
            hydrationAge: this.calculateParameterAge(params.hydration, 'skinHydration', params.isAthlete, params.gender),
            systolicAge: this.calculateParameterAge(params.systolic, 'systolicPressure', params.isAthlete, params.gender),
            diastolicAge: this.calculateParameterAge(params.diastolic, 'diastolicPressure', params.isAthlete, params.gender)
        };

        const validAges = Object.values(individualAges).filter(age => age && age > 0) as number[];
        if (validAges.length === 0) {
            throw new Error('No se pudieron calcular edades válidas para ningún parámetro');
        }

        const totalAge = validAges.reduce((sum, age) => sum + age, 0);
        const averageAge = totalAge / validAges.length;

        return {
            individualAges,
            biophysicalAge: Math.round(averageAge),
        };
    }
}

// ===================================================================================
// FUNCIONES PÚBLICAS Y DE SOPORTE
// ===================================================================================

function validateFormValues(formValues: FormValues): void {
    const requiredFields: BiophysicsTestKeys[] = [
        'fatPercentage', 'bmi', 'digitalReflexes', 'visualAccommodation',
        'staticBalance', 'skinHydration', 'systolicPressure', 'diastolicPressure'
    ];

    for (const field of requiredFields) {
        const value = formValues[field];
        if (field === 'digitalReflexes' || field === 'staticBalance') {
            const dimensionalValue = value as { high?: number; long?: number; width?: number; };
            if (!dimensionalValue || typeof dimensionalValue.high !== 'number' || typeof dimensionalValue.long !== 'number' || typeof dimensionalValue.width !== 'number') {
                throw new Error(`El campo ${field} requiere valores numéricos para alto, largo y ancho`);
            }
        } else {
            if (typeof value !== 'number' || isNaN(value)) {
                throw new Error(`El campo ${field} debe ser un número válido`);
            }
        }
    }
}

export function calculateBiophysicalTestResults(
    formValues: FormValues,
    gender: Gender,
    chronologicalAge: number
): CalculationResult {
    validateFormValues(formValues);

    const calculator = new AdvancedBiophysicalAgeCalculator();

    const params: CalculationParams = {
        fatPercentage: formValues.fatPercentage!,
        bmi: formValues.bmi!,
        reflexes: [formValues.digitalReflexes!.high!, formValues.digitalReflexes!.long!, formValues.digitalReflexes!.width!],
        accommodation: formValues.visualAccommodation!,
        balance: [formValues.staticBalance!.high!, formValues.staticBalance!.long!, formValues.staticBalance!.width!],
        hydration: formValues.skinHydration!,
        systolic: formValues.systolicPressure!,
        diastolic: formValues.diastolicPressure!,
        gender: gender.startsWith('FEMENINO') ? 'female' : 'male',
        isAthlete: gender.includes('DEPORTIVO')
    };

    const result = calculator.calculate(params);
    const differentialAge = result.biophysicalAge - chronologicalAge;

    return {
        biologicalAge: result.biophysicalAge,
        differentialAge: differentialAge,
        partialAges: result.individualAges
    };
}

export function getAgeStatus(differentialAge: number): 'REJUVENECIDO' | 'NORMAL' | 'ENVEJECIDO' {
    if (differentialAge <= AGE_DIFF_RANGES.NORMAL_MIN) return 'REJUVENECIDO';
    if (differentialAge > AGE_DIFF_RANGES.NORMAL_MIN && differentialAge < AGE_DIFF_RANGES.NORMAL_MAX) return 'NORMAL';
    return 'ENVEJECIDO';
}

export function getStatusColor(status: 'REJUVENECIDO' | 'NORMAL' | 'ENVEJECIDO'): string {
    const colorMap = {
        REJUVENECIDO: 'text-status-green',
        NORMAL: 'text-status-yellow',
        ENVEJECIDO: 'text-status-red',
    };
    return colorMap[status];
}
