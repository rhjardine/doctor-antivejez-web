// src/types/guide.ts

// --- TIPOS DE DATOS PARA LA GUÍA DEL PACIENTE ---

/** Ítem estándar en una categoría de la guía (ej. Nutraceuticos) */
export type GuideItem = { 
  id: string; 
  name: string; 
  dose?: string; 
};

/** Ítem específico para las subcategorías de Activador Metabólico */
export type MetabolicActivatorItem = { 
  id: string; 
  name: string; 
};

/**
 * Estructura completa de los datos de la guía.
 * Es un objeto donde cada clave es una categoría.
 * El valor puede ser un array de ítems o un objeto con subcategorías.
 */
export type GuideData = {
  [key: string]: GuideItem[] | { 
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
