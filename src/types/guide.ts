// src/types/guide.ts
// 1. Re-exportamos el enum de Prisma para que coincida exactamente
export { GuideItemType } from '@prisma/client';

// 2. Modelos de datos de guía
export interface StandardGuideItem {
  id: string;
  name: string;
  dose?: string | null;
}

export interface RevitalizationGuideItem {
  id: string;
  name: string;
}

export interface MetabolicActivatorItem {
  id: string;
  name: string;
}

// Agrupación para METABOLIC
export interface MetabolicActivator {
  id: 'cat_activador';
  homeopathy: MetabolicActivatorItem[];
  bachFlowers: MetabolicActivatorItem[];
}

// Categoría principal
export interface GuideCategory {
  id: string;
  title: string;
  type: 'STANDARD' | 'METABOLIC' | 'REVITALIZATION';
  items:
    | StandardGuideItem[]
    | RevitalizationGuideItem[]
    | [MetabolicActivator];
}

// 3. Formularios / selecciones
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
  frequency?: string;
}

export interface MetabolicFormItem {
  selected?: boolean;
}

export type Selections = Record<
  string,
  StandardFormItem | RevitalizationFormItem | MetabolicFormItem
>;

// 4. Formulario global
export interface GuideFormValues {
  guideDate: string;
  selections: Selections;
  metabolicActivator?: {
    homeopathy: Record<string, { selected: boolean }>;
    bachFlowers: Record<string, { selected: boolean }>;
  };
  customItems?: Array<{
    categoryId: string;
    name: string;
    qty?: string;
    freq?: string;
    custom?: string;
  }>;
}