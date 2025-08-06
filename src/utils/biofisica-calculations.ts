/**
 * @file src/utils/biofisica-calculations.ts
 * @description Lógica de cálculo para el test de edad biológica biofísica.
 * @version 2.1.0
 * @date 2025-08-05
 *
 * @note AJUSTE QUIRÚRGICO DE PRODUCCIÓN:
 * Se ha reemplazado la lógica dependiente de la base de datos por un baremo completo
 * codificado directamente aquí. Esto se debe a que el modelo de datos original
 * no podía representar las curvas de riesgo en "U" (donde valores bajos y altos
 * son perjudiciales), causando errores de cálculo en casos de borde.
 * Esta nueva implementación es un reflejo fiel de la tabla de baremos proporcionada
 * por el cliente médico, garantizando la máxima precisión.
 *
 * @note v2.1.0: Se reincorporan las funciones de ayuda para estado y color
 * (`getAgeStatus`, `getStatusColor`) para mantener la funcionalidad completa del módulo
 * en un único archivo.
 */

import { BiophysicsTestKeys, BiophysicsResult, BiophysicsFormData } from '@/types/biophysics';
import { Gender } from '@prisma/client';

// ===================================================================================
// CONSTANTES DE CONFIGURACIÓN
// ===================================================================================

const AGE_DIFF_RANGES = {
  NORMAL_MIN: -5, // Límite inferior para estado "NORMAL"
  NORMAL_MAX: 5,  // Límite superior para estado "NORMAL"
};

type AgeStatus = 'REJUVENECIDO' | 'NORMAL' | 'ENVEJECIDO';

// ===================================================================================
// FUNCIONES DE CÁLCULO
// ===================================================================================

/**
 * Realiza una interpolación lineal para calcular la edad biológica dentro de un rango.
 * @param value - El valor del parámetro medido.
 * @param valueMin - El valor mínimo del rango de medición.
 * @param valueMax - El valor máximo del rango de medición.
 * @param ageMin - La edad biológica mínima correspondiente.
 * @param ageMax - La edad biológica máxima correspondiente.
 * @param inverse - Si la relación es inversa (a mayor valor, menor edad).
 * @returns La edad biológica interpolada.
 */
const interpolateAge = (
  value: number,
  valueMin: number,
  valueMax: number,
  ageMin: number,
  ageMax: number,
  inverse: boolean = false
): number => {
  const valueRange = valueMax - valueMin;
  const ageRange = ageMax - ageMin;

  if (valueRange === 0) {
    return inverse ? ageMax : ageMin;
  }

  // Asegura que el valor esté dentro de los límites para una interpolación correcta
  const clampedValue = Math.max(valueMin, Math.min(value, valueMax));

  const valueFraction = (clampedValue - valueMin) / valueRange;
  const ageOffset = valueFraction * ageRange;

  const calculatedAge = inverse ? ageMax - ageOffset : ageMin + ageOffset;
  return Math.round(calculatedAge); // Devolver edad redondeada
};

