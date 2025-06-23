// src/utils/biofisica-calculations.ts

import { BoardWithRanges, FormValues, CalculationResult, PartialAges } from '@/types/biophysics';

// --- Funciones de Mapeo (Sin cambios, ya eran correctas) ---

export const getFatName = (gender: string, isAthlete: boolean): string => {
  if (gender === 'MASCULINO' || gender === 'MASCULINO_DEPORTIVO') {
    return isAthlete || gender === 'MASCULINO_DEPORTIVO' ? 'sporty_male_fat' : 'male_fat';
  }
  return isAthlete || gender === 'FEMENINO_DEPORTIVO' ? 'sporty_female_fat' : 'female_fat';
};

// Se mantiene el pulso aparte ya que no está en el METRIC_NAME_MAP
export const getPulseName = (gender: string, isAthlete: boolean): string => {
  return (isAthlete || gender.includes('DEPORTIVO')) ? 'sportsmen_resting_pulse' : 'normal_resting_pulse';
};

const METRIC_NAME_MAP: Record<string, string> = {
  fatPercentage: '', // Se determina dinámicamente
  bmi: 'body_mass',
  digitalReflexes: 'digital_reflections',
  visualAccommodation: 'visual_accommodation',
  staticBalance: 'static_balance',
  skinHydration: 'quaten_hydration',
  systolicPressure: 'systolic_blood_pressure',
  diastolicPressure: 'diastolic_blood_pressure',
  pulse: '', // Se determina dinámicamente con getPulseName
};

const BIOPHYSICS_KEYS = [
  'fatPercentage', 'bmi', 'digitalReflexes', 'visualAccommodation', 
  'staticBalance', 'skinHydration', 'systolicPressure', 'diastolicPressure'
] as const;


// --- Lógica de Cálculo Principal (Refactorizada y Corregida) ---

export function calculateBiofisicaResults(
  boards: BoardWithRanges[],
  formValues: FormValues,
  cronoAge: number,
  gender: string,
  isAthlete: boolean
): CalculationResult {
  
  // Se valida que todos los 8 ítems obligatorios están presentes y son válidos.
  validateAllMetricsPresent(formValues);

  const partialAges: PartialAges = {};
  let agesSum = 0;

  // Se itera sobre una lista fija para asegurar el procesamiento de los 8 ítems.
  for (const key of BIOPHYSICS_KEYS) {
    const value = formValues[key as keyof FormValues];
    let metricName: string;
    let inputValue: number;

    // Determinar el nombre de la métrica y el valor de entrada
    if (key === 'fatPercentage') {
      metricName = getFatName(gender, isAthlete);
      inputValue = value as number;
    } else if (typeof value === 'object' && value !== null && 'high' in value) {
      metricName = METRIC_NAME_MAP[key];
      inputValue = calculateDimensionsAverage(value);
    } else {
      metricName = METRIC_NAME_MAP[key];
      inputValue = value as number;
    }

    // Calcular la edad parcial para la métrica actual
    const partialAge = calculatePartialAge(boards, metricName, inputValue);
    const ageKey = `${key.replace(/([A-Z])/g, (match) => match.toLowerCase())}Age`;
    partialAges[ageKey as keyof PartialAges] = partialAge;
    agesSum += partialAge;
  }

  // El promedio final se divide estrictamente entre 8, ya que la validación garantiza que hay 8 valores.
  const biologicalAge = Math.round(agesSum / 8);
  const differentialAge = biologicalAge - cronoAge;

  return {
    biologicalAge,
    differentialAge,
    partialAges,
  };
}

// --- Funciones de Soporte (Validadas y Corregidas) ---

/**
 * Valida que todos los campos requeridos en el formulario tengan valores válidos.
 * Lanza un error si alguna validación falla.
 */
