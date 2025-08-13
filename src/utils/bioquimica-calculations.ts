// src/utils/bioquimica-calculations.ts
import {
  BiochemistryFormValues,
  BiochemistryCalculationResult,
  BiochemistryPartialAges,
  ResultStatus,
  BIOCHEMISTRY_ITEMS,
} from '@/types/biochemistry';
import { AGE_DIFF_RANGES } from '@/lib/constants';

/**
 * Calcula la edad para un biomarcador específico basado en una tabla de rangos.
 * Esta es una implementación de ejemplo. La lógica real debe basarse en los baremos
 * proporcionados en el PDF. Por simplicidad, aquí se usa una lógica lineal.
 * NOTA: Esta función debe ser reemplazada por la lógica de baremos real.
 */
function getAgeFromValue(value: number, key: keyof BiochemistryFormValues, chronologicalAge: number): number {
    // Lógica de ejemplo: A mayor valor, mayor edad (excepto para HDL, DHEA, etc.)
    // Esta es una simplificación y debe ser reemplazada por la lógica de baremos del PDF.
    const baseAge = chronologicalAge;
    let calculatedAge = baseAge + (value / 10); // Ejemplo simple
    
    // Invertir para valores donde "más es mejor"
    if (key === 'dheaS' || key === 'hdl' || key === 'somatomedinC') {
        calculatedAge = baseAge - (value / 20);
    }

    return Math.max(21, Math.min(120, calculatedAge)); // Limitar edad entre 21 y 120
}

/**
 * Determina el estado (Óptimo, Normal, Riesgo) de un biomarcador basado en la
 * diferencia entre su edad calculada y la edad cronológica del paciente.
 * ESTA ES LA LÓGICA SOLICITADA.
 */
export function getBiochemistryStatus(
  calculatedAge: number,
  chronologicalAge: number
): ResultStatus {
  const difference = calculatedAge - chronologicalAge;

  if (difference <= AGE_DIFF_RANGES.REJUVENECIDO) {
    return 'OPTIMAL'; // Rejuvenecido (Verde)
  }
  if (difference >= AGE_DIFF_RANGES.ENVEJECIDO) {
    return 'HIGH_RISK'; // Envejecido (Rojo)
  }
  // Cualquier otro caso se considera Normal (Amarillo)
  return 'SUBOPTIMAL';
}

/**
 * Devuelve la clase de color de Tailwind CSS correspondiente a un estado.
 * @param isBackground - Si es true, devuelve la clase de fondo (bg-), si no, de texto (text-).
 */
export function getStatusColorClass(status: ResultStatus, isBackground: boolean = false): string {
  const colorMap = {
    OPTIMAL: { bg: 'bg-status-green', text: 'text-status-green' },
    SUBOPTIMAL: { bg: 'bg-status-yellow', text: 'text-status-yellow' },
    HIGH_RISK: { bg: 'bg-status-red', text: 'text-status-red' },
    NO_DATA: { bg: 'bg-gray-400', text: 'text-gray-400' },
  };
  const style = colorMap[status] || colorMap['NO_DATA'];
  return isBackground ? style.bg : style.text;
}

/**
 * Función principal para calcular la edad bioquímica y otros resultados.
 * Utiliza la lógica de cálculo de ejemplo y la de estado solicitada.
 */
export function calculateBioquimicaResults(
  formValues: BiochemistryFormValues,
  chronologicalAge: number,
): BiochemistryCalculationResult {
  const partialAges: BiochemistryPartialAges = {};
  let totalAge = 0;
  let ageCount = 0;

  for (const item of BIOCHEMISTRY_ITEMS) {
    const key = item.key;
    const value = formValues[key];

    if (typeof value === 'number' && !isNaN(value)) {
      const calculatedAge = getAgeFromValue(value, key, chronologicalAge);
      const ageKey = `${key}Age` as keyof BiochemistryPartialAges;
      partialAges[ageKey] = calculatedAge;
      
      totalAge += calculatedAge;
      ageCount++;
    }
  }

  const biologicalAge = ageCount > 0 ? totalAge / ageCount : chronologicalAge;
  const differentialAge = biologicalAge - chronologicalAge;
  const overallStatus = getBiochemistryStatus(biologicalAge, chronologicalAge);

  return {
    biologicalAge,
    differentialAge,
    partialAges,
    status: overallStatus,
  };
}
