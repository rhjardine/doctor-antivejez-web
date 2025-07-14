// src/utils/biofisica-calculations.ts

import { BoardWithRanges, FormValues, CalculationResult, PartialAges } from '@/types/biophysics';

// --- Funciones de Mapeo (Sin cambios) ---
export const getFatName = (gender: string, isAthlete: boolean): string => {
  if (gender === 'MASCULINO' || gender === 'MASCULINO_DEPORTIVO') {
    return isAthlete || gender === 'MASCULINO_DEPORTIVO' ? 'sporty_male_fat' : 'male_fat';
  }
  return isAthlete || gender === 'FEMENINO_DEPORTIVO' ? 'sporty_female_fat' : 'female_fat';
};

const METRIC_NAME_MAP: Record<string, string> = {
  fatPercentage: '', // Se maneja con getFatName
  bmi: 'body_mass',
  digitalReflexes: 'digital_reflections',
  visualAccommodation: 'visual_accommodation',
  staticBalance: 'static_balance',
  skinHydration: 'quaten_hydration',
  systolicPressure: 'systolic_blood_pressure',
  diastolicPressure: 'diastolic_blood_pressure',
};

const BIOPHYSICS_KEYS = [
  'fatPercentage', 'bmi', 'digitalReflexes', 'visualAccommodation', 
  'staticBalance', 'skinHydration', 'systolicPressure', 'diastolicPressure'
] as const;

const PARTIAL_AGE_KEYS_MAP: Record<typeof BIOPHYSICS_KEYS[number], keyof PartialAges> = {
  fatPercentage: 'fatAge',
  bmi: 'bmiAge',
  digitalReflexes: 'reflexesAge',
  visualAccommodation: 'visualAge',
  staticBalance: 'balanceAge',
  skinHydration: 'hydrationAge',
  systolicPressure: 'systolicAge',
  diastolicPressure: 'diastolicAge',
};

// --- Lógica de Cálculo Principal ---
export function calculateBiofisicaResults(
  boards: BoardWithRanges[],
  formValues: FormValues,
  cronoAge: number,
  gender: string,
  isAthlete: boolean
): CalculationResult {
  
  validateAllMetricsPresent(formValues);

  const partialAges: PartialAges = {};
  let agesSum = 0;

  for (const key of BIOPHYSICS_KEYS) {
    const formValue = formValues[key as keyof FormValues];
    let metricName: string;
    let inputValue: number;

    if (key === 'fatPercentage') {
      metricName = getFatName(gender, isAthlete);
      inputValue = formValue as number;
    } else if (typeof formValue === 'object' && formValue !== null && 'high' in formValue) {
      metricName = METRIC_NAME_MAP[key];
      inputValue = calculateDimensionsAverage(formValue);
    } else {
      metricName = METRIC_NAME_MAP[key];
      inputValue = formValue as number;
    }
    
    const partialAge = calculatePartialAge(boards, metricName, inputValue);
    
    const ageKey = PARTIAL_AGE_KEYS_MAP[key];
    partialAges[ageKey] = partialAge;
    
    agesSum += partialAge;
  }

  const biologicalAge = Math.round(agesSum / BIOPHYSICS_KEYS.length);
  const differentialAge = biologicalAge - cronoAge;

  return {
    biologicalAge,
    differentialAge,
    partialAges,
  };
}

// --- Funciones de Soporte ---
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

function calculateDimensionsAverage(dimensions: { high: number; long: number; width: number }): number {
  return (dimensions.high + dimensions.long + dimensions.width) / 3;
}


// --- Lógica de Búsqueda y Cálculo de Edad Parcial ---
function calculatePartialAge(
  boards: BoardWithRanges[],
  metricName: string,
  inputValue: number
): number {
  const metricBoards = boards.filter(board => board.name === metricName);
  if (metricBoards.length === 0) {
    throw new Error(`Datos de configuración incompletos: No se encontraron baremos para la métrica "${metricName}".`);
  }

  const applicableBoard = metricBoards.find(board => {
    const min = Math.min(board.minValue, board.maxValue);
    const max = Math.max(board.minValue, board.maxValue);
    const epsilon = 1e-9; 
    return inputValue >= (min - epsilon) && inputValue <= (max + epsilon);
  });

  if (!applicableBoard) {
    const sortedBoards = metricBoards.sort((a,b) => Math.min(a.minValue, a.maxValue) - Math.min(b.minValue, b.maxValue));
    const minRange = Math.min(sortedBoards[0].minValue, sortedBoards[0].maxValue);
    const maxRange = Math.max(sortedBoards[sortedBoards.length - 1].minValue, sortedBoards[sortedBoards.length - 1].maxValue);
    throw new Error(`El valor ${inputValue.toFixed(2)} para "${metricName}" está fuera del rango permitido (${minRange} - ${maxRange}).`);
  }

  return interpolateAge(applicableBoard, inputValue);
}


// ===== INICIO DE LA CORRECCIÓN: LÓGICA DE INTERPOLACIÓN Y TRUNCADO DEFINITIVA =====
/**
 * Calcula la edad parcial replicando la fórmula de interpolación escalonada del sistema legado.
 * @param board El baremo aplicable que contiene los rangos de valores y edades.
 * @param inputValue El valor medido para el ítem biofísico.
 * @returns La edad parcial calculada como un entero (truncado).
 */
function interpolateAge(board: BoardWithRanges, inputValue: number): number {
  const { minValue, maxValue, range } = board;
  
  if (minValue === maxValue) return range.minAge;

  const y1 = range.minAge;
  const y2 = range.maxAge;
  
  const x1 = minValue;
  const x2 = maxValue;
  
  const partialAge = y1 + (inputValue - x1) * (y2 - y1) / (x2 - x1);

  // La clave es truncar el resultado (eliminar decimales) en lugar de redondear.
  // Esto replica el comportamiento de `parseInt` del sistema legado sobre el resultado.
  return Math.trunc(partialAge);
}
// ===== FIN DE LA CORRECCIÓN =====


// ===== INICIO DE LA CORRECCIÓN: AJUSTE DE UMBRALES DE ESTADO =====
export function getAgeStatus(ageDifference: number): 'REJUVENECIDO' | 'NORMAL' | 'ENVEJECIDO' {
    // Un diferencial de -3 o menos se considera rejuvenecido.
    if (ageDifference <= -3) return 'REJUVENECIDO';
    // Un diferencial de +3 o más se considera envejecido.
    if (ageDifference >= 3) return 'ENVEJECIDO';
    // Cualquier valor entre -2 y +2 (inclusive) se considera normal.
    return 'NORMAL';
}
// ===== FIN DE LA CORRECCIÓN =====
  
export function getStatusColor(status: 'REJUVENECIDO' | 'NORMAL' | 'ENVEJECIDO'): string {
    switch (status) {
      case 'REJUVENECIDO': return 'text-status-green';
      case 'NORMAL': return 'text-status-yellow';
      case 'ENVEJECIDO': return 'text-status-red';
      default: return 'text-gray-900';
    }
}
