// src/types/biochemistry.ts

/**
 * Define la estructura de los valores del formulario para el test bioquímico.
 * Los campos son opcionales para permitir un llenado progresivo.
 */
export interface BiochemistryFormValues {
  somatomedin?: number;
  hba1c?: number;
  insulin?: number;
  postPrandial?: number;
  tgHdlRatio?: number;
  dhea?: number;
  homocysteine?: number;
  psa?: number;
  fsh?: number;
  boneDensitometry?: {
    field1: number;
    field2: number;
  };
}

/**
 * Define la estructura para almacenar las edades calculadas para cada
 * parámetro individual del test.
 */
export interface BiochemistryPartialAges {
  somatomedinAge?: number;
  hba1cAge?: number;
  insulinAge?: number;
  postPrandialAge?: number;
  tgHdlRatioAge?: number;
  dheaAge?: number;
  homocysteineAge?: number;
  psaAge?: number;
  fshAge?: number;
  boneDensitometryAge?: number;
}

/**
 * Define la estructura del resultado final del cálculo.
 */
export interface BiochemistryCalculationResult {
  biochemicalAge: number;
  partialAges: BiochemistryPartialAges;
}
