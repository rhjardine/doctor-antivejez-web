// src/utils/biofisica-calculations.ts
import type { FormValues, PartialAges, CalculationResult } from '@/types/biophysics';
import { AGE_DIFF_RANGES } from '@/lib/constants';

// ===================================================================================
// SISTEMA PRECISO DE CÁLCULO DE EDAD BIOFÍSICA - VERSIÓN 2.0
// Implementa la lógica exacta de la tabla oficial con umbrales dobles
// y manejo preciso de valores fuera de rango, basado en la documentación.
// ===================================================================================

/**
 * Define la estructura de un rango de valores para un parámetro.
 * - `values`: El rango principal de medición.
 * - `ageIndex`: El índice del septenio de edad (0 para 21-28, 1 para 28-35, etc.).
 * - `lowerRange`: (Opcional) El rango secundario para parámetros con doble umbral.
 * - `isInverse`: (Opcional) True si un valor más alto corresponde a una edad menor.
 */
interface RangeDefinition {
    values: [number, number];
    ageIndex: number;
    lowerRange?: [number, number];
    isInverse?: boolean;
}

/**
 * Define la configuración completa para un parámetro de cálculo.
 * - `ranges`: Un array de todas las definiciones de rango para el parámetro.
 * - `extremeLowerThreshold`: El valor mínimo absoluto. Por debajo de este, se asigna la edad máxima.
 * - `extremeUpperThreshold`: El valor máximo absoluto. Por encima de este, se asigna la edad máxima (o mínima si es inverso).
 */
interface ParameterDefinition {
    ranges: RangeDefinition[];
    extremeLowerThreshold: number;
    extremeUpperThreshold: number;
}

/**
 * Calculadora Precisa de Edad Biofísica con Lógica de Doble Umbral
 */
class PreciseBiophysicalAgeCalculator {
    private readonly ageRanges: [number, number][];
    private readonly parameterDefinitions: Record<string, ParameterDefinition>;

