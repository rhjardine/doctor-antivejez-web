// src/utils/biofisica-calculations.ts
import type { BoardWithRanges, FormValues, PartialAges, CalculationResult } from '@/types/biophysics';
import { AGE_DIFF_RANGES, STATUS_COLORS } from '@/lib/constants';
import { toast } from 'sonner';

/**
 * Interpola la edad biofísica replicando la fórmula de interpolación escalonada del sistema legado.
 * Este método no es una interpolación lineal, sino que busca el "escalón" o umbral de valor
 * que corresponde a una edad específica dentro del rango del baremo.
 * @param board El baremo aplicable que contiene los rangos de valores y edades.
 * @param inputValue El valor medido para el ítem biofísico.
 * @returns La edad parcial calculada según la lógica del sistema original.
 */
function legacyInterpolateAge(board: BoardWithRanges, inputValue: number): number {
  const { minValue, maxValue, range, inverse } = board;
  const { minAge, maxAge } = range;

  // Si el rango de valores es un punto único, devuelve la edad mínima del rango.
  if (minValue === maxValue) return minAge;

  // Determina el rango de edad y de valores.
  const ageSpan = Math.abs(maxAge - minAge);
  const valueSpan = Math.abs(maxValue - minValue);
  
  // Evita la división por cero si el rango de edad es 0.
  if (ageSpan === 0) return minAge;

  // Calcula el "paso" o la proporción de cambio de valor por unidad de edad.
  const step = valueSpan / ageSpan;

  // Genera un array de edades dentro del rango (ej: [49, 50, ..., 56])
  const ageRange: number[] = [];
  for (let i = minAge; i <= maxAge; i++) {
    ageRange.push(i);
  }

  // Para los baremos inversos (ej. reflejos), se invierte el array de edades.
  // Esto significa que el valor de prueba más bajo corresponde a la edad más alta del rango.
  if (inverse) {
    ageRange.reverse();
  }
  
  // Construye un mapa de correspondencia entre cada edad y su valor de corte en el baremo.
  let accumulatedStep = 0;
  const ageToValueMap = ageRange.map((age, index) => {
    if (index > 0) {
      accumulatedStep += step;
    }
    // El valor de corte para una edad se calcula sumando/restando los pasos acumulados.
    const valueThreshold = inverse ? maxValue - accumulatedStep : minValue + accumulatedStep;
    return { age, valueThreshold };
  });

  // Determina si el baremo es ascendente o descendente.
  const isAscending = maxValue > minValue;
  let calculatedAge = inverse ? ageToValueMap[0].age : ageToValueMap[ageToValueMap.length - 1].age;

  // Busca la edad correspondiente al valor de entrada.
  for (const mapping of ageToValueMap) {
    // Si el baremo es ascendente (ej. % Grasa), la primera edad cuyo umbral es >= al valor es la correcta.
    if (isAscending && inputValue <= mapping.valueThreshold) {
      calculatedAge = mapping.age;
      break;
    }
    // Si el baremo es descendente (ej. Reflejos), la primera edad cuyo umbral es <= al valor es la correcta.
    if (!isAscending && inputValue >= mapping.valueThreshold) {
      calculatedAge = mapping.age;
      break;
    }
  }

  return calculatedAge;
}


function calculateDimensionsAverage(dimensions: { high: number; long: number; width: number }): number {
  return (dimensions.high + dimensions.long + dimensions.width) / 3;
}

function findBoardForValue(boards: BoardWithRanges[], boardName: string, value: number): BoardWithRanges {
    const metricBoards = boards.filter(b => b.name === boardName);
    if (metricBoards.length === 0) {
        throw new Error(`Datos de configuración incompletos: No se encontraron baremos para la métrica "${boardName}".`);
    }

    const applicableBoard = metricBoards.find(board => {
        const min = Math.min(board.minValue, board.maxValue);
        const max = Math.max(board.minValue, board.maxValue);
        const epsilon = 1e-9;
        return value >= (min - epsilon) && value <= (max + epsilon);
    });

    if (applicableBoard) {
        return applicableBoard;
    }

    // Si está fuera de rango, se toma el baremo más cercano para el cálculo (clamping).
    const sortedBoards = metricBoards.sort((a, b) => a.minValue - b.minValue);
    if (value < sortedBoards[0].minValue) return sortedBoards[0];
    if (value > sortedBoards[sortedBoards.length - 1].maxValue) return sortedBoards[sortedBoards.length - 1];

    throw new Error(`El valor ${value.toFixed(2)} para "${boardName}" está fuera de los rangos permitidos.`);
}

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
    const isFemale = gender.startsWith('FEMENINO');
    if (baseName === 'fat') {
      return isAthlete
        ? (isFemale ? 'female_fat_athlete' : 'male_fat_athlete')
        : (isFemale ? 'female_fat' : 'male_fat');
    }
    return baseName;
  };
  
  const parameters = [
    { key: 'fatPercentage', boardBase: 'fat', partialKey: 'fatAge', isDim: false },
    { key: 'bmi', boardBase: 'body_mass', partialKey: 'bmiAge', isDim: false },
    { key: 'digitalReflexes', boardBase: 'digital_reflections', partialKey: 'reflexesAge', isDim: true },
    { key: 'visualAccommodation', boardBase: 'visual_accommodation', partialKey: 'visualAge', isDim: false },
    { key: 'staticBalance', boardBase: 'static_balance', partialKey: 'balanceAge', isDim: true },
    { key: 'skinHydration', boardBase: 'quaten_hydration', partialKey: 'hydrationAge', isDim: false },
    { key: 'systolicPressure', boardBase: 'systolic_blood_pressure', partialKey: 'systolicAge', isDim: false },
    { key: 'diastolicPressure', boardBase: 'diastolic_blood_pressure', partialKey: 'diastolicAge', isDim: false },
  ] as const;

  for (const param of parameters) {
    const formValue = formValues[param.key];
    if (formValue === undefined || formValue === null) continue;

    let valueToCalculate: number;
    if (param.isDim) {
       const dims = formValue as { high: number; long: number; width: number };
       if (dims.high === undefined || dims.long === undefined || dims.width === undefined || isNaN(dims.high) || isNaN(dims.long) || isNaN(dims.width)) continue;
       valueToCalculate = calculateDimensionsAverage(dims);
    } else {
      valueToCalculate = formValue as number;
    }

    if (isNaN(valueToCalculate)) continue;

    try {
      const boardName = getBoardName(param.boardBase);
      const board = findBoardForValue(boards, boardName, valueToCalculate);
      // Usar la función de interpolación del sistema legado
      const age = legacyInterpolateAge(board, valueToCalculate);
      
      partialAges[param.partialKey] = age;
      
      totalAge += age;
      itemCount++;
    } catch (error) {
        console.error(error);
        toast.error((error as Error).message);
    }
  }

  if (itemCount === 0) {
    return { biologicalAge: 0, differentialAge: 0, partialAges: {} };
  }

  const biologicalAge = Math.round(totalAge / itemCount);
  const differentialAge = biologicalAge - chronologicalAge;

  return { biologicalAge, differentialAge, partialAges };
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
