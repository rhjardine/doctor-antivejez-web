// src/types/guide.ts

// Se mantiene tu excelente enfoque con un enum para discriminar los tipos de ítem.
export enum GuideItemType {
  SIMPLE = 'SIMPLE',
  METABOLIC = 'METABOLIC', // Añadido para completitud
  REVITALIZATION = 'REVITALIZATION',
}

// --- Interaces para cada tipo de ítem ---

// Interfaz base para todos los ítems
interface BaseGuideItem {
  id: string;
  name: string; // Usamos 'name' para consistencia con el resto de la app
}

// Interfaz para un ítem simple (la mayoría de los casos)
export interface SimpleGuideItem extends BaseGuideItem {
  type: GuideItemType.SIMPLE;
  dose?: string;
}

// Interfaz para el ítem del Activador Metabólico
export interface MetabolicGuideItem extends BaseGuideItem {
    type: GuideItemType.METABOLIC;
    subItems: {
        homeopathy: { id: string, name: string }[];
        bachFlowers: { id: string, name: string }[];
    }
}

// Interfaz específica para el ítem de la Fase de Revitalización
export interface RevitalizationGuideItem extends BaseGuideItem {
  type: GuideItemType.REVITALIZATION;
  // Los campos de datos (complejoB_cc, etc.) se manejarán en el estado 'selections'
}

// Unión discriminada para que TypeScript entienda qué tipo de ítem es
export type GuideItem = SimpleGuideItem | MetabolicGuideItem | RevitalizationGuideItem;

// La estructura de la categoría ahora contiene una lista de estos nuevos ítems
export interface GuideCategory {
  id: string;
  title: string;
  items: GuideItem[];
}

// --- DEFINICIÓN CRÍTICA Y NECESARIA ---
// Este es el tipo que faltaba en tu versión y que causa el error de build.
// Define la forma del objeto 'selections' que almacena las elecciones del usuario.
export type Selections = Record<string, {
  selected?: boolean;
  qty?: string;
  freq?: string;
  custom?: string;
  complejoB_cc?: string;
  bioquel_cc?: string;
  frequency?: string;
  // Para el activador metabólico, podemos guardar las selecciones de sub-items
  homeopathySelection?: string;
  bachFlowersSelection?: string;
}>;
