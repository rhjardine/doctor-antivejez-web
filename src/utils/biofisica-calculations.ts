// src/utils/biofisica-calculations.ts

import { BoardWithRanges, FormValues, CalculationResult, PartialAges } from '@/types/biophysics';

// ===================================================================================
// INICIO: Adaptación directa de la lógica de cálculo del sistema legado
// Esta clase interna contiene la lógica exacta proporcionada por el usuario para asegurar la precisión.
// No se exporta ni se usa directamente en otros lugares de la aplicación.
// ===================================================================================

class LegacyBiophysicalAgeCalculator {
    private ageRanges: number[];
    private ranges: Record<string, number[][]>;

    constructor() {
        // Rangos de edad para cada parámetro según la tabla
        this.ageRanges = [21, 28, 35, 42, 49, 56, 63, 70, 77, 84, 91, 98, 105, 112];
        
        // Tablas de rangos para cada parámetro (hardcoded para replicar la lógica exacta)
        this.ranges = {
            bodyFatFemale: [[18, 22], [22, 26], [26, 29], [29, 32], [32, 35], [35, 38], [38, 41], [41, 44], [44, 47], [47, 50], [50, 53], [53, 56], [56, 59], [59, 62]],
            bodyFatMale: [[10, 14], [14, 18], [18, 21], [21, 24], [24, 27], [27, 30], [30, 33], [33, 36], [36, 39], [39, 42], [42, 45], [45, 48], [48, 51], [51, 54]],
            bmi: [[18, 22], [22, 25], [25, 27], [27, 30], [30, 33], [33, 36], [36, 39], [39, 42], [42, 45], [45, 48], [48, 51], [51, 54], [54, 57], [57, 60]],
            reflexes: [[50, 45], [45, 35], [35, 30], [30, 25], [25, 20], [20, 15], [15, 10], [10, 8], [8, 6], [6, 4], [4, 3], [3, 2], [2, 1], [1, 0]],
            accommodation: [[0, 10], [10, 15], [15, 18], [18, 21], [21, 24], [24, 27], [27, 30], [30, 33], [33, 37], [37, 40], [40, 43], [43, 47], [47, 50], [50, 53]],
            balance: [[120, 30], [30, 25], [25, 20], [20, 15], [15, 12], [12, 9], [9, 7], [7, 6], [6, 5], [5, 4], [4, 3], [3, 2], [2, 1], [1, 0]],
            hydration: [[0, 1], [1, 2], [2, 4], [4, 8], [8, 16], [16, 32], [32, 64], [64, 74], [74, 84], [84, 94], [94, 104], [104, 108], [108, 112], [112, 120]],
            systolic: [[100, 110], [110, 120], [120, 130], [130, 140], [140, 150], [150, 160], [160, 170], [170, 180], [180, 190], [190, 200], [200, 210], [210, 220], [220, 230], [230, 240]],
            diastolic: [[60, 65], [65, 70], [70, 75], [75, 80], [80, 85], [85, 90], [90, 95], [95, 100], [100, 110], [110, 120], [120, 130], [130, 140], [140, 150], [150, 160]]
        };
    }

    private interpolate(value: number, range1: number, range2: number, age1: number, age2: number): number {
        if (range1 === range2) return age1;
        const result = age1 + (value - range1) * (age2 - age1) / (range2 - range1);
        return Math.trunc(result); // Truncar para coincidir con el sistema legado
    }
    
    private getAgeFromRanges(value: number, parameter: string): number {
        const ranges = this.ranges[parameter];
        if (!ranges) return 0;

        for (let i = 0; i < ranges.length; i++) {
            const [min, max] = ranges[i];
            const lower = Math.min(min, max);
            const upper = Math.max(min, max);

            if (value >= lower && value <= upper) {
                const age1 = this.ageRanges[i];
                const age2 = i + 1 < this.ageRanges.length ? this.ageRanges[i+1] : age1;
                return this.interpolate(value, min, max, age1, age2);
            }
        }
        return 0; // Fallback
    }
    
