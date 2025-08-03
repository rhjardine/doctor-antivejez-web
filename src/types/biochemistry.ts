export const BIOCHEMISTRY_ITEMS = [
  { key: 'somatomedinC', label: 'Somatomedina C (IGF-1)', unit: 'ng/ml' },
  { key: 'hba1c', label: 'Hemoglobina Glicosilada (HbA1c)', unit: '%' },
  { key: 'insulinBasal', label: 'Insulina Basal', unit: 'mUI/ml' },
  { key: 'dheaS', label: 'DHEA-S', unit: 'µg/dl' },
  { key: 'freeTestosterone', label: 'Testosterona Libre', unit: 'pg/ml' },
  { key: 'shbg', label: 'SHBG', unit: 'nmol/l' },
  { key: 'prostateAntigen', label: 'Antígeno Prostático (PSA)', unit: 'ng/ml' },
  { key: 'uricAcid', label: 'Ácido Úrico', unit: 'mg/dl' },
  { key: 'ferritin', label: 'Ferritina', unit: 'ng/ml' },
  { key: 'vitaminD', label: 'Vitamina D (25-OH)', unit: 'ng/ml' },
  { key: 'homocysteine', label: 'Homocisteína', unit: 'µmol/l' },
  { key: 'pcr', label: 'Proteína C Reactiva (PCR)', unit: 'mg/l' },
  { key: 'fibrinogen', label: 'Fibrinógeno', unit: 'mg/dl' },
  { key: 'triglycerides', label: 'Triglicéridos', unit: 'mg/dl' },
  { key: 'hdl', label: 'Colesterol HDL', unit: 'mg/dl' },
  { key: 'tgHdlRatio', label: 'Relación TG/HDL', unit: '' },
] as const;

// Tipos generados a partir del array de constantes para mantener la consistencia
type BiochemistryItemKey = typeof BIOCHEMISTRY_ITEMS[number]['key'];

export type BiochemistryFormValues = {
  [K in BiochemistryItemKey]?: number;
};

export type BiochemistryPartialAges = {
  [K in `${BiochemistryItemKey}Age`]?: number;
};

export interface BiochemistryCalculationResult {
  biologicalAge: number;
  differentialAge: number;
  partialAges: BiochemistryPartialAges;
  statuses: Record<BiochemistryItemKey, ResultStatus>;
}

export type ResultStatus = 'OPTIMAL' | 'SUBOPTIMAL' | 'HIGH_RISK';

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
