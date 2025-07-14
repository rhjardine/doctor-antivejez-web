// src/utils/biofisica-calculations.ts
import type { BoardWithRanges, FormValues, PartialAges, CalculationResult } from '@/types/biophysics';
import { AGE_DIFF_RANGES, STATUS_COLORS } from '@/lib/constants';

/**
 * Interpola la edad biofísica basándose en el valor de entrada y un baremo (board) específico.
 * @param board - El baremo que contiene los rangos de valores y edades.
 * @param inputValue - El valor del test del paciente.
 * @returns La edad biofísica calculada.
 */
function interpolateAge(board: BoardWithRanges, inputValue: number): number {
  const { minValue, maxValue, range, inverse } = board;
  const { minAge, maxAge } = range;

  // Si el rango de valores es un punto único, devuelve la edad mínima del rango.
  if (minValue === maxValue) {
    return minAge;
  }

  // Asegura que el valor de entrada no se salga de los límites del baremo.
  const clampedValue = Math.max(minValue, Math.min(maxValue, inputValue));

  // Calcula la proporción del valor dentro del rango (de 0 a 1).
  const proportion = (clampedValue - minValue) / (maxValue - minValue);

  // Aplica la interpolación.
  let calculatedAge: number;
  if (inverse) {
    // Para valores inversos, una mayor entrada resulta en una menor edad.
    calculatedAge = maxAge - (proportion * (maxAge - minAge));
  } else {
    // Para valores directos, una mayor entrada resulta en una mayor edad.
    calculatedAge = minAge + (proportion * (maxAge - minAge));
  }

  return calculatedAge; // Se devuelve sin redondear para mayor precisión en el cálculo final.
}

/**
 * Calcula el promedio de las tres dimensiones (alto, largo, ancho).
 * @param dimensions - Objeto con las tres dimensiones.
 * @returns El promedio.
 */
function calculateDimensionsAverage(dimensions: { high: number; long: number; width: number }): number {
  return (dimensions.high + dimensions.long + dimensions.width) / 3;
}

/**
 * Encuentra el baremo (board) correcto para un valor y parámetro dados.
 * @param boards - Lista de todos los baremos disponibles.
 * @param boardName - Nombre del parámetro (ej. 'female_fat').
 * @param value - El valor del test del paciente.
 * @returns El baremo correspondiente.
 * @throws Un error si no se encuentra un baremo adecuado.
 */
function findBoardForValue(boards: BoardWithRanges[], boardName: string, value: number): BoardWithRanges {
    const matchingBoards = boards
        .filter(b => b.name === boardName)
        .find(b => value >= b.minValue && value <= b.maxValue);

    if (matchingBoards) {
        return matchingBoards;
    }

    // Si no se encuentra un rango exacto, busca el más cercano.
    const sortedBoards = boards
        .filter(b => b.name === boardName)
        .sort((a, b) => a.minValue - b.minValue);

    if (value < sortedBoards[0].minValue) {
        return sortedBoards[0];
    }
    if (value > sortedBoards[sortedBoards.length - 1].maxValue) {
        return sortedBoards[sortedBoards.length - 1];
    }
    
    throw new Error(`No se encontró un baremo para ${boardName} con el valor ${value}`);
}


/**
 * Calcula la edad biológica completa y las edades parciales a partir de los valores del formulario.
 * @param boards - La lista completa de baremos de la base de datos.
 * @param formValues - Los valores introducidos por el usuario en el formulario.
 * @param chronologicalAge - La edad cronológica del paciente.
 * @param gender - El género del paciente ('MASCULINO', 'FEMENINO', etc.).
 * @param isAthlete - Si el paciente es deportista.
 * @returns Un objeto con la edad biológica, diferencial y las edades parciales.
 */
export function calculateBiofisicaResults(
  boards: BoardWithRanges[],
  formValues: FormValues,
  chronologicalAge: number,
  gender: 'MASCULINO' | 'FEMENINO' | 'MASCULINO_DEPORTIVO' | 'FEMENINO_DEPORTIVO',
  isAthlete: boolean
): CalculationResult {
  const partialAges: PartialAges = {};
  let totalAge = 0;
  let itemCount = 0;

  const getBoardName = (baseName: string): string => {
    if (baseName === 'fat') {
      return gender.startsWith('FEMENINO') ? 'female_fat' : 'male_fat';
    }
    return baseName;
  };
  
  // Mapeo de claves de formulario a nombres de baremos y si son dimensionales
  const parameters = [
    { key: 'fatPercentage', boardBase: 'fat', isDim: false },
    { key: 'bmi', boardBase: 'body_mass', isDim: false },
    { key: 'digitalReflexes', boardBase: 'digital_reflections', isDim: true },
    { key: 'visualAccommodation', boardBase: 'visual_accommodation', isDim: false },
    { key: 'staticBalance', boardBase: 'static_balance', isDim: true },
    { key: 'skinHydration', boardBase: 'quaten_hydration', isDim: false },
    { key: 'systolicPressure', boardBase: 'systolic_blood_pressure', isDim: false },
    { key: 'diastolicPressure', boardBase: 'diastolic_blood_pressure', isDim: false },
  ] as const;

  for (const param of parameters) {
    const formValue = formValues[param.key];
    if (formValue === undefined) continue;

    let valueToCalculate: number;
    if (param.isDim) {
      valueToCalculate = calculateDimensionsAverage(formValue as { high: number; long: number; width: number });
    } else {
      valueToCalculate = formValue as number;
    }

    if (isNaN(valueToCalculate)) continue;

    const boardName = getBoardName(param.boardBase);
    const board = findBoardForValue(boards, boardName, valueToCalculate);
    
    const age = interpolateAge(board, valueToCalculate);
    
    // Asignar edad parcial
    const partialAgeKey = `${param.boardBase.split('_')[0]}Age` as keyof PartialAges;
    partialAges[partialAgeKey] = age;
    
    totalAge += age;
    itemCount++;
  }

  if (itemCount === 0) {
    return { biologicalAge: 0, differentialAge: 0, partialAges: {} };
  }

  const biologicalAge = Math.round(totalAge / itemCount);
  const differentialAge = biologicalAge - chronologicalAge;

  return { biologicalAge, differentialAge, partialAges };
}


// --- FUNCIONES DE ESTADO Y COLOR (SIN CAMBIOS) ---

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
