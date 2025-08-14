import type { GuideItemType as PrismaGuideItemType } from '@prisma/client';

// Re-exportamos el enum para usarlo en toda la aplicación.
export const GuideItemType = {
  STANDARD: 'STANDARD',
  METABOLIC: 'METABOLIC',
  REVITALIZATION: 'REVITALIZATION',
} as const;
export type GuideItemType = PrismaGuideItemType;

// --- Interfaces para la estructura de datos que viene de la BD ---

interface BaseItem {
  id: string;
  name: string;
  dose?: string | null;
}

export interface StandardGuideItem extends BaseItem {}
export interface RevitalizationGuideItem extends BaseItem {}
export interface MetabolicSubItem extends BaseItem {}

// ===== CORRECCIÓN 2: Exportar el tipo MetabolicActivatorItem para que pueda ser importado =====
export type MetabolicActivatorItem = MetabolicSubItem;
// ===== FIN DE LA CORRECCIÓN 2 =====

export interface MetabolicActivator {
  id: 'cat_activador';
  homeopathy: MetabolicSubItem[];
  bachFlowers: MetabolicSubItem[];
}

export interface GuideCategory {
  id: string;
  title: string;
  type: GuideItemType;
  items: (StandardGuideItem | RevitalizationGuideItem | MetabolicActivator)[];
}

// --- Interfaces para los datos del formulario ---

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

export type CustomItem = {
  categoryId: string;
  name: string;
  qty?: string;
  freq?: string;
  custom?: string;
};

export type GuideFormValues = {
  guideDate: string;
  selections: Selections;
  metabolic_activator?: {
    homeopathy: Record<string, { selected: boolean }>;
    bachFlowers: Record<string, { selected: boolean }>;
  };
  customItems?: CustomItem[];
};