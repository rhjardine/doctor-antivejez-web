export const BIOCHEMISTRY_ITEMS = [
  { key: 'somatomedinC', label: 'Somatomedina C (IGF-1)', unit: 'ng/ml', placeholder: 'e.g., 250' },
  { key: 'hba1c', label: 'Hemoglobina Glicosilada (HbA1c)', unit: '%', placeholder: 'e.g., 5.2' },
  { key: 'insulinBasal', label: 'Insulina Basal', unit: 'mUI/ml', placeholder: 'e.g., 8' },
  { key: 'dheaS', label: 'DHEA-S', unit: 'µg/dl', placeholder: 'e.g., 300' },
  { key: 'freeTestosterone', label: 'Testosterona Libre', unit: 'pg/ml', placeholder: 'e.g., 40' },
  { key: 'shbg', label: 'SHBG', unit: 'nmol/l', placeholder: 'e.g., 40' },
  { key: 'prostateAntigen', label: 'Antígeno Prostático (PSA)', unit: 'ng/ml', placeholder: 'e.g., 1.5' },
  { key: 'uricAcid', label: 'Ácido Úrico', unit: 'mg/dl', placeholder: 'e.g., 5.0' },
  { key: 'ferritin', label: 'Ferritina', unit: 'ng/ml', placeholder: 'e.g., 120' },
  { key: 'vitaminD', label: 'Vitamina D (25-OH)', unit: 'ng/ml', placeholder: 'e.g., 40' },
  { key: 'homocysteine', label: 'Homocisteína', unit: 'µmol/l', placeholder: 'e.g., 8.5' },
  { key: 'pcr', label: 'Proteína C Reactiva (PCR)', unit: 'mg/l', placeholder: 'e.g., 1.5' },
  { key: 'fibrinogen', label: 'Fibrinógeno', unit: 'mg/dl', placeholder: 'e.g., 350' },
  { key: 'triglycerides', label: 'Triglicéridos', unit: 'mg/dl', placeholder: 'e.g., 120' },
  { key: 'hdl', label: 'Colesterol HDL', unit: 'mg/dl', placeholder: 'e.g., 50' },
  { key: 'tgHdlRatio', label: 'Relación TG/HDL', unit: '', placeholder: 'e.g., 1.5' },
] as const;

// Tipos generados a partir del array de constantes para mantener la consistencia
type BiochemistryItemKey = typeof BIOCHEMISTRY_ITEMS[number]['key'];

export type BiochemistryFormValues = {
  [K in BiochemistryItemKey]?: number;
};

export type BiochemistryPartialAges = {
  [K in `${BiochemistryItemKey}Age`]?: number;
};

// ===== INICIO DE LA CORRECCIÓN =====
// Se añade 'NO_DATA' al tipo ResultStatus para manejar correctamente
// los casos donde un biomarcador no ha sido calculado.
export type ResultStatus = 'OPTIMAL' | 'SUBOPTIMAL' | 'HIGH_RISK' | 'NO_DATA';
// ===== FIN DE LA CORRECCIÓN =====

export interface BiochemistryCalculationResult {
  biologicalAge: number;
  differentialAge: number;
  partialAges: BiochemistryPartialAges;
  status: ResultStatus;
}

export interface BoardWithRanges {
  id: string;
  name: string;
  minValue: number;
  maxValue: number;
  inverse: boolean;
  rangeId: number;
  type: 'FORM_BIOPHYSICS' | 'FORM_BIOCHEMISTRY';
  range: {
    id: number;
    minAge: number;
    maxAge: number;
  };
}
