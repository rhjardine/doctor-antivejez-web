// src/types/guide.ts
export { GuideItemType } from '@prisma/client';

// Items
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

export interface MetabolicActivator {
  id: 'cat_activador';
  homeopathy: MetabolicActivatorItem[];
  bachFlowers: MetabolicActivatorItem[];
}

// Categorías
export interface GuideCategory {
  id: string;
  title: string;
  type: 'STANDARD' | 'METABOLIC' | 'REVITALIZATION';
  items:
    | StandardGuideItem[]
    | RevitalizationGuideItem[]
    | [MetabolicActivator];
}

// Formularios
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

export type Selections = Record<string, StandardFormItem | RevitalizationFormItem | MetabolicFormItem>;

export interface GuideFormValues {
  guideDate: string;
  selections: Selections;
  metabolic_activator?: {
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