// ===================================================================================
// BAREMO DE EDAD BIOLÓGICA BIOFÍSICA - FUENTE DE VERDAD
// Este objeto es la transcripción directa de la tabla de baremos del médico.
// ===================================================================================
const BAREMO_BIOFISICO = {
  // NOTA: 'inverse: true' en el rango 'low' significa que a medida que el valor
  // se acerca a 'min' desde 'max', la edad aumenta (se acerca a ageMax).
  fat: [
    // Para mujeres
    { age_min: 21, age_max: 28, high: { min: 18, max: 22 } },
    { age_min: 28, age_max: 35, high: { min: 21, max: 25 } },
    { age_min: 35, age_max: 42, high: { min: 24, max: 28 } },
    { age_min: 42, age_max: 49, high: { min: 27, max: 31 } },
    { age_min: 49, age_max: 56, high: { min: 30, max: 34 } },
    { age_min: 56, age_max: 63, high: { min: 33, max: 37 } },
    { age_min: 63, age_max: 70, high: { min: 36, max: 40 } },
    { age_min: 70, age_max: 77, high: { min: 39, max: 43 } },
    { age_min: 77, age_max: 84, high: { min: 42, max: 46 } },
    { age_min: 84, age_max: 91, high: { min: 45, max: 49 } },
    { age_min: 91, age_max: 98, high: { min: 48, max: 52 } },
    { age_min: 98, age_max: 105, high: { min: 51, max: 55 } },
    { age_min: 105, age_max: 112, high: { min: 54, max: 58 } },
    { age_min: 112, age_max: 120, high: { min: 57, max: 61 } },
  ],
  male_fat: [
    // Para hombres
    { age_min: 21, age_max: 28, high: { min: 10, max: 14 } },
    { age_min: 28, age_max: 35, high: { min: 13, max: 17 } },
    { age_min: 35, age_max: 42, high: { min: 16, max: 20 } },
    { age_min: 42, age_max: 49, high: { min: 19, max: 23 } },
    { age_min: 49, age_max: 56, high: { min: 22, max: 26 } },
    { age_min: 56, age_max: 63, high: { min: 25, max: 29 } },
    { age_min: 63, age_max: 70, high: { min: 28, max: 32 } },
    { age_min: 70, age_max: 77, high: { min: 31, max: 35 } },
    { age_min: 77, age_max: 84, high: { min: 34, max: 38 } },
    { age_min: 84, age_max: 91, high: { min: 37, max: 41 } },
    { age_min: 91, age_max: 98, high: { min: 40, max: 44 } },
    { age_min: 98, age_max: 105, high: { min: 43, max: 47 } },
    { age_min: 105, age_max: 112, high: { min: 46, max: 50 } },
    { age_min: 112, age_max: 120, high: { min: 49, max: 53 } },
  ],
  body_mass: [
    { age_min: 21, age_max: 28, low: { min: 21, max: 22, inverse: true }, high: { min: 28, max: 29 } },
    { age_min: 28, age_max: 35, low: { min: 20, max: 21, inverse: true }, high: { min: 29, max: 32 } },
    { age_min: 35, age_max: 42, low: { min: 19, max: 20, inverse: true }, high: { min: 32, max: 35 } },
    { age_min: 42, age_max: 49, low: { min: 18, max: 19, inverse: true }, high: { min: 35, max: 38 } },
    { age_min: 49, age_max: 56, low: { min: 17, max: 18, inverse: true }, high: { min: 38, max: 41 } },
    { age_min: 56, age_max: 63, low: { min: 16, max: 17, inverse: true }, high: { min: 41, max: 44 } },
    { age_min: 63, age_max: 70, low: { min: 15, max: 16, inverse: true }, high: { min: 44, max: 47 } },
    { age_min: 70, age_max: 77, low: { min: 14, max: 15, inverse: true }, high: { min: 47, max: 50 } },
    { age_min: 77, age_max: 84, low: { min: 13, max: 14, inverse: true }, high: { min: 50, max: 53 } },
    { age_min: 84, age_max: 91, low: { min: 12, max: 13, inverse: true }, high: { min: 51, max: 54 } },
    { age_min: 91, age_max: 98, low: { min: 11, max: 12, inverse: true }, high: { min: 52, max: 55 } },
    { age_min: 98, age_max: 105, low: { min: 10, max: 11, inverse: true }, high: { min: 53, max: 56 } },
    { age_min: 105, age_max: 112, low: { min: 9, max: 10, inverse: true }, high: { min: 54, max: 57 } },
    { age_min: 112, age_max: 120, low: { min: 8, max: 9, inverse: true }, high: { min: 55, max: 58 } },
  ],
  systolic: [
    { age_min: 21, age_max: 28, low: { min: 85, max: 90, inverse: true }, high: { min: 125, max: 130 } },
    { age_min: 28, age_max: 35, low: { min: 80, max: 85, inverse: true }, high: { min: 130, max: 140 } },
    { age_min: 35, age_max: 42, low: { min: 75, max: 80, inverse: true }, high: { min: 140, max: 150 } },
    { age_min: 42, age_max: 49, low: { min: 70, max: 75, inverse: true }, high: { min: 150, max: 160 } },
    { age_min: 49, age_max: 56, low: { min: 68, max: 70, inverse: true }, high: { min: 160, max: 170 } },
    { age_min: 56, age_max: 63, low: { min: 65, max: 68, inverse: true }, high: { min: 170, max: 180 } },
    { age_min: 63, age_max: 70, low: { min: 63, max: 65, inverse: true }, high: { min: 180, max: 190 } },
    { age_min: 70, age_max: 77, low: { min: 60, max: 63, inverse: true }, high: { min: 190, max: 200 } },
    { age_min: 77, age_max: 84, low: { min: 58, max: 60, inverse: true }, high: { min: 200, max: 210 } },
    { age_min: 84, age_max: 91, low: { min: 55, max: 58, inverse: true }, high: { min: 210, max: 220 } },
    { age_min: 91, age_max: 98, low: { min: 50, max: 55, inverse: true }, high: { min: 215, max: 225 } },
    { age_min: 98, age_max: 105, low: { min: 45, max: 50, inverse: true }, high: { min: 220, max: 230 } },
    { age_min: 105, age_max: 112, low: { min: 40, max: 45, inverse: true }, high: { min: 230, max: 240 } },
    { age_min: 112, age_max: 120, low: { min: 35, max: 40, inverse: true }, high: { min: 240, max: 250 } },
  ],
  diastolic: [
    { age_min: 21, age_max: 28, low: { min: 60, max: 65, inverse: true }, high: { min: 85, max: 90 } },
    { age_min: 28, age_max: 35, low: { min: 58, max: 60, inverse: true }, high: { min: 90, max: 95 } },
    { age_min: 35, age_max: 42, low: { min: 55, max: 58, inverse: true }, high: { min: 95, max: 100 } },
    { age_min: 42, age_max: 49, low: { min: 53, max: 55, inverse: true }, high: { min: 100, max: 105 } },
    { age_min: 49, age_max: 56, low: { min: 50, max: 53, inverse: true }, high: { min: 105, max: 110 } },
    { age_min: 56, age_max: 63, low: { min: 48, max: 50, inverse: true }, high: { min: 110, max: 115 } },
    { age_min: 63, age_max: 70, low: { min: 45, max: 48, inverse: true }, high: { min: 115, max: 120 } },
    { age_min: 70, age_max: 77, low: { min: 43, max: 45, inverse: true }, high: { min: 120, max: 125 } },
    { age_min: 77, age_max: 84, low: { min: 41, max: 43, inverse: true }, high: { min: 125, max: 130 } },
    { age_min: 84, age_max: 91, low: { min: 38, max: 41, inverse: true }, high: { min: 130, max: 135 } },
    { age_min: 91, age_max: 98, low: { min: 35, max: 38, inverse: true }, high: { min: 135, max: 140 } },
    { age_min: 98, age_max: 105, low: { min: 33, max: 35, inverse: true }, high: { min: 140, max: 145 } },
    { age_min: 105, age_max: 112, low: { min: 30, max: 33, inverse: true }, high: { min: 145, max: 150 } },
    { age_min: 112, age_max: 120, low: { min: 28, max: 30, inverse: true }, high: { min: 150, max: 155 } },
  ],
  pulse: [
    { age_min: 21, age_max: 28, low: { min: 50, max: 55, inverse: true }, high: { min: 80, max: 85 } },
    { age_min: 28, age_max: 35, low: { min: 55, max: 60, inverse: true }, high: { min: 85, max: 90 } },
    { age_min: 35, age_max: 42, low: { min: 60, max: 65, inverse: true }, high: { min: 90, max: 95 } },
    { age_min: 42, age_max: 49, low: { min: 65, max: 70, inverse: true }, high: { min: 95, max: 100 } },
    { age_min: 49, age_max: 56, low: { min: 70, max: 75, inverse: true }, high: { min: 100, max: 105 } },
    { age_min: 56, age_max: 63, low: { min: 75, max: 80, inverse: true }, high: { min: 105, max: 110 } },
    { age_min: 63, age_max: 70, low: { min: 80, max: 85, inverse: true }, high: { min: 110, max: 115 } },
    { age_min: 70, age_max: 77, low: { min: 85, max: 90, inverse: true }, high: { min: 115, max: 120 } },
    { age_min: 77, age_max: 84, low: { min: 90, max: 95, inverse: true }, high: { min: 120, max: 125 } },
    { age_min: 84, age_max: 91, low: { min: 95, max: 100, inverse: true }, high: { min: 125, max: 130 } },
    { age_min: 91, age_max: 98, low: { min: 100, max: 105, inverse: true }, high: { min: 130, max: 135 } },
    { age_min: 98, age_max: 105, low: { min: 105, max: 110, inverse: true }, high: { min: 135, max: 140 } },
    { age_min: 105, age_max: 112, low: { min: 110, max: 115, inverse: true }, high: { min: 140, max: 145 } },
    { age_min: 112, age_max: 120, low: { min: 115, max: 120, inverse: true }, high: { min: 145, max: 150 } },
  ],
  digital_reflections: [
    { age_min: 21, age_max: 28, high: { min: 45, max: 50, inverse: true } },
    { age_min: 28, age_max: 35, high: { min: 35, max: 45, inverse: true } },
    { age_min: 35, age_max: 42, high: { min: 30, max: 35, inverse: true } },
    { age_min: 42, age_max: 49, high: { min: 25, max: 30, inverse: true } },
    { age_min: 49, age_max: 56, high: { min: 20, max: 25, inverse: true } },
    { age_min: 56, age_max: 63, high: { min: 15, max: 20, inverse: true } },
    { age_min: 63, age_max: 70, high: { min: 10, max: 15, inverse: true } },
    { age_min: 70, age_max: 77, high: { min: 8, max: 10, inverse: true } },
    { age_min: 77, age_max: 84, high: { min: 6, max: 8, inverse: true } },
    { age_min: 84, age_max: 91, high: { min: 4, max: 6, inverse: true } },
    { age_min: 91, age_max: 98, high: { min: 3, max: 4, inverse: true } },
    { age_min: 98, age_max: 105, high: { min: 2, max: 3, inverse: true } },
    { age_min: 105, age_max: 112, high: { min: 1, max: 2, inverse: true } },
    { age_min: 112, age_max: 120, high: { min: 0, max: 1, inverse: true } },
  ],
};

/**
 * Calcula la edad biológica para un único ítem del test biofísico.
 * @param paramName - El nombre del parámetro a calcular.
 * @param value - El valor numérico del parámetro.
 * @param gender - El género del paciente.
 * @returns La edad biológica calculada o null si no se puede determinar.
 */
const calculateBiophysicalAgeForItem = (
  paramName: BiophysicsTestKeys,
  value: number,
  gender: Gender
): number | null => {
  let paramConfigKey = paramName;

  // Manejo especial para % Grasa que depende del género
  if (paramName === 'fat') {
    paramConfigKey = gender === 'MALE' ? 'male_fat' : 'fat';
  }

  const paramConfig = BAREMO_BIOFISICO[paramConfigKey as keyof typeof BAREMO_BIOFISICO];

  if (!paramConfig) {
    console.warn(`No se encontró configuración en el baremo para el parámetro: ${paramName}`);
    return null; // No hay configuración para este parámetro
  }

  // Encontrar el rango de edad correcto para el valor dado
  for (const config of paramConfig) {
    // Comprobar si el valor cae en el rango BAJO (si existe)
    if (config.low && value >= config.low.min && value <= config.low.max) {
      return interpolateAge(value, config.low.min, config.low.max, config.age_min, config.age_max, config.low.inverse);
    }
    // Comprobar si el valor cae en el rango ALTO (si existe)
    if (config.high && value >= config.high.min && value <= config.high.max) {
      return interpolateAge(value, config.high.min, config.high.max, config.age_min, config.age_max, config.high.inverse);
    }
  }

  // --- MANEJO DE VALORES FUERA DE TODOS LOS RANGOS (EXTREMOS) ---
  // Si el valor es menor que el mínimo absoluto o mayor que el máximo absoluto.
  const firstRange = paramConfig[0];
  const lastRange = paramConfig[paramConfig.length - 1];

  const absoluteMin = firstRange.low?.min ?? firstRange.high?.min;
  const absoluteMax = lastRange.high?.max ?? lastRange.low?.max;

  // Valor por debajo del mínimo absoluto
  if (absoluteMin !== undefined && value < absoluteMin) {
    // Si hay un rango bajo, significa curva en U. Un valor muy bajo es malo.
    // Se le asigna la edad del primer rango (el más joven).
    // Si la curva es inversa en el lado bajo, un valor más bajo da una edad mayor.
    if (firstRange.low?.inverse) return firstRange.age_max;
    return firstRange.age_min;
  }

  // Valor por encima del máximo absoluto
  if (absoluteMax !== undefined && value > absoluteMax) {
    // Un valor muy alto siempre corresponde a la edad máxima del último rango.
    return lastRange.age_max;
  }

  console.warn(`El valor ${value} para el parámetro ${paramName} está en un hueco no definido en el baremo.`);
  return null; // El valor está en un "hueco" entre rangos definidos
};

