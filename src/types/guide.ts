// src/types/guide.ts

// Define los posibles tipos de ítems en la guía
export enum GuideItemType {
  SIMPLE = 'SIMPLE',
  REVITALIZATION = 'REVITALIZATION',
}

// Interfaz base para todos los ítems
interface BaseGuideItem {
  id: string;
  type: GuideItemType;
  selected: boolean;
}

// Interfaz para un ítem simple (la mayoría de los casos)
export interface SimpleGuideItem extends BaseGuideItem {
  type: GuideItemType.SIMPLE;
  text: string;
  description?: string;
}

// Interfaz específica para el ítem de la Fase de Revitalización
export interface RevitalizationGuideItem extends BaseGuideItem {
  type: GuideItemType.REVITALIZATION;
  label: string; // "Complejo B + Bioquel"
  complejoB_cc: string;
  bioquel_cc: string;
  frequency: string;
}

// Usamos una unión discriminada para que TypeScript entienda qué tipo de ítem es
export type GuideItem = SimpleGuideItem | RevitalizationGuideItem;

// La estructura de la categoría ahora contiene una lista de estos nuevos ítems
export interface GuideCategory {
  id: string;
  title: string;
  items: GuideItem[];
  isOpen: boolean;
}

// El tipo principal para la guía del paciente
export interface PatientGuide {
  patientId: string;
  categories: GuideCategory[];
}