    constructor() {
        // Los 14 septenios de edad biofísica oficiales.
        this.ageRanges = [
            [21, 28], [28, 35], [35, 42], [42, 49], [49, 56], [56, 63], [63, 70],
            [70, 77], [77, 84], [84, 91], [91, 98], [98, 105], [105, 112], [112, 120]
        ];

        // Definiciones precisas de cada parámetro, extraídas de la "Tabla de Calculo de Edad Biofísica.pdf".
        this.parameterDefinitions = {
            bodyFatMale: {
                ranges: [
                    { values: [10, 14], ageIndex: 0 }, { values: [14, 18], ageIndex: 1 },
                    { values: [18, 21], ageIndex: 2 }, { values: [21, 24], ageIndex: 3 },
                    { values: [24, 27], ageIndex: 4 }, { values: [27, 30], ageIndex: 5 },
                    { values: [30, 33], ageIndex: 6, lowerRange: [9.99, 7] },
                    { values: [33, 36], ageIndex: 7, lowerRange: [7, 6] },
                    { values: [36, 39], ageIndex: 8, lowerRange: [6, 5] },
                    { values: [39, 42], ageIndex: 9, lowerRange: [5, 4] },
                    { values: [42, 45], ageIndex: 10, lowerRange: [4, 3] },
                    { values: [45, 48], ageIndex: 11, lowerRange: [3, 2] },
                    { values: [48, 51], ageIndex: 12, lowerRange: [2, 1] },
                    { values: [51, 54], ageIndex: 13, lowerRange: [1, 0] }
                ],
                extremeLowerThreshold: 0, extremeUpperThreshold: 54
            },
            bodyFatMaleAthlete: {
                ranges: [
                    { values: [1, 7], ageIndex: 0 }, { values: [7, 14], ageIndex: 1 },
                    { values: [14, 17], ageIndex: 2 }, { values: [17, 21], ageIndex: 3 },
                    { values: [21, 25], ageIndex: 4 }, { values: [25, 28], ageIndex: 5 },
                    { values: [28, 31], ageIndex: 6 }, { values: [31, 34], ageIndex: 7 },
                    { values: [34, 37], ageIndex: 8 }, { values: [37, 40], ageIndex: 9 },
                    { values: [40, 43], ageIndex: 10 }, { values: [43, 46], ageIndex: 11 },
                    { values: [46, 49], ageIndex: 12 }, { values: [49, 52], ageIndex: 13 }
                ],
                extremeLowerThreshold: 0, extremeUpperThreshold: 52
            },
            bodyFatFemale: {
                ranges: [
                    { values: [18, 22], ageIndex: 0 }, { values: [22, 26], ageIndex: 1 },
                    { values: [26, 29], ageIndex: 2 }, { values: [29, 32], ageIndex: 3 },
                    { values: [32, 35], ageIndex: 4 }, { values: [35, 38], ageIndex: 5 },
                    { values: [38, 41], ageIndex: 6, lowerRange: [17.99, 15] },
                    { values: [41, 44], ageIndex: 7, lowerRange: [15, 14] },
                    { values: [44, 47], ageIndex: 8, lowerRange: [14, 13] },
                    { values: [47, 50], ageIndex: 9, lowerRange: [13, 12] },
                    { values: [50, 53], ageIndex: 10, lowerRange: [12, 11] },
                    { values: [53, 56], ageIndex: 11, lowerRange: [11, 10] },
                    { values: [56, 59], ageIndex: 12, lowerRange: [10, 9] },
                    { values: [59, 62], ageIndex: 13, lowerRange: [9, 8] }
                ],
                extremeLowerThreshold: 8, extremeUpperThreshold: 62
            },
            bodyFatFemaleAthlete: {
                ranges: [
                    { values: [1, 9], ageIndex: 0 }, { values: [9, 18], ageIndex: 1 },
                    { values: [18, 22], ageIndex: 2 }, { values: [22, 25], ageIndex: 3 },
                    { values: [25, 27], ageIndex: 4 }, { values: [27, 30], ageIndex: 5 },
                    { values: [30, 33], ageIndex: 6 }, { values: [33, 36], ageIndex: 7 },
                    { values: [36, 39], ageIndex: 8 }, { values: [39, 42], ageIndex: 9 },
                    { values: [42, 45], ageIndex: 10 }, { values: [45, 48], ageIndex: 11 },
                    { values: [48, 51], ageIndex: 12 }, { values: [51, 54], ageIndex: 13 }
                ],
                extremeLowerThreshold: 0, extremeUpperThreshold: 54
            },
            bmi: {
                ranges: [
                    { values: [18, 22], ageIndex: 0 }, { values: [22, 25], ageIndex: 1 },
                    { values: [25, 27], ageIndex: 2 }, { values: [27, 30], ageIndex: 3 },
                    { values: [30, 33], ageIndex: 4 }, { values: [33, 36], ageIndex: 5 },
                    { values: [36, 39], ageIndex: 6 },
                    { values: [39, 42], ageIndex: 7, lowerRange: [17.99, 16] },
                    { values: [42, 45], ageIndex: 8, lowerRange: [16, 15] },
                    { values: [45, 48], ageIndex: 9, lowerRange: [15, 14] },
                    { values: [48, 51], ageIndex: 10, lowerRange: [14, 13] },
                    { values: [51, 54], ageIndex: 11, lowerRange: [13, 12] },
                    { values: [54, 57], ageIndex: 12, lowerRange: [12, 11] },
                    { values: [57, 60], ageIndex: 13, lowerRange: [11, 10] }
                ],
                extremeLowerThreshold: 10, extremeUpperThreshold: 60
            },
            reflexes: {
                ranges: [
                    { values: [50, 45], ageIndex: 0, isInverse: true }, { values: [45, 35], ageIndex: 1, isInverse: true },
                    { values: [35, 30], ageIndex: 2, isInverse: true }, { values: [30, 25], ageIndex: 3, isInverse: true },
                    { values: [25, 20], ageIndex: 4, isInverse: true }, { values: [20, 15], ageIndex: 5, isInverse: true },
                    { values: [15, 10], ageIndex: 6, isInverse: true }, { values: [10, 8], ageIndex: 7, isInverse: true },
                    { values: [8, 6], ageIndex: 8, isInverse: true }, { values: [6, 4], ageIndex: 9, isInverse: true },
                    { values: [4, 3], ageIndex: 10, isInverse: true }, { values: [3, 2], ageIndex: 11, isInverse: true },
                    { values: [2, 1], ageIndex: 12, isInverse: true }, { values: [1, 0], ageIndex: 13, isInverse: true }
                ],
                extremeLowerThreshold: 0, extremeUpperThreshold: 50
            },
            accommodation: {
                ranges: [
                    { values: [0, 10], ageIndex: 0 }, { values: [10, 15], ageIndex: 1 },
                    { values: [15, 18], ageIndex: 2 }, { values: [18, 21], ageIndex: 3 },
                    { values: [21, 24], ageIndex: 4 }, { values: [24, 27], ageIndex: 5 },
                    { values: [27, 30], ageIndex: 6 }, { values: [30, 33], ageIndex: 7 },
                    { values: [33, 37], ageIndex: 8 }, { values: [37, 40], ageIndex: 9 },
                    { values: [40, 43], ageIndex: 10 }, { values: [43, 47], ageIndex: 11 },
                    { values: [47, 50], ageIndex: 12 }, { values: [50, 53], ageIndex: 13 }
                ],
                extremeLowerThreshold: 0, extremeUpperThreshold: 53
            },
            balance: {
                ranges: [
                    { values: [120, 30], ageIndex: 0, isInverse: true }, { values: [30, 25], ageIndex: 1, isInverse: true },
                    { values: [25, 20], ageIndex: 2, isInverse: true }, { values: [20, 15], ageIndex: 3, isInverse: true },
                    { values: [15, 12], ageIndex: 4, isInverse: true }, { values: [12, 9], ageIndex: 5, isInverse: true },
                    { values: [9, 7], ageIndex: 6, isInverse: true }, { values: [7, 6], ageIndex: 7, isInverse: true },
                    { values: [6, 5], ageIndex: 8, isInverse: true }, { values: [5, 4], ageIndex: 9, isInverse: true },
                    { values: [4, 3], ageIndex: 10, isInverse: true }, { values: [3, 2], ageIndex: 11, isInverse: true },
                    { values: [2, 1], ageIndex: 12, isInverse: true }, { values: [1, 0], ageIndex: 13, isInverse: true }
                ],
                extremeLowerThreshold: 0, extremeUpperThreshold: 120
            },
            hydration: {
                ranges: [
                    { values: [0, 1], ageIndex: 0 }, { values: [1, 2], ageIndex: 1 },
                    { values: [2, 4], ageIndex: 2 }, { values: [4, 8], ageIndex: 3 },
                    { values: [8, 16], ageIndex: 4 }, { values: [16, 32], ageIndex: 5 },
                    { values: [32, 64], ageIndex: 6 }, { values: [64, 74], ageIndex: 7 },
                    { values: [74, 84], ageIndex: 8 }, { values: [84, 94], ageIndex: 9 },
                    { values: [94, 104], ageIndex: 10 }, { values: [104, 108], ageIndex: 11 },
                    { values: [108, 112], ageIndex: 12 }, { values: [112, 120], ageIndex: 13 }
                ],
                extremeLowerThreshold: 0, extremeUpperThreshold: 120
            },
            systolic: {
                ranges: [
                    { values: [100, 110], ageIndex: 0 }, { values: [110, 120], ageIndex: 1 },
                    { values: [120, 130], ageIndex: 2, lowerRange: [99.99, 95] },
                    { values: [130, 140], ageIndex: 3, lowerRange: [95, 90] },
                    { values: [140, 150], ageIndex: 4, lowerRange: [90, 85] },
                    { values: [150, 160], ageIndex: 5, lowerRange: [85, 80] },
                    { values: [160, 170], ageIndex: 6, lowerRange: [80, 75] },
                    { values: [170, 180], ageIndex: 7, lowerRange: [75, 70] },
                    { values: [180, 190], ageIndex: 8, lowerRange: [70, 65] },
                    { values: [190, 200], ageIndex: 9, lowerRange: [65, 60] },
                    { values: [200, 210], ageIndex: 10, lowerRange: [60, 55] },
                    { values: [210, 220], ageIndex: 11, lowerRange: [55, 50] },
                    { values: [220, 230], ageIndex: 12, lowerRange: [50, 45] },
                    { values: [230, 240], ageIndex: 13, lowerRange: [45, 40] }
                ],
                extremeLowerThreshold: 40, extremeUpperThreshold: 240
            },
            diastolic: {
                ranges: [
                    { values: [60, 65], ageIndex: 0 }, { values: [65, 70], ageIndex: 1 },
                    { values: [70, 75], ageIndex: 2 }, { values: [75, 80], ageIndex: 3 },
                    { values: [80, 85], ageIndex: 4 }, { values: [85, 90], ageIndex: 5 },
                    { values: [90, 95], ageIndex: 6, lowerRange: [59.99, 57] },
                    { values: [95, 100], ageIndex: 7, lowerRange: [57, 53] },
                    { values: [100, 110], ageIndex: 8, lowerRange: [53, 50] },
                    { values: [110, 120], ageIndex: 9, lowerRange: [50, 47] },
                    { values: [120, 130], ageIndex: 10, lowerRange: [47, 44] },
                    { values: [130, 140], ageIndex: 11, lowerRange: [44, 41] },
                    { values: [140, 150], ageIndex: 12, lowerRange: [41, 38] },
                    { values: [150, 160], ageIndex: 13, lowerRange: [38, 35] }
                ],
                extremeLowerThreshold: 35, extremeUpperThreshold: 160
            }
        };
    }

    /**
     * Interpola linealmente un valor para encontrar la edad correspondiente.
     */
    private interpolate(value: number, minVal: number, maxVal: number, minAge: number, maxAge: number): number {
        if (Math.abs(maxVal - minVal) < 1e-9) return minAge; // Evita división por cero
        const ratio = (value - minVal) / (maxVal - minVal);
        return minAge + ratio * (maxAge - minAge);
    }

    /**
     * Calcula la edad para un parámetro específico, manejando la lógica de doble umbral.
     */
    private getParameterAge(value: number, paramKey: string): number {
        const definition = this.parameterDefinitions[paramKey];
        if (!definition) return 0;

        // 1. Manejo de valores extremos absolutos
        if (value < definition.extremeLowerThreshold) return 120;
        if (value > definition.extremeUpperThreshold) {
            return definition.ranges[0].isInverse ? this.ageRanges[0][0] : 120;
        }

        // 2. Búsqueda en los rangos definidos
        for (const range of definition.ranges) {
            const [min, max] = range.values;
            const [ageMin, ageMax] = this.ageRanges[range.ageIndex];

            // Comprueba el rango principal (valores altos)
            if (value >= Math.min(min, max) && value <= Math.max(min, max)) {
                return this.interpolate(value, min, max, ageMin, ageMax);
            }

            // Comprueba el rango secundario (valores bajos), si existe
            if (range.lowerRange) {
                const [lowerMin, lowerMax] = range.lowerRange;
                if (value >= Math.min(lowerMin, lowerMax) && value <= Math.max(lowerMin, lowerMax)) {
                    // La interpolación en el rango bajo es inherentemente inversa
                    return this.interpolate(value, lowerMax, lowerMin, ageMin, ageMax);
                }
            }
        }
        
        // 3. Fallback: si no cae en ningún rango, es un valor extremo
        return 120;
    }

