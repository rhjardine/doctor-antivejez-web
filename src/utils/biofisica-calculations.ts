
// src/utils/biofisica-calculations.ts
import type { FormValues, PartialAges, CalculationResult, BiophysicsResult } from '@/types/biophysics';
import { AGE_DIFF_RANGES } from '@/lib/constants';

// ===================================================================================
// SISTEMA PRECISO DE CÁLCULO DE EDAD BIOFÍSICA - VERSIÓN CORREGIDA
// Implementa la lógica exacta de la tabla oficial con umbrales dobles
// y manejo preciso de valores fuera de rango
// ===================================================================================

/**
 * Calculadora Precisa de Edad Biofísica con Umbrales Dobles
 */
class PreciseBiophysicalAgeCalculator {
    private readonly ageRanges: [number, number][];
    private readonly parameterDefinitions: Record<string, ParameterDefinition>;

    constructor() {
        // 14 rangos de edad biofísica oficiales
        this.ageRanges = [
            [21, 28], [28, 35], [35, 42], [42, 49], [49, 56], [56, 63], [63, 70],
            [70, 77], [77, 84], [84, 91], [91, 98], [98, 105], [105, 112], [112, 120]
        ];

        // Definiciones precisas basadas en tabla oficial
        this.parameterDefinitions = {
            // % Grasa Masculino (no deportivo)
            bodyFatMale: {
                ranges: [
                    { values: [10, 14], ageIndex: 0 },
                    { values: [14, 18], ageIndex: 1 },
                    { values: [18, 21], ageIndex: 2 },
                    { values: [21, 24], ageIndex: 3 },
                    { values: [24, 27], ageIndex: 4 },
                    { values: [27, 30], ageIndex: 5 },
                    { values: [30, 33], ageIndex: 6, lowerRange: [9.99, 7] },
                    { values: [33, 36], ageIndex: 7, lowerRange: [7, 6] },
                    { values: [36, 39], ageIndex: 8, lowerRange: [6, 5] },
                    { values: [39, 42], ageIndex: 9, lowerRange: [5, 4] },
                    { values: [42, 45], ageIndex: 10, lowerRange: [4, 3] },
                    { values: [45, 48], ageIndex: 11, lowerRange: [3, 2] },
                    { values: [48, 51], ageIndex: 12, lowerRange: [2, 1] },
                    { values: [51, 54], ageIndex: 13, lowerRange: [1, 0] }
                ],
                extremeLowerThreshold: 0,
                extremeUpperThreshold: 54
            },

            // % Grasa Masculino Deportivo
            bodyFatMaleAthlete: {
                ranges: [
                    { values: [1, 7], ageIndex: 0 },
                    { values: [7, 14], ageIndex: 1 },
                    { values: [14, 17], ageIndex: 2 },
                    { values: [17, 21], ageIndex: 3 },
                    { values: [21, 25], ageIndex: 4 },
                    { values: [25, 28], ageIndex: 5 },
                    { values: [28, 31], ageIndex: 6 },
                    { values: [31, 34], ageIndex: 7 },
                    { values: [34, 37], ageIndex: 8 },
                    { values: [37, 40], ageIndex: 9 },
                    { values: [40, 43], ageIndex: 10 },
                    { values: [43, 46], ageIndex: 11 },
                    { values: [46, 49], ageIndex: 12 },
                    { values: [49, 52], ageIndex: 13 }
                ],
                extremeLowerThreshold: 0,
                extremeUpperThreshold: 52
            },

            // % Grasa Femenino (no deportivo) - CON RANGOS DOBLES CRÍTICOS
            bodyFatFemale: {
                ranges: [
                    { values: [18, 22], ageIndex: 0 },
                    { values: [22, 26], ageIndex: 1 },
                    { values: [26, 29], ageIndex: 2 },
                    { values: [29, 32], ageIndex: 3 },
                    { values: [32, 35], ageIndex: 4 },
                    { values: [35, 38], ageIndex: 5 },
                    { values: [38, 41], ageIndex: 6, lowerRange: [17.99, 15] },
                    { values: [41, 44], ageIndex: 7, lowerRange: [15, 14] },
                    { values: [44, 47], ageIndex: 8, lowerRange: [14, 13] },
                    { values: [47, 50], ageIndex: 9, lowerRange: [13, 12] },
                    { values: [50, 53], ageIndex: 10, lowerRange: [12, 11] },
                    { values: [53, 56], ageIndex: 11, lowerRange: [11, 10] },
                    { values: [56, 59], ageIndex: 12, lowerRange: [10, 9] },
                    { values: [59, 62], ageIndex: 13, lowerRange: [9, 8] }
                ],
                extremeLowerThreshold: 8, // Valores <8 → 120 años
                extremeUpperThreshold: 62 // Valores >62 → 120 años
            },

            // % Grasa Femenino Deportivo  
            bodyFatFemaleAthlete: {
                ranges: [
                    { values: [1, 9], ageIndex: 0 },
                    { values: [9, 18], ageIndex: 1 },
                    { values: [18, 22], ageIndex: 2 },
                    { values: [22, 25], ageIndex: 3 },
                    { values: [25, 27], ageIndex: 4 },
                    { values: [27, 30], ageIndex: 5 },
                    { values: [30, 33], ageIndex: 6 },
                    { values: [33, 36], ageIndex: 7 },
                    { values: [36, 39], ageIndex: 8 },
                    { values: [39, 42], ageIndex: 9 },
                    { values: [42, 45], ageIndex: 10 },
                    { values: [45, 48], ageIndex: 11 },
                    { values: [48, 51], ageIndex: 12 },
                    { values: [51, 54], ageIndex: 13 }
                ],
                extremeLowerThreshold: 0,
                extremeUpperThreshold: 54
            },

            // IMC - CON RANGOS DOBLES CRÍTICOS
            bmi: {
                ranges: [
                    { values: [18, 22], ageIndex: 0 },
                    { values: [22, 25], ageIndex: 1 },
                    { values: [25, 27], ageIndex: 2 },
                    { values: [27, 30], ageIndex: 3 },
                    { values: [30, 33], ageIndex: 4 },
                    { values: [33, 36], ageIndex: 5 },
                    { values: [36, 39], ageIndex: 6 },
                    { values: [39, 42], ageIndex: 7, lowerRange: [17.99, 16] },
                    { values: [42, 45], ageIndex: 8, lowerRange: [16, 15] },
                    { values: [45, 48], ageIndex: 9, lowerRange: [15, 14] },
                    { values: [48, 51], ageIndex: 10, lowerRange: [14, 13] },
                    { values: [51, 54], ageIndex: 11, lowerRange: [13, 12] },
                    { values: [54, 57], ageIndex: 12, lowerRange: [12, 11] },
                    { values: [57, 60], ageIndex: 13, lowerRange: [11, 10] }
                ],
                extremeLowerThreshold: 10, // Valores <10 → 120 años
                extremeUpperThreshold: 60  // Valores >60 → 120 años
            },

            // Reflejos digitales (lógica inversa)
            reflexes: {
                ranges: [
                    { values: [50, 45], ageIndex: 0, isInverse: true },
                    { values: [45, 35], ageIndex: 1, isInverse: true },
                    { values: [35, 30], ageIndex: 2, isInverse: true },
                    { values: [30, 25], ageIndex: 3, isInverse: true },
                    { values: [25, 20], ageIndex: 4, isInverse: true },
                    { values: [20, 15], ageIndex: 5, isInverse: true },
                    { values: [15, 10], ageIndex: 6, isInverse: true },
                    { values: [10, 8], ageIndex: 7, isInverse: true },
                    { values: [8, 6], ageIndex: 8, isInverse: true },
                    { values: [6, 4], ageIndex: 9, isInverse: true },
                    { values: [4, 3], ageIndex: 10, isInverse: true },
                    { values: [3, 2], ageIndex: 11, isInverse: true },
                    { values: [2, 1], ageIndex: 12, isInverse: true },
                    { values: [1, 0], ageIndex: 13, isInverse: true }
                ],
                extremeLowerThreshold: 0,   // Valores <0 → 120 años
                extremeUpperThreshold: 50   // Valores >50 → 21 años
            },

            // Acomodación visual
            accommodation: {
                ranges: [
                    { values: [0, 10], ageIndex: 0 },
                    { values: [10, 15], ageIndex: 1 },
                    { values: [15, 18], ageIndex: 2 },
                    { values: [18, 21], ageIndex: 3 },
                    { values: [21, 24], ageIndex: 4 },
                    { values: [24, 27], ageIndex: 5 },
                    { values: [27, 30], ageIndex: 6 },
                    { values: [30, 33], ageIndex: 7 },
                    { values: [33, 37], ageIndex: 8 },
                    { values: [37, 40], ageIndex: 9 },
                    { values: [40, 43], ageIndex: 10 },
                    { values: [43, 47], ageIndex: 11 },
                    { values: [47, 50], ageIndex: 12 },
                    { values: [50, 53], ageIndex: 13 }
                ],
                extremeLowerThreshold: 0,
                extremeUpperThreshold: 53
            },

            // Balance estático (lógica inversa)
            balance: {
                ranges: [
                    { values: [120, 30], ageIndex: 0, isInverse: true },
                    { values: [30, 25], ageIndex: 1, isInverse: true },
                    { values: [25, 20], ageIndex: 2, isInverse: true },
                    { values: [20, 15], ageIndex: 3, isInverse: true },
                    { values: [15, 12], ageIndex: 4, isInverse: true },
                    { values: [12, 9], ageIndex: 5, isInverse: true },
                    { values: [9, 7], ageIndex: 6, isInverse: true },
                    { values: [7, 6], ageIndex: 7, isInverse: true },
                    { values: [6, 5], ageIndex: 8, isInverse: true },
                    { values: [5, 4], ageIndex: 9, isInverse: true },
                    { values: [4, 3], ageIndex: 10, isInverse: true },
                    { values: [3, 2], ageIndex: 11, isInverse: true },
                    { values: [2, 1], ageIndex: 12, isInverse: true },
                    { values: [1, 0], ageIndex: 13, isInverse: true }
                ],
                extremeLowerThreshold: 0,   // Valores <0 → 120 años
                extremeUpperThreshold: 120  // Valores >120 → 21 años
            },

            // Hidratación cutánea
            hydration: {
                ranges: [
                    { values: [0, 1], ageIndex: 0 },
                    { values: [1, 2], ageIndex: 1 },
                    { values: [2, 4], ageIndex: 2 },
                    { values: [4, 8], ageIndex: 3 },
                    { values: [8, 16], ageIndex: 4 },
                    { values: [16, 32], ageIndex: 5 },
                    { values: [32, 64], ageIndex: 6 },
                    { values: [64, 74], ageIndex: 7 },
                    { values: [74, 84], ageIndex: 8 },
                    { values: [84, 94], ageIndex: 9 },
                    { values: [94, 104], ageIndex: 10 },
                    { values: [104, 108], ageIndex: 11 },
                    { values: [108, 112], ageIndex: 12 },
                    { values: [112, 120], ageIndex: 13 }
                ],
                extremeLowerThreshold: 0,
                extremeUpperThreshold: 120
            },

            // Tensión arterial sistólica - CON RANGOS DOBLES
            systolic: {
                ranges: [
                    { values: [100, 110], ageIndex: 0 },
                    { values: [110, 120], ageIndex: 1 },
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
                extremeLowerThreshold: 40,  // Valores <40 → 120 años
                extremeUpperThreshold: 240  // Valores >240 → 120 años
            },

            // Tensión arterial diastólica - CON RANGOS DOBLES
            diastolic: {
                ranges: [
                    { values: [60, 65], ageIndex: 0 },
                    { values: [65, 70], ageIndex: 1 },
                    { values: [70, 75], ageIndex: 2 },
                    { values: [75, 80], ageIndex: 3 },
                    { values: [80, 85], ageIndex: 4 },
                    { values: [85, 90], ageIndex: 5 },
                    { values: [90, 95], ageIndex: 6, lowerRange: [59.99, 57] },
                    { values: [95, 100], ageIndex: 7, lowerRange: [57, 53] },
                    { values: [100, 110], ageIndex: 8, lowerRange: [53, 50] },
                    { values: [110, 120], ageIndex: 9, lowerRange: [50, 47] },
                    { values: [120, 130], ageIndex: 10, lowerRange: [47, 44] },
                    { values: [130, 140], ageIndex: 11, lowerRange: [44, 41] },
                    { values: [140, 150], ageIndex: 12, lowerRange: [41, 38] },
                    { values: [150, 160], ageIndex: 13, lowerRange: [38, 35] }
                ],
                extremeLowerThreshold: 35,  // Valores <35 → 120 años
                extremeUpperThreshold: 160  // Valores >160 → 120 años
            }
        };
    }

    /**
     * Interpola linealmente entre dos valores
     */
    private interpolateLinear(value: number, min: number, max: number, ageMin: number, ageMax: number): number {
        if (Math.abs(max - min) < 0.001) return ageMin;

        const ratio = (value - min) / (max - min);
        const result = ageMin + ratio * (ageMax - ageMin);

        return Math.round(result);
    }

    /**
     * Calcula la edad para un parámetro específico con lógica precisa de umbrales
     */
    private calculateParameterAge(value: number, parameter: string, isAthlete: boolean = false, gender: 'male' | 'female' = 'male'): number {
        // Determinar parámetro correcto
        let paramKey = parameter;
        if (parameter === 'bodyFat') {
            if (gender === 'male') {
                paramKey = isAthlete ? 'bodyFatMaleAthlete' : 'bodyFatMale';
            } else {
                paramKey = isAthlete ? 'bodyFatFemaleAthlete' : 'bodyFatFemale';
            }
        }

        const definition = this.parameterDefinitions[paramKey];
        if (!definition) {
            console.warn(`Parámetro no encontrado: ${paramKey}`);
            return 0;
        }

        // 🟠 VERIFICACIÓN DE UMBRALES EXTREMOS PRIMERO
        if (value < definition.extremeLowerThreshold) {
            return 120; // Edad máxima para valores extremadamente bajos
        }

        if (value > definition.extremeUpperThreshold) {
            // Para parámetros con lógica inversa, valor alto = edad baja
            if (definition.ranges[0].isInverse) {
                return this.ageRanges[0][0]; // 21 años
            }
            return 120; // Edad máxima para valores extremadamente altos
        }

        // Buscar en rangos definidos
        for (const range of definition.ranges) {
            const [min, max] = range.values;
            const [ageMin, ageMax] = this.ageRanges[range.ageIndex];

            // Verificar rango principal (superior)
            const lowerBound = Math.min(min, max);
            const upperBound = Math.max(min, max);

            if (value >= lowerBound && value <= upperBound) {
                if (range.isInverse) {
                    // Lógica inversa: valor alto = edad baja
                    return this.interpolateLinear(value, max, min, ageMin, ageMax);
                } else {
                    // Lógica normal: valor alto = edad alta
                    return this.interpolateLinear(value, min, max, ageMin, ageMax);
                }
            }

            // Verificar rango inferior si existe
            if (range.lowerRange) {
                const [lowerMin, lowerMax] = range.lowerRange;
                const lowerRangeBound = Math.min(lowerMin, lowerMax);
                const upperRangeBound = Math.max(lowerMin, lowerMax);

                if (value >= lowerRangeBound && value <= upperRangeBound) {
                    // Los rangos inferiores tienen lógica inversa por naturaleza
                    return this.interpolateLinear(value, lowerMax, lowerMin, ageMin, ageMax);
                }
            }
        }

        // Si no se encuentra en ningún rango, es un valor extremo
        return 120;
    }

    /**
     * Calcula el promedio de múltiples valores
     */
    private calculateAverage(values: number[]): number {
        if (values.length === 0) return 0;
        const sum = values.reduce((acc, val) => acc + val, 0);
        return sum / values.length;
    }

    /**
     * Función principal de cálculo
     */
    public calculate(params: CalculationParams): BiophysicalCalculationResult {
        const isAthlete = params.gender.includes('DEPORTIVO');
        const gender = params.gender.startsWith('FEMENINO') ? 'female' : 'male';

        // Calcular promedios para parámetros multidimensionales
        const avgReflexes = this.calculateAverage(params.reflexes);
        const avgBalance = this.calculateAverage(params.balance);

        // Calcular edades individuales con lógica precisa
        const individualAges = {
            bodyFat: this.calculateParameterAge(params.bodyFat, 'bodyFat', isAthlete, gender),
            bmi: this.calculateParameterAge(params.bmi, 'bmi', isAthlete, gender),
            reflexes: this.calculateParameterAge(avgReflexes, 'reflexes'),
            accommodation: this.calculateParameterAge(params.accommodation, 'accommodation'),
            balance: this.calculateParameterAge(avgBalance, 'balance'),
            hydration: this.calculateParameterAge(params.hydration, 'hydration'),
            systolic: this.calculateParameterAge(params.systolic, 'systolic'),
            diastolic: this.calculateParameterAge(params.diastolic, 'diastolic')
        };

        // Filtrar edades válidas (no cero)
        const validAges = Object.values(individualAges).filter(age => age > 0);

        if (validAges.length === 0) {
            throw new Error('No se pudieron calcular edades válidas para ningún parámetro');
        }

        // Calcular promedio de edad biofísica
        const totalAge = validAges.reduce((sum, age) => sum + age, 0);
        const averageAge = totalAge / validAges.length;

        return {
            individualAges,
            biophysicalAge: Math.round(averageAge),
            validParametersCount: validAges.length
        };
    }
}

// ===================================================================================
// TIPOS E INTERFACES PRECISAS
// ===================================================================================

interface RangeDefinition {
    values: [number, number];
    ageIndex: number;
    lowerRange?: [number, number];
    isInverse?: boolean;
}

interface ParameterDefinition {
    ranges: RangeDefinition[];
    extremeLowerThreshold: number;
    extremeUpperThreshold: number;
}

interface CalculationParams {
    bodyFat: number;
    bmi: number;
    reflexes: number[];
    accommodation: number;
    balance: number[];
    hydration: number;
    systolic: number;
    diastolic: number;
    gender: string;
}

interface BiophysicalCalculationResult {
    individualAges: {
        bodyFat: number;
        bmi: number;
        reflexes: number;
        accommodation: number;
        balance: number;
        hydration: number;
        systolic: number;
        diastolic: number;
    };
    biophysicalAge: number;
    validParametersCount: number;
}

// ===================================================================================
// FUNCIONES PÚBLICAS DE LA API
// ===================================================================================

export function calculateBiophysicalTestResults(
    formValues: FormValues,
    gender: string
): BiophysicsResult[] {
    validateFormValues(formValues);

    const calculator = new PreciseBiophysicalAgeCalculator();

    const params: CalculationParams = {
        bodyFat: formValues.fatPercentage!,
        bmi: formValues.bmi!,
        reflexes: [
            formValues.digitalReflexes!.high!,
            formValues.digitalReflexes!.long!,
            formValues.digitalReflexes!.width!
        ],
        accommodation: formValues.visualAccommodation!,
        balance: [
            formValues.staticBalance!.high!,
            formValues.staticBalance!.long!,
            formValues.staticBalance!.width!
        ],
        hydration: formValues.skinHydration!,
        systolic: formValues.systolicPressure!,
        diastolic: formValues.diastolicPressure!,
        gender: gender
    };

    const result = calculator.calculate(params);

    // 📝 NOTA: PULSO EXCLUIDO SEGÚN ESPECIFICACIONES
    const biophysicsResults: BiophysicsResult[] = [
        { parameter: 'fatPercentage', value: params.bodyFat, biologicalAge: result.individualAges.bodyFat, score: 0 },
        { parameter: 'bmi', value: params.bmi, biologicalAge: result.individualAges.bmi, score: 0 },
        { parameter: 'digitalReflexes', value: params.reflexes, biologicalAge: result.individualAges.reflexes, score: 0 },
        { parameter: 'visualAccommodation', value: params.accommodation, biologicalAge: result.individualAges.accommodation, score: 0 },
        { parameter: 'staticBalance', value: params.balance, biologicalAge: result.individualAges.balance, score: 0 },
        { parameter: 'skinHydration', value: params.hydration, biologicalAge: result.individualAges.hydration, score: 0 },
        { parameter: 'systolicPressure', value: params.systolic, biologicalAge: result.individualAges.systolic, score: 0 },
        { parameter: 'diastolicPressure', value: params.diastolic, biologicalAge: result.individualAges.diastolic, score: 0 }
    ];

    return biophysicsResults;
}

export function calculateBiofisicaResults(
    boards: any[],
    formValues: FormValues,
    chronologicalAge: number,
    gender: string,
    isAthlete: boolean
): CalculationResult {
    validateFormValues(formValues);

    const calculator = new PreciseBiophysicalAgeCalculator();

    const params: CalculationParams = {
        bodyFat: formValues.fatPercentage!,
        bmi: formValues.bmi!,
        reflexes: [
            formValues.digitalReflexes!.high!,
            formValues.digitalReflexes!.long!,
            formValues.digitalReflexes!.width!
        ],
        accommodation: formValues.visualAccommodation!,
        balance: [
            formValues.staticBalance!.high!,
            formValues.staticBalance!.long!,
            formValues.staticBalance!.width!
        ],
        hydration: formValues.skinHydration!,
        systolic: formValues.systolicPressure!,
        diastolic: formValues.diastolicPressure!,
        gender: gender
    };

    const result = calculator.calculate(params);

    const partialAges: PartialAges = {
        fatAge: result.individualAges.bodyFat,
        bmiAge: result.individualAges.bmi,
        reflexesAge: result.individualAges.reflexes,
        visualAge: result.individualAges.accommodation,
        balanceAge: result.individualAges.balance,
        hydrationAge: result.individualAges.hydration,
        systolicAge: result.individualAges.systolic,
        diastolicAge: result.individualAges.diastolic
    };

    const differentialAge = result.biophysicalAge - chronologicalAge;

    return {
        biologicalAge: result.biophysicalAge,
        differentialAge: differentialAge,
        partialAges: partialAges
    };
}

// ===================================================================================
// VALIDACIÓN Y UTILIDADES
// ===================================================================================

function validateFormValues(formValues: FormValues): void {
    const requiredFields = [
        'fatPercentage', 'bmi', 'digitalReflexes', 'visualAccommodation',
        'staticBalance', 'skinHydration', 'systolicPressure', 'diastolicPressure'
    ];

    for (const field of requiredFields) {
        const value = formValues[field as keyof FormValues];

        if (field === 'digitalReflexes' || field === 'staticBalance') {
            const dimensionalValue = value as { high?: number; long?: number; width?: number; };
            if (!dimensionalValue || 
                typeof dimensionalValue.high !== 'number' || 
                typeof dimensionalValue.long !== 'number' || 
                typeof dimensionalValue.width !== 'number') {
                throw new Error(`El campo ${field} requiere valores numéricos para alto, largo y ancho`);
            }
        } else {
            if (typeof value !== 'number' || isNaN(value)) {
                throw new Error(`El campo ${field} debe ser un número válido`);
            }
        }
    }
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

export { PreciseBiophysicalAgeCalculator };
export type { CalculationParams, BiophysicalCalculationResult, ParameterDefinition, RangeDefinition };
