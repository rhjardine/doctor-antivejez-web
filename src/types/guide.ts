// src/types/guide.ts

/**
 * Define los tipos de ítems que pueden existir en la guía.
 * Esto permite renderizar diferentes campos para cada tipo.
 */
export enum GuideItemType {
  STANDARD = 'STANDARD',
  METABOLIC = 'METABOLIC',
  REVITALIZATION = 'REVITALIZATION',
}

// --- Interfaces para la estructura de datos inicial ---

interface BaseItem {
  id: string;
  name: string;
  dose?: string; // Para ítems con dosis predefinida como en "Fase de Remoción"
}

export interface StandardGuideItem extends BaseItem {}
export interface RevitalizationGuideItem extends BaseItem {}
export interface MetabolicSubItem extends BaseItem {}

export interface MetabolicActivator {
  id: 'cat_activador'; // ID Fijo para este ítem especial
  homeopathy: MetabolicSubItem[];
  bachFlowers: MetabolicSubItem[];
}

// --- Interfaces para los datos del formulario (lo que maneja react-hook-form) ---

export interface StandardFormItem {
  selected: boolean;
  qty?: string;
  freq?: string;
  custom?: string;
}

export interface RevitalizationFormItem {
  selected: boolean;
  complejoB_cc?: string;
  bioquel_cc?: string;
  frequency?: string;
}

export interface MetabolicFormItem {
  selected: boolean;
  // No necesita campos adicionales, la selección se hace a nivel de sub-ítem
}

// --- INICIO DE LA CORRECCIÓN ---
// Se añade el tipo para los ítems personalizados que se crean dinámicamente.
export type CustomItem = {
  categoryId: string;
  name: string;
  qty?: string;
  freq?: string;
  custom?: string;
};
// --- FIN DE LA CORRECCIÓN ---

// --- Estructura completa del formulario que se validará y guardará ---

export type GuideFormValues = {
  guideDate: string;
  selections: Record<string, StandardFormItem | RevitalizationFormItem | MetabolicFormItem>;
  metabolic_activator?: {
    homeopathy: Record<string, { selected: boolean }>;
    bachFlowers: Record<string, { selected: boolean }>;
  };
  // --- INICIO DE LA CORRECCIÓN ---
  // Se añade la propiedad 'customItems' para que coincida con el uso en el componente.
  customItems?: CustomItem[];
  // --- FIN DE LA CORRECCIÓN ---
};


// --- Estructura para renderizar las categorías en la UI ---

export interface GuideCategory {
  id: string;
  title: string;
  type: GuideItemType;
  items: (StandardGuideItem | RevitalizationGuideItem | MetabolicActivator)[];
}
