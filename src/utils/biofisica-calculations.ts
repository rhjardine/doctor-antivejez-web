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

// ===== INICIO DE LA CORRECCIÓN: Corregir claves del mapa =====
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
// ===== FIN DE LA CORRECCIÓN =====

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
    // Determinar si el valor de entrada está dentro del rango del baremo actual
    const min = Math.min(board.minValue, board.maxValue);
    const max = Math.max(board.minValue, board.maxValue);
    // Usamos un pequeño épsilon para manejar imprecisiones de punto flotante en los bordes
    const epsilon = 1e-9; 
    return inputValue >= (min - epsilon) && inputValue <= (max + epsilon);
  });

  if (!applicableBoard) {
    // Si no se encuentra un baremo, el valor está fuera de rango.
    const sortedBoards = metricBoards.sort((a,b) => Math.min(a.minValue, a.maxValue) - Math.min(b.minValue, b.maxValue));
    const minRange = Math.min(sortedBoards[0].minValue, sortedBoards[0].maxValue);
    const maxRange = Math.max(sortedBoards[sortedBoards.length - 1].minValue, sortedBoards[sortedBoards.length - 1].maxValue);
    throw new Error(`El valor ${inputValue.toFixed(2)} para "${metricName}" está fuera del rango permitido (${minRange} - ${maxRange}).`);
  }

  return interpolateAge(applicableBoard, inputValue);
}


// ===== LÓGICA DE INTERPOLACIÓN CALIBRADA =====
/**
 * Calcula la edad parcial replicando la fórmula de interpolación escalonada del sistema legado.
 * @param board El baremo aplicable que contiene los rangos de valores y edades.
 * @param inputValue El valor medido para el ítem biofísico.
 * @returns La edad parcial calculada.
 */
function interpolateAge(board: BoardWithRanges, inputValue: number): number {
  const { minValue, maxValue, range, inverse } = board;
  const { minAge, maxAge } = range;

  // Si el rango de valores es un punto único, devuelve la edad mínima del rango.
  if (minValue === maxValue) return minAge;

  // Determina el rango de edad y de valores.
  const ageSpan = Math.abs(maxAge - minAge);
  const valueSpan = Math.abs(maxValue - minValue);

  // Calcula el "paso" o la proporción de cambio de edad por unidad de valor.
  const step = valueSpan / ageSpan;

  // Genera un array de edades dentro del rango (ej: [70, 71, 72, ..., 77])
  const ageRange: number[] = [];
  for (let i = minAge; i <= maxAge; i++) {
    ageRange.push(i);
  }

  // Para los baremos inversos (ej. reflejos), se invierte el array de edades.
  if (inverse) {
    ageRange.reverse();
  }
  
  // Construye un mapa de correspondencia entre cada edad y su valor de corte en el baremo.
  let accumulatedStep = 0;
  const ageToValueMap = ageRange.map((age, index) => {
    if (index > 0) {
      accumulatedStep += step;
    }
    // El valor de corte para una edad se calcula sumando los pasos acumulados al valor mínimo.
    // Esto crea los "escalones" de la tabla de baremos.
    return {
      age: age,
      valueThreshold: minValue + accumulatedStep,
    };
  });

  // Determina si el baremo es ascendente o descendente.
  const isAscending = maxValue > minValue;

  let calculatedAge = ageToValueMap[ageToValueMap.length - 1].age; // Edad por defecto si no se encuentra

  // Busca la edad correspondiente al valor de entrada.
  for (const mapping of ageToValueMap) {
    if (isAscending) {
      // Si el baremo es ascendente, la primera edad cuyo umbral es >= al valor de entrada es la correcta.
      if (inputValue <= mapping.valueThreshold) {
        calculatedAge = mapping.age;
        break;
      }
    } else {
      // Si el baremo es descendente, la primera edad cuyo umbral es <= al valor de entrada es la correcta.
      if (inputValue >= mapping.valueThreshold) {
        calculatedAge = mapping.age;
        break;
      }
    }
  }

  return calculatedAge;
}


// --- Funciones de Estado y Color (Sin cambios) ---
export function getAgeStatus(ageDifference: number): 'REJUVENECIDO' | 'NORMAL' | 'ENVEJECIDO' {
    if (ageDifference < -2) return 'REJUVENECIDO';
    if (ageDifference > 2) return 'ENVEJECIDO';
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
