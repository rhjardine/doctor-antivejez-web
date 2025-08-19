// src/types/guide.ts
export { GuideItemType } from '@prisma/client';

// --- Nuevos tipos para campos específicos ---
export type RemocionAlimentacionType = 'Niño' | 'Antienvejecimiento' | 'Antidiabética' | 'Metabólica' | 'Citostática' | 'Renal';
export type NoniAloeVeraTime = '30 minutos antes de Desayuno' | 'Desayuno y Cena' | 'Cena';

// --- Items de la Guía ---
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

// --- Categorías de la Guía ---
export interface GuideCategory {
  id: string;
  title: string;
  type: 'STANDARD' | 'METABOLIC' | 'REVITALIZATION' | 'REMOCION';
  items:
    | StandardGuideItem[]
    | RevitalizationGuideItem[]
    | RemocionItem[]
    | [MetabolicActivator];
}

// --- Tipos para los valores del Formulario ---
export interface StandardFormItem {
  selected?: boolean;
  qty?: string;
  freq?: string;
  custom?: string;
}

export interface RevitalizationFormItem {
  selected?: boolean;
  complejoB_cc?: string;
  bioquel_cc?: string;
  frequency?: '1 vez por semana por 10 dosis' | '2 veces por semana por 10 dosis' | '';
}

// ===== NUEVO: Se añade el tipo para el formulario del Activador Metabólico =====
export interface MetabolicFormItem {
  selected?: boolean;
  gotas?: number;
  vecesAlDia?: number;
  horario?: 'Desayuno y Cena' | 'Emergencia';
}
// ========================================================================

export interface RemocionFormItem {
  selected?: boolean;
  cucharadas?: number;
  horario?: 'Dia' | 'Tarde' | 'Noche';
  semanas?: number;
  alimentacionTipo?: RemocionAlimentacionType[];
  tacita?: NoniAloeVeraTime;
  frascos?: number;
}

export type Selections = Record<string, StandardFormItem | RevitalizationFormItem | MetabolicFormItem | RemocionFormItem>;

export interface GuideFormValues {
  guideDate: string;
  selections: Selections;
  observaciones?: string;
  terapiaBioNeural?: {
    nombre: string;
    dosis: string;
  };
  controlTerapia?: {
    fecha: string;
    terapia: string;
    coach: string;
  }[];
}