// src/types/nutrition.ts
import { 
    FoodItem as PrismaFoodItem, 
    MealType, 
    BloodTypeGroup, 
    GeneralGuideItem as PrismaGeneralGuideItem, 
    WellnessKey as PrismaWellnessKey, 
    DietType, 
    GeneralGuideType 
} from '@prisma/client';

// ===== ANÁLISIS Y CORRECCIÓN =====
// Se exportan los enums de Prisma para que estén disponibles en tiempo de ejecución.
// Esto es crucial para poder iterar sobre ellos en componentes, como en el selector de dietas.
export { MealType, BloodTypeGroup, DietType, GeneralGuideType };
export type { DietType as DietTypeEnum };

// Se exportan los tipos base para consistencia en toda la aplicación.
export interface FoodItem extends PrismaFoodItem {}
export interface GeneralGuideItem extends PrismaGeneralGuideItem {}
export interface WellnessKey extends PrismaWellnessKey {}

// Estructura de la plantilla de alimentos que se obtiene de la base de datos.
export type FoodPlanTemplate = {
  [key in MealType]: FoodItem[];
};

// ===== ANÁLISIS Y CORRECCIÓN =====
// Se define una interfaz única y completa, `FullNutritionData`, que contendrá TODA la información
// necesaria para la pestaña de "Alimentación Nutrigenómica". Esto simplifica el flujo de datos,
// requiriendo una sola llamada al servidor para obtener todo lo necesario.
export interface FullNutritionData {
  foodTemplate: FoodPlanTemplate;
  generalGuide: {
    AVOID: GeneralGuideItem[];
    SUBSTITUTE: GeneralGuideItem[];
  };
  wellnessKeys: WellnessKey[];
  patientData: {
    bloodTypeGroup: BloodTypeGroup;
    selectedDiets: DietType[];
    // El plan existente ahora es un Record de MealType a un array de IDs de FoodItem.
    // Es más eficiente y fácil de manejar en el estado de React.
    existingPlan: Record<MealType, string[]> | null;
    observations: string | null;
  }
}
