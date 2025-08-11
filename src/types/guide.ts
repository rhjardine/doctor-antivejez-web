// src/types/guide.ts

// Se mantiene tu excelente enfoque con un enum para discriminar los tipos de ítem.
export enum GuideItemType {
  SIMPLE = 'SIMPLE',
  METABOLIC = 'METABOLIC',
  REVITALIZATION = 'REVITALIZATION',
}

// --- Interaces para cada tipo de ítem ---

// Interfaz base para todos los ítems
interface BaseGuideItem {
  id: string;
  name: string;
}

// CORRECCIÓN: Renombrado a StandardGuideItem para que coincida con la importación del componente.
export interface StandardGuideItem extends BaseGuideItem {
  type: GuideItemType.SIMPLE;
  dose?: string;
}

// CORRECCIÓN: Renombrado a MetabolicActivatorItem para que coincida con la importación del componente.
export interface MetabolicActivatorItem extends BaseGuideItem {
    type: GuideItemType.METABOLIC;
    subItems: {
        homeopathy: { id: string, name: string }[];
        bachFlowers: { id: string, name: string }[];
    }
}

// Interfaz específica para el ítem de la Fase de Revitalización
export interface RevitalizationGuideItem extends BaseGuideItem {
  type: GuideItemType.REVITALIZATION;
}

// Unión discriminada para que TypeScript entienda qué tipo de ítem es
export type GuideItem = StandardGuideItem | MetabolicActivatorItem | RevitalizationGuideItem;

// La estructura de la categoría ahora contiene una lista de estos nuevos ítems
export interface GuideCategory {
  id: string;
  title: string;
  items: GuideItem[];
}

// --- DEFINICIÓN CRÍTICA Y NECESARIA ---
// Define la forma del objeto 'selections' que almacena las elecciones del usuario.
export type Selections = Record<string, {
  selected?: boolean;
  qty?: string;
  freq?: string;
  custom?: string;
  complejoB_cc?: string;
  bioquel_cc?: string;
  frequency?: string;
  homeopathySelection?: string;
  bachFlowersSelection?: string;
}>;
