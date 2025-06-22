import { BoardWithRanges, FormValues, CalculationResult, PartialAges } from '@/types/biophysics';

// Mapeo de nombres de métricas según género y tipo de atleta
export const getFatName = (gender: string, isAthlete: boolean): string => {
  if (gender === 'MASCULINO' || gender === 'MASCULINO_DEPORTIVO') {
    return isAthlete || gender === 'MASCULINO_DEPORTIVO' ? 'sporty_male_fat' : 'male_fat';
  }
  return isAthlete || gender === 'FEMENINO_DEPORTIVO' ? 'sporty_female_fat' : 'female_fat';
};

export const getPulseName = (gender: string, isAthlete: boolean): string => {
  return (isAthlete || gender.includes('DEPORTIVO')) ? 'sportsmen_resting_pulse' : 'normal_resting_pulse';
};

// Mapeo de métricas a nombres en la base de datos
const METRIC_NAME_MAP: Record<string, string> = {
  fatPercentage: '', // Se determina dinámicamente con getFatName
  bmi: 'body_mass',
  digitalReflexes: 'digital_reflections',
  visualAccommodation: 'visual_accommodation',
  staticBalance: 'static_balance',
  skinHydration: 'quaten_hydration',
  systolicPressure: 'systolic_blood_pressure',
  diastolicPressure: 'diastolic_blood_pressure',
};

// Función principal de cálculo
export function calculateBiofisicaResults(
  boards: BoardWithRanges[],
  formValues: FormValues,
  cronoAge: number,
  gender: string,
  isAthlete: boolean
): CalculationResult {
  const partialAges: PartialAges = {};
  let validAgesCount = 0;
  let agesSum = 0;

  // Calcular % Grasa
  if (formValues.fatPercentage !== undefined) {
    const fatName = getFatName(gender, isAthlete);
    const fatAge = calculatePartialAge(boards, fatName, formValues.fatPercentage, cronoAge);
    if (fatAge !== null) {
      partialAges.fatAge = fatAge;
      agesSum += fatAge;
      validAgesCount++;
    }
  }

  // Calcular IMC
  if (formValues.bmi !== undefined) {
    const bmiAge = calculatePartialAge(boards, METRIC_NAME_MAP.bmi, formValues.bmi, cronoAge);
    if (bmiAge !== null) {
      partialAges.bmiAge = bmiAge;
      agesSum += bmiAge;
      validAgesCount++;
    }
  }

  // Calcular Reflejos Digitales (promedio de 3 mediciones)
  if (formValues.digitalReflexes) {
    const average = calculateDimensionsAverage(formValues.digitalReflexes);
    const reflexesAge = calculatePartialAge(boards, METRIC_NAME_MAP.digitalReflexes, average, cronoAge);
    if (reflexesAge !== null) {
      partialAges.reflexesAge = reflexesAge;
      agesSum += reflexesAge;
      validAgesCount++;
    }
  }

  // Calcular Acomodación Visual
  if (formValues.visualAccommodation !== undefined) {
    const visualAge = calculatePartialAge(boards, METRIC_NAME_MAP.visualAccommodation, formValues.visualAccommodation, cronoAge);
    if (visualAge !== null) {
      partialAges.visualAge = visualAge;
      agesSum += visualAge;
      validAgesCount++;
    }
  }

  // Calcular Balance Estático (promedio de 3 mediciones)
  if (formValues.staticBalance) {
    const average = calculateDimensionsAverage(formValues.staticBalance);
    const balanceAge = calculatePartialAge(boards, METRIC_NAME_MAP.staticBalance, average, cronoAge);
    if (balanceAge !== null) {
      partialAges.balanceAge = balanceAge;
      agesSum += balanceAge;
      validAgesCount++;
    }
  }

  // Calcular Hidratación Cutánea
  if (formValues.skinHydration !== undefined) {
    const hydrationAge = calculatePartialAge(boards, METRIC_NAME_MAP.skinHydration, formValues.skinHydration, cronoAge);
    if (hydrationAge !== null) {
      partialAges.hydrationAge = hydrationAge;
      agesSum += hydrationAge;
      validAgesCount++;
    }
  }

  // Calcular Tensión Arterial Sistólica
  if (formValues.systolicPressure !== undefined) {
    const systolicAge = calculatePartialAge(boards, METRIC_NAME_MAP.systolicPressure, formValues.systolicPressure, cronoAge);
    if (systolicAge !== null) {
      partialAges.systolicAge = systolicAge;
      agesSum += systolicAge;
      validAgesCount++;
    }
  }

  // Calcular Tensión Arterial Diastólica
  if (formValues.diastolicPressure !== undefined) {
    const diastolicAge = calculatePartialAge(boards, METRIC_NAME_MAP.diastolicPressure, formValues.diastolicPressure, cronoAge);
    if (diastolicAge !== null) {
      partialAges.diastolicAge = diastolicAge;
      agesSum += diastolicAge;
      validAgesCount++;
    }
  }

  // Calcular edad biológica final (promedio de las 8 métricas)
  const biologicalAge = validAgesCount > 0 ? Math.round(agesSum / validAgesCount) : cronoAge;
  const differentialAge = biologicalAge - cronoAge;

  return {
    biologicalAge,
    differentialAge,
    partialAges,
  };
}

// Función para calcular el promedio de las dimensiones
function calculateDimensionsAverage(dimensions: { high: number; long: number; width: number }): number {
  return (dimensions.high + dimensions.long + dimensions.width) / 3;
}

// Función de interpolación lineal para calcular la edad parcial
function calculatePartialAge(
  boards: BoardWithRanges[],
  metricName: string,
  inputValue: number,
  cronoAge: number
): number | null {
  // Filtrar boards por nombre de métrica
  const metricBoards = boards.filter(board => board.name === metricName);

  if (metricBoards.length === 0) {
    console.warn(`No se encontraron baremos para la métrica: ${metricName}`);
    return null;
  }

  // Encontrar el board que contenga el valor de entrada y la edad cronológica
  const applicableBoard = metricBoards.find(board => {
    const ageInRange = cronoAge >= board.range.minAge && cronoAge <= board.range.maxAge;
    const valueInRange = inputValue >= board.minValue && inputValue <= board.maxValue;
    return ageInRange && valueInRange;
  });

  if (!applicableBoard) {
    // Si no se encuentra un board exacto, buscar el más cercano
    const closestBoard = findClosestBoard(metricBoards, inputValue, cronoAge);
    if (!closestBoard) {
      console.warn(`No se encontró baremo aplicable para ${metricName} con valor ${inputValue} y edad ${cronoAge}`);
      return cronoAge; // Retornar edad cronológica como fallback
    }
    return interpolateAge(closestBoard, inputValue);
  }

  return interpolateAge(applicableBoard, inputValue);
}

// Función para encontrar el board más cercano
function findClosestBoard(boards: BoardWithRanges[], value: number, cronoAge: number): BoardWithRanges | null {
  let closestBoard: BoardWithRanges | null = null;
  let minDistance = Infinity;

  for (const board of boards) {
    // Verificar si la edad cronológica está en el rango
    if (cronoAge >= board.range.minAge && cronoAge <= board.range.maxAge) {
      // Calcular distancia al rango de valores
      let distance = 0;
      if (value < board.minValue) {
        distance = board.minValue - value;
      } else if (value > board.maxValue) {
        distance = value - board.maxValue;
      }

      if (distance < minDistance) {
        minDistance = distance;
        closestBoard = board;
      }
    }
  }

  return closestBoard;
}

// Función de interpolación lineal
function interpolateAge(board: BoardWithRanges, inputValue: number): number {
  const { minValue, maxValue, inverse, range } = board;
  const { minAge, maxAge } = range;

  // Clamp el valor de entrada al rango
  const clampedValue = Math.max(minValue, Math.min(maxValue, inputValue));

  // Calcular la proporción
  let proportion = 0;
  if (maxValue !== minValue) {
    proportion = (clampedValue - minValue) / (maxValue - minValue);
  }

  // Aplicar inversión si es necesario
  if (inverse) {
    proportion = 1 - proportion;
  }

  // Interpolar la edad
  const partialAge = minAge + proportion * (maxAge - minAge);

  // Redondear a 2 decimales
  return Math.round(partialAge * 100) / 100;
}

// Función para determinar el estado basado en la diferencia de edad
export function getAgeStatus(ageDifference: number): 'REJUVENECIDO' | 'NORMAL' | 'ENVEJECIDO' {
  if (ageDifference <= -7) return 'REJUVENECIDO';
  if (ageDifference >= -2 && ageDifference <= 3) return 'NORMAL';
  if (ageDifference >= 7) return 'ENVEJECIDO';

  // Para valores intermedios
  if (ageDifference < -2) return 'REJUVENECIDO';
  if (ageDifference > 3) return 'ENVEJECIDO';

  return 'NORMAL';
}

// Función para obtener el color según el estado
export function getStatusColor(status: 'REJUVENECIDO' | 'NORMAL' | 'ENVEJECIDO'): string {
  switch (status) {
    case 'REJUVENECIDO':
      return 'rgb(22, 163, 74)'; // Verde
    case 'NORMAL':
      return 'rgb(234, 179, 8)'; // Amarillo
    case 'ENVEJECIDO':
      return 'rgb(220, 38, 38)'; // Rojo
  }
}
