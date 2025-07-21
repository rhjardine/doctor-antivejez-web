export interface FormValues {
  fatPercentage?: number;
  bmi?: number;
  // --- CORRECCIÓN: Se permite que las dimensiones sean opcionales ---
  // Esto alinea el tipo con el estado inicial del formulario, que puede
  // tener valores indefinidos antes de que el usuario los ingrese.
  digitalReflexes?: {
    high?: number;
    long?: number;
    width?: number;
  };
  visualAccommodation?: number;
  staticBalance?: {
    high?: number;
    long?: number;
    width?: number;
  };
  // --- FIN DE LA CORRECCIÓN ---
  skinHydration?: number;
  systolicPressure?: number;
  diastolicPressure?: number;
}

export interface PartialAges {
  fatAge?: number;
  bmiAge?: number;
  reflexesAge?: number;
  visualAge?: number;
  balanceAge?: number;
  hydrationAge?: number;
  systolicAge?: number;
  diastolicAge?: number;
}

export interface CalculationResult {
  biologicalAge: number;
  differentialAge: number;
  partialAges: PartialAges;
}

export interface BoardWithRanges {
  id: string;
  rangeId: number;
  type: string;
  name: string;
  minValue: number;
  maxValue: number;
  inverse: boolean;
  range: {
    id: number;
    minAge: number;
    maxAge: number;
  };
}

export const BIOPHYSICS_ITEMS = [
  { key: 'fatPercentage', label: '% Grasa', unit: '%', hasDimensions: false },
  { key: 'bmi', label: 'IMC', unit: '', hasDimensions: false },
  { key: 'digitalReflexes', label: 'Reflejos Digitales', unit: 'cm', hasDimensions: true },
  { key: 'visualAccommodation', label: 'Acomodación Visual', unit: 'cm', hasDimensions: false },
  { key: 'staticBalance', label: 'Balance Estático', unit: 'seg', hasDimensions: true },
  { key: 'skinHydration', label: 'Hidratación Cutánea', unit: 'seg', hasDimensions: false },
  { key: 'systolicPressure', label: 'Tensión Arterial Sistólica', unit: 'mmHg', hasDimensions: false },
  { key: 'diastolicPressure', label: 'Tensión Arterial Diastólica', unit: 'mmHg', hasDimensions: false },
] as const;

export const GENDER_OPTIONS = [
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'FEMENINO', label: 'Femenino' },
  { value: 'MASCULINO_DEPORTIVO', label: 'Masculino Deportivo' },
  { value: 'FEMENINO_DEPORTIVO', label: 'Femenino Deportivo' },
] as const;
