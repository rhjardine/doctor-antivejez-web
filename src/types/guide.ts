// src/types/guide.ts

// --- TIPOS DE DATOS REFACTORIZADOS PARA LA GUÍA DEL PACIENTE ---

/** Ítem estándar con dosis opcional (Nutracéuticos, Terapias, etc.) */
export type StandardGuideItem = {
  id: string;
  name: string;
  dose?: string; // La dosis es opcional y solo para este tipo de ítem.
};

/** Ítem para las subcategorías de Activador Metabólico (sin dosis) */
export type MetabolicActivatorItem = {
  id: string;
  name: string;
};

/**
 * Define la estructura de una categoría. Usamos un 'type' como discriminador
 * para que TypeScript sepa qué tipo de ítems contiene cada categoría.
 */
export type GuideCategory = {
  id: string; // Identificador único para la categoría
  title: string;
  // El 'type' nos permite diferenciar entre una categoría estándar y la metabólica
  type: 'standard' | 'metabolic'; 
  // 'items' puede ser un array de ítems estándar o un objeto con las subcategorías
  items: StandardGuideItem[] | {
    homeopathy: MetabolicActivatorItem[];
    bachFlowers: MetabolicActivatorItem[];
  };
};

/** Estructura para almacenar las selecciones del usuario en el formulario */
export type Selections = Record<string, {
  selected: boolean;
  qty?: string;
  freq?: string;
  custom?: string;
}>;
