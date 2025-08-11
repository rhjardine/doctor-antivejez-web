// src/types/guide.ts

/**
 * @interface BaseGuideItem
 * @description Interfaz base para cualquier ítem individual en la guía.
 * @property {string} id - Identificador único para el ítem.
 * @property {string} name - Nombre del tratamiento o producto a mostrar.
 */
export interface BaseGuideItem {
    id: string;
    name: string;
}

/**
 * @interface StandardGuideItem
 * @description Extiende BaseGuideItem para ítems que tienen una dosis predefinida.
 * @property {string} [dose] - Dosis o descripción opcional que se muestra junto al nombre.
 */
export interface StandardGuideItem extends BaseGuideItem {
    dose?: string;
}

/**
 * @interface MetabolicActivatorItem
 * @description Tipo específico para los ítems dentro de la categoría 'Activador Metabólico'.
 */
export interface MetabolicActivatorItem extends BaseGuideItem {}

/**
 * @interface RevitalizationGuideItem
 * @description Tipo específico para el ítem de la 'Fase de Revitalización'.
 */
export interface RevitalizationGuideItem extends BaseGuideItem {}

/**
 * @interface GuideCategory
 * @description Define la estructura de una categoría principal en la guía.
 * @property {'standard' | 'metabolic' | 'revitalization'} type - Discrimina el tipo de categoría para renderizarla correctamente.
 * @property {Array | Object} items - Contiene los ítems. La estructura varía según el 'type'.
 * - Para 'standard' y 'revitalization', es un array de ítems.
 * - Para 'metabolic', es un objeto con sub-categorías ('homeopathy', 'bachFlowers').
 */
export interface GuideCategory {
    id: string;
    title: string;
    type: 'standard' | 'metabolic' | 'revitalization';
    items: StandardGuideItem[] | { homeopathy: MetabolicActivatorItem[], bachFlowers: MetabolicActivatorItem[] } | RevitalizationGuideItem[];
}

/**
 * @type Selections
 * @description Define la forma del objeto de estado 'selections'.
 * Almacena todas las entradas y selecciones del usuario para cada ítem de la guía.
 * La clave del Record es el 'id' del ítem.
 */
export type Selections = Record<string, {
  selected?: boolean;      // Para todos los checkboxes
  qty?: string;            // Campo 'Cant.' para nutracéuticos
  freq?: string;           // Campo 'Frecuencia' para nutracéuticos
  custom?: string;         // Campo 'Personalizado' para nutracéuticos
  complejoB_cc?: string;   // Campo 'Complejo B' para revitalización
  bioquel_cc?: string;     // Campo 'Bioquel' para revitalización
  frequency?: string;      // Campo 'Frecuencia' para revitalización
}>;
