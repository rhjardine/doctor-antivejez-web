// src/types/biochemistry.ts

// ===== CAMBIO: Se actualiza la lista para que coincida con la tabla oficial y el schema.prisma =====
export const BIOCHEMISTRY_ITEMS = [
  { key: 'somatomedin', label: 'Somatomedina C (IGF-1)', unit: 'ng/ml' }, // Changed from 'somatomedinC' to 'somatomedin'
  { key: 'hba1c', label: 'Hb Glicosilada %(HbA1c)', unit: '%' },
  { key: 'insulin', label: 'Insulina Basal', unit: 'mUI/ml' }, // Changed from 'insulinBasal' to 'insulin'
  { key: 'postPrandial', label: 'Post Prandial', unit: 'mui/ml' },
  { key: 'tgHdlRatio', label: 'Relación TG/HDL', unit: 'mg/dl / mg/dl' },
  { key: 'dhea', label: 'DHEA-SO4', unit: 'ug/dl' }, // Changed from 'dheaS' to 'dhea'
  { key: 'homocysteine', label: 'Homocisteína', unit: 'umol/L' },
  { key: 'psa', label: 'PSA Total / Libre', unit: '%' },
  { key: 'fsh', label: 'FSH', unit: 'UI/L' },
  { key: 'boneDensitometry', label: 'Densitometría ósea', unit: 'g/cm2' },
] as const;

// ===== SOLUCIÓN: Se crea y exporta el tipo 'BiochemistryItem' a partir de la constante =====
export type BiochemistryItem = typeof BIOCHEMISTRY_ITEMS[number];
// =======================================================================================

// Tipos generados a partir del array de constantes para mantener la consistencia
type BiochemistryItemKey = typeof BIOCHEMISTRY_ITEMS[number]['key'];

export type BiochemistryFormValues = {
  [K in BiochemistryItemKey]?: number;
};

export type BiochemistryPartialAges = {
  [K in `${BiochemistryItemKey}Age`]?: number;
};

// Se ajusta el tipo para que coincida con la lógica de estado solicitada
export type ResultStatus = 'REJUVENECIDO' | 'NORMAL' | 'ENVEJECIDO' | 'SIN CALCULAR';

export interface BiochemistryCalculationResult {
  biologicalAge: number;
  differentialAge: number;
  chronologicalAge: number;
  partialAges: BiochemistryPartialAges;
  status: ResultStatus;
}