function validateAllMetricsPresent(formValues: FormValues) {
  for (const key of BIOPHYSICS_KEYS) {
    const value = formValues[key as keyof FormValues];
    if (value === undefined || value === null) {
      throw new Error(`El ítem "${key}" es obligatorio. Por favor, complete todos los campos.`);
    }
    if (typeof value === 'object' && 'high' in value) {
      if (value.high === undefined || value.long === undefined || value.width === undefined || isNaN(value.high) || isNaN(value.long) || isNaN(value.width)) {
         throw new Error(`Las tres dimensiones del ítem "${key}" son obligatorias.`);
      }
    } else if (isNaN(value as number)) {
       throw new Error(`El valor para el ítem "${key}" no es un número válido.`);
    }
  }
}

/**
 * Calcula el promedio para métricas con tres dimensiones.
 */
function calculateDimensionsAverage(dimensions: { high: number; long: number; width: number }): number {
  return (dimensions.high + dimensions.long + dimensions.width) / 3;
}

/**
 * Encuentra el baremo correcto y calcula la edad parcial para una métrica.
 * CORREGIDO para manejar rangos invertidos en la búsqueda.
 */
function calculatePartialAge(
  boards: BoardWithRanges[],
  metricName: string,
  inputValue: number
): number {
  const metricBoards = boards.filter(board => board.name === metricName);
  if (metricBoards.length === 0) {
    throw new Error(`Datos de configuración incompletos: No se encontraron baremos para la métrica "${metricName}".`);
  }

  // **CORRECCIÓN 1: BÚSQUEDA ROBUSTA PARA RANGOS NORMALES E INVERSOS**
  // Normaliza el rango para que la búsqueda funcione sin importar si min > max o max > min.
  const applicableBoard = metricBoards.find(board => {
    const start = Math.min(board.minValue, board.maxValue);
    const end = Math.max(board.minValue, board.maxValue);
    return inputValue >= start && inputValue <= end;
  });

  if (!applicableBoard) {
    // Lanza un error claro si el valor está fuera de todos los rangos definidos.
    throw new Error(`El valor ingresado (${inputValue.toFixed(2)}) para la métrica "${metricName}" está fuera de los rangos definidos.`);
  }

  return interpolateAge(applicableBoard, inputValue);
}

/**
 * Realiza la interpolación lineal para mapear un valor de prueba a una edad.
 * CORREGIDO para manejar correctamente la proporción en rangos inversos.
 */
function interpolateAge(board: BoardWithRanges, inputValue: number): number {
  const { minValue, maxValue, inverse, range } = board;
  const { minAge, maxAge } = range;
  
  // Evitar división por cero si los límites del rango son iguales.
  if (minValue === maxValue) {
    return minAge;
  }

  // **CORRECCIÓN 2: CÁLCULO DE PROPORCIÓN UNIVERSAL**
  // Esta fórmula funciona tanto para rangos normales (max > min) como inversos (min > max).
  // En un rango inverso, ambos términos de la división (numerador y denominador) serán negativos,
  // resultando en una proporción positiva correcta.
  const proportion = (inputValue - minValue) / (maxValue - minValue);

  // La lógica de inversión se aplica después para determinar la dirección de la interpolación.
  const finalProportion = inverse ? 1 - proportion : proportion;

  const partialAge = minAge + finalProportion * (maxAge - minAge);

  // Se redondea a un entero para coincidir con la salida del sistema original.
  return Math.round(partialAge);
}


// --- Funciones de Estado y Color (Sin cambios) ---

export function getAgeStatus(ageDifference: number): 'REJUVENECIDO' | 'NORMAL' | 'ENVEJECIDO' {
  if (ageDifference <= -7) return 'REJUVENECIDO';
  if (ageDifference >= 7) return 'ENVEJECIDO';
  if (ageDifference < 0) return 'REJUVENECIDO'; // Simplificado
  if (ageDifference > 0) return 'ENVEJECIDO'; // Simplificado

  return 'NORMAL';
}

export function getStatusColor(status: 'REJUVENECIDO' | 'NORMAL' | 'ENVEJECIDO'): string {
  switch (status) {
    case 'REJUVENECIDO':
      return 'rgb(22, 163, 74)'; // Verde
    case 'NORMAL':
      return 'rgb(234, 179, 8)'; // Amarillo
    case 'ENVEJECIDO':
      return 'rgb(220, 38, 38)'; // Rojo
    default:
      return 'rgb(107, 114, 128)'; // Gris por defecto
  }
}