/**
 * Calcula los resultados completos del test biofísico a partir de los datos del formulario.
 * @param formData - Los datos del formulario del test.
 * @param gender - El género del paciente.
 * @returns Un array con los resultados calculados para cada parámetro.
 */
export const calculateBiophysicalTestResults = (
  formData: BiophysicsFormData,
  gender: Gender
): BiophysicsResult[] => {
  const results = Object.entries(formData).map(([key, formValue]) => {
    const paramName = key as BiophysicsTestKeys;
    const numericValue = typeof formValue === 'string' ? parseFloat(formValue) : formValue;

    if (isNaN(numericValue)) {
      return {
        parameter: paramName,
        value: formValue,
        biologicalAge: null,
        score: 0,
      };
    }

    const biologicalAge = calculateBiophysicalAgeForItem(
      paramName,
      numericValue,
      gender
    );

    return {
      parameter: paramName,
      value: numericValue,
      biologicalAge: biologicalAge,
      score: biologicalAge ? biologicalAge / Object.keys(formData).length : 0,
    };
  });

  return results;
};


// ===================================================================================
// FUNCIONES DE AYUDA PARA LA INTERFAZ (UI HELPERS)
// ===================================================================================

/**
 * Determina el estado de envejecimiento basado en la diferencia de edad.
 * @param differentialAge - La diferencia entre la edad biológica y la cronológica.
 * @returns El estado de envejecimiento como 'REJUVENECIDO', 'NORMAL', o 'ENVEJECIDO'.
 */
export function getAgeStatus(differentialAge: number): AgeStatus {
    if (differentialAge <= AGE_DIFF_RANGES.NORMAL_MIN) return 'REJUVENECIDO';
    if (differentialAge > AGE_DIFF_RANGES.NORMAL_MIN && differentialAge < AGE_DIFF_RANGES.NORMAL_MAX) return 'NORMAL';
    return 'ENVEJECIDO';
}

/**
 * Devuelve la clase de color de Tailwind CSS correspondiente a un estado de envejecimiento.
 * @param status - El estado de envejecimiento.
 * @returns Una cadena con la clase de Tailwind para el color del texto.
 */
export function getStatusColor(status: AgeStatus): string {
    const colorMap: Record<AgeStatus, string> = {
      REJUVENECIDO: 'text-status-green',
      NORMAL: 'text-status-yellow',
      ENVEJECIDO: 'text-status-red',
    };
    return colorMap[status] || 'text-gray-500';
}
