// src/types/guide.ts
export { GuideItemType } from '@prisma/client';

export type RemocionAlimentacionType = 'Niño' | 'Antienvejecimiento' | 'Antidiabética' | 'Metabólica' | 'Citostática' | 'Renal';

export type NoniAloeVeraTime =
  | '30 minutos antes de Desayuno'
  | '30 minutos antes de Desayuno y Cena'
  | '30 minutos antes de la Cena';

export type MetabolicHorario =
  | '30 min antes del Desayuno'
  | '30 min antes del Almuerzo'
  | '30 min antes de la Cena'
  | '30 min antes del Desayuno y Cena'
  | 'o cada 15 min durante 1h en crisis';

export type SueroFrecuencia = 'Diaria' | 'Semanal' | 'Quincenal' | 'Mensual';

export interface StandardGuideItem {
  id: string;
  name: string;
  dose?: string | null;
}

export interface RemocionItem extends StandardGuideItem {
  subType: 'aceite_ricino' | 'leche_magnesia' | 'detox_alcalina' | 'noni_aloe';
}

export interface RevitalizationGuideItem {
  id: string;
  name: string;
}

export interface MetabolicActivatorItem {
  id: string;
  name: string;
}

export interface MetabolicActivator {
  id: 'cat_activador';
  homeopathy: MetabolicActivatorItem[];
  bachFlowers: MetabolicActivatorItem[];
}

export interface GuideCategory {
  id: string;
  title: string;
  type: 'STANDARD' | 'METABOLIC' | 'REVITALIZATION' | 'REMOCION' | 'SUERO' | 'BIONEURAL';
  items:
  | (StandardGuideItem | RemocionItem)[]
  | RevitalizationGuideItem[]
  | [MetabolicActivator];
}

export interface StandardFormItem {
  selected?: boolean;
  qty?: string;
  doseType?: 'Capsulas' | 'Tabletas';
  freq?: string;
  custom?: string;
  personalizacion?: string; // ej: "(5HTP o Ashwaganda)"
  isClinicalPriority?: boolean;
}

export interface RevitalizationFormItem {
  selected?: boolean;
  complejoB_cc?: string;
  otroMedicamento?: 'Bioquel' | 'Procaína' | 'Otro';
  otroMedicamento_custom?: string;
  otro_cc?: string;
  vecesXSemana?: number;
  totalDosis?: number;
}

export interface MetabolicFormItem {
  selected?: boolean;
  gotas?: number;
  vecesAlDia?: number;
  horario?: MetabolicHorario[];
}

export interface RemocionFormItem {
  selected?: boolean;
  cucharadas?: number;
  horario?: 'en el día' | 'en la tarde' | 'al acostarse (1 sola vez)';
  semanas?: number;
  alimentacionTipo?: RemocionAlimentacionType[];
  tacita_qty?: number;
  tacita?: NoniAloeVeraTime;
  frascos?: number;
}

export interface SueroFormItem {
  selected?: boolean;
  dosis?: string;
  frecuencia?: SueroFrecuencia;
}

export interface BioNeuralFormItem {
  selected?: boolean;
  dosis?: string;
}

export type Selections = Record<string, StandardFormItem | RevitalizationFormItem | MetabolicFormItem | RemocionFormItem | SueroFormItem | BioNeuralFormItem>;

export interface GuideFormValues {
  guideDate: string;
  selections: Selections;
  observaciones?: string;
}