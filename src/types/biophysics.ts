// src/types/biophysics.ts

// --- TIPOS DE DATOS PARA EL FORMULARIO Y CÁLCULOS BIOOFÍSICOS ---

// Constante con la definición de todos los ítems del test biofísico.
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

// --- INICIO DE LA CORRECCIÓN: Tipos generados a partir de las constantes ---

// Genera un tipo unión con todas las claves de los ítems (ej: 'fatPercentage' | 'bmi' | ...)
export type BiophysicsTestKeys = typeof BIOPHYSICS_ITEMS[number]['key'];

// Define la estructura de los valores del formulario.
export interface FormValues {
  fatPercentage?: number;
  bmi?: number;
  digitalReflexes?: { high?: number; long?: number; width?: number; };
  visualAccommodation?: number;
  staticBalance?: { high?: number; long?: number; width?: number; };
  skinHydration?: number;
  systolicPressure?: number;
  diastolicPressure?: number;
}

// Alias para los datos del formulario, usado en la lógica de cálculo.
export type BiophysicsFormData = Partial<Record<BiophysicsTestKeys, any>>;

// Define la estructura del resultado del cálculo para un solo ítem.
export interface BiophysicsResult {
  parameter: BiophysicsTestKeys;
  value: any;
  biologicalAge: number | null;
  score: number;
}

// --- FIN DE LA CORRECCIÓN ---

// Define la estructura de las edades parciales calculadas.
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

// Define la estructura del resultado final del cálculo.
export interface CalculationResult {
  biologicalAge: number;
  differentialAge: number;
  partialAges: PartialAges;
}

// Define la estructura de los baremos cuando se obtienen de la base de datos.
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

// Opciones de género para los formularios.
export const GENDER_OPTIONS = [
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'FEMENINO', label: 'Femenino' },
  { value: 'MASCULINO_DEPORTIVO', label: 'Masculino Deportivo' },
  { value: 'FEMENINO_DEPORTIVO', label: 'Femenino Deportivo' },
] as const;