    public calculate(params: any) {
        const avgReflexes = params.reflexes.reduce((sum: number, val: number) => sum + val, 0) / params.reflexes.length;
        const avgBalance = params.balance.reduce((sum: number, val: number) => sum + val, 0) / params.balance.length;

        const bodyFatParam = params.gender === 'female' ? 'bodyFatFemale' : 'bodyFatMale';
        
        const ages = {
            bodyFat: this.getAgeFromRanges(params.bodyFat, bodyFatParam),
            bmi: this.getAgeFromRanges(params.bmi, 'bmi'),
            reflexes: this.getAgeFromRanges(avgReflexes, 'reflexes'),
            accommodation: this.getAgeFromRanges(params.accommodation, 'accommodation'),
            balance: this.getAgeFromRanges(avgBalance, 'balance'),
            hydration: this.getAgeFromRanges(params.hydration, 'hydration'),
            systolic: this.getAgeFromRanges(params.systolic, 'systolic'),
            diastolic: this.getAgeFromRanges(params.diastolic, 'diastolic')
        };
        
        const totalAge = Object.values(ages).reduce((sum, age) => sum + age, 0);
        const averageAge = totalAge / Object.keys(ages).length;
        
        return {
            individualAges: ages,
            biophysicalAge: Math.round(averageAge) // El promedio final se redondea
        };
    }
}

// ===================================================================================
// FIN: Adaptación de la lógica de cálculo
// ===================================================================================


// --- Función de Interfaz Pública ---
export function calculateBiofisicaResults(
  boards: BoardWithRanges[], // Se mantiene para la firma, pero la lógica interna no la usa
  formValues: FormValues,
  cronoAge: number,
  gender: string,
  isAthlete: boolean
): CalculationResult {
  
  validateAllMetricsPresent(formValues);
  
  const calculator = new LegacyBiophysicalAgeCalculator();

  const params = {
      bodyFat: formValues.fatPercentage,
      bmi: formValues.bmi,
      reflexes: [formValues.digitalReflexes!.high, formValues.digitalReflexes!.long, formValues.digitalReflexes!.width],
      accommodation: formValues.visualAccommodation,
      balance: [formValues.staticBalance!.high, formValues.staticBalance!.long, formValues.staticBalance!.width],
      hydration: formValues.skinHydration,
      systolic: formValues.systolicPressure,
      diastolic: formValues.diastolicPressure,
      gender: gender.startsWith('FEMENINO') ? 'female' : 'male'
  };

  const result = calculator.calculate(params);

  const finalPartialAges: PartialAges = {
      fatAge: result.individualAges.bodyFat,
      bmiAge: result.individualAges.bmi,
      reflexesAge: result.individualAges.reflexes,
      visualAge: result.individualAges.accommodation,
      balanceAge: result.individualAges.balance,
      hydrationAge: result.individualAges.hydration,
      systolicAge: result.individualAges.systolic,
      diastolicAge: result.individualAges.diastolic,
  };

  const differentialAge = result.biophysicalAge - cronoAge;

  return {
    biologicalAge: result.biophysicalAge,
    differentialAge: differentialAge,
    partialAges: finalPartialAges,
  };
}


// --- Funciones de Soporte (Sin cambios) ---
function validateAllMetricsPresent(formValues: FormValues) {
  for (const key of BIOPHYSICS_KEYS) {
    const value = formValues[key as keyof FormValues];
    if (value === undefined || value === null || (typeof value !== 'object' && isNaN(value as number))) {
      throw new Error(`El ítem "${key}" es obligatorio y debe ser un número. Por favor, complete todos los campos.`);
    }
    if (typeof value === 'object' && 'high' in value) {
      if (value.high === undefined || value.long === undefined || value.width === undefined || isNaN(value.high) || isNaN(value.long) || isNaN(value.width)) {
         throw new Error(`Las tres dimensiones del ítem "${key}" son obligatorias.`);
      }
    }
  }
}

export function getAgeStatus(ageDifference: number): 'REJUVENECIDO' | 'NORMAL' | 'ENVEJECIDO' {
    if (ageDifference <= -3) return 'REJUVENECIDO';
    if (ageDifference >= 3) return 'ENVEJECIDO';
    return 'NORMAL';
}
  
export function getStatusColor(status: 'REJUVENECIDO' | 'NORMAL' | 'ENVEJECIDO'): string {
    switch (status) {
      case 'REJUVENECIDO': return 'text-status-green';
      case 'NORMAL': return 'text-status-yellow';
      case 'ENVEJECIDO': return 'text-status-red';
      default: return 'text-gray-900';
    }
}