    /**
     * Función principal que orquesta el cálculo completo.
     */
    public calculate(formValues: FormValues, gender: string, isAthlete: boolean): CalculationResult {
        const genderKey = gender.startsWith('FEMENINO') ? 'Female' : 'Male';
        const athleteKey = isAthlete ? 'Athlete' : '';
        
        const avgReflexes = ((formValues.digitalReflexes?.high || 0) + (formValues.digitalReflexes?.long || 0) + (formValues.digitalReflexes?.width || 0)) / 3;
        const avgBalance = ((formValues.staticBalance?.high || 0) + (formValues.staticBalance?.long || 0) + (formValues.staticBalance?.width || 0)) / 3;

        const partialAges: PartialAges = {
            fatAge: this.getParameterAge(formValues.fatPercentage!, `bodyFat${genderKey}${athleteKey}`),
            bmiAge: this.getParameterAge(formValues.bmi!, 'bmi'),
            reflexesAge: this.getParameterAge(avgReflexes, 'reflexes'),
            visualAge: this.getParameterAge(formValues.visualAccommodation!, 'accommodation'),
            balanceAge: this.getParameterAge(avgBalance, 'balance'),
            hydrationAge: this.getParameterAge(formValues.skinHydration!, 'hydration'),
            systolicAge: this.getParameterAge(formValues.systolicPressure!, 'systolic'),
            diastolicAge: this.getParameterAge(formValues.diastolicPressure!, 'diastolic'),
        };

        const validAges = Object.values(partialAges).filter(age => age && age > 0) as number[];
        if (validAges.length === 0) {
            return { biologicalAge: 0, differentialAge: 0, partialAges };
        }

        const biologicalAge = validAges.reduce((sum, age) => sum + age, 0) / validAges.length;
        
        // CORRECCIÓN: Se redondea el resultado final para evitar el error de -1 año.
        return { biologicalAge: Math.round(biologicalAge), differentialAge: 0, partialAges };
    }
}

/**
 * Función pública que se comunica con el resto de la aplicación.
 */
export function calculateBiofisicaResults(
    boards: any[], // Se mantiene por compatibilidad de firma, pero no se usa.
    formValues: FormValues,
    chronologicalAge: number,
    gender: string,
    isAthlete: boolean
): CalculationResult {
    const calculator = new PreciseBiophysicalAgeCalculator();
    const results = calculator.calculate(formValues, gender, isAthlete);
    
    // El diferencial se calcula aquí con el resultado ya redondeado.
    results.differentialAge = results.biologicalAge - chronologicalAge;

    return results;
}

// --- Funciones de Utilidad (sin cambios) ---
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
