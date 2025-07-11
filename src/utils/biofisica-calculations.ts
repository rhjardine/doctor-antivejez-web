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

// --- Claves y Mapa de Nombres (Sin cambios) ---
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

// --- Lógica de Cálculo Principal (Sin cambios) ---
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
    const formValue = formValues[key];
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

// --- Funciones de Soporte (Sin cambios en estas dos) ---

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

// --- Lógica de Búsqueda y Cálculo de Edad Parcial (Sin cambios) ---
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
    const start = Math.min(board.minValue, board.maxValue);
    const end = Math.max(board.minValue, board.maxValue);
    const epsilon = 1e-9;
    return inputValue >= (start - epsilon) && inputValue <= (end + epsilon);
  });

  if (!applicableBoard) {
    const sortedBoards = metricBoards.sort((a,b) => Math.min(a.minValue, a.maxValue) - Math.min(b.minValue, b.maxValue));
    const minRange = Math.min(sortedBoards[0].minValue, sortedBoards[0].maxValue);
    const maxRange = Math.max(sortedBoards[sortedBoards.length - 1].minValue, sortedBoards[sortedBoards.length - 1].maxValue);
    throw new Error(`El valor ${inputValue.toFixed(2)} para "${metricName}" está fuera del rango permitido (${minRange} - ${maxRange}).`);
  }

  return interpolateAge(applicableBoard, inputValue);
}

// --- FUNCIÓN DE INTERPOLACIÓN DEFINITIVA Y CALIBRADA ---
function interpolateAge(board: BoardWithRanges, inputValue: number): number {
  const { minValue, maxValue, range, inverse } = board;
  const { minAge, maxAge } = range;

  if (minValue === maxValue) return minAge;
  
  // Determina si el rango de valores del baremo es decreciente (ej. Reflejos Digitales)
  const isDecreasingRange = minValue > maxValue;

  // Si el baremo es inverso (ej. Tensión baja), la edad se interpola en la dirección opuesta.
  const effectiveMinAge = inverse ? maxAge : minAge;
  const effectiveMaxAge = inverse ? minAge : maxAge;

  // Si el rango es decreciente, la interpolación también se invierte para la edad.
  const ageStart = isDecreasingRange ? maxAge : effectiveMinAge;
  const ageEnd = isDecreasingRange ? minAge : effectiveMaxAge;

  const proportion = (inputValue - minValue) / (maxValue - minValue);
  
  const partialAge = ageStart + (proportion * (ageEnd - ageStart));

  return Math.round(partialAge);
}


// --- Funciones de Estado y Color (Sin cambios) ---
export function getAgeStatus(ageDifference: number): 'REJUVENECIDO' | 'NORMAL' | 'ENVEJECIDO' {
    if (ageDifference < 0) return 'REJUVENECIDO';
    if (ageDifference > 0) return 'ENVEJECIDO';
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
