// src/types/nutrition.ts
import type { 
    FoodItem as PrismaFoodItem, 
    MealType, 
    BloodTypeGroup, 
    GeneralGuideItem as PrismaGeneralGuideItem, 
    WellnessKey as PrismaWellnessKey, 
    DietType, 
    GeneralGuideType 
} from '@prisma/client';

// Re-exportar los enums para usarlos como valores en el código
export { MealType, BloodTypeGroup, DietType, GeneralGuideType };

// Re-exportar los tipos para anotaciones
export type { DietType as DietTypeEnum };

// Interfaces extendidas para el uso en la aplicación
export interface FoodItem extends PrismaFoodItem {}
export interface GeneralGuideItem extends PrismaGeneralGuideItem {}
export interface WellnessKey extends PrismaWellnessKey {}

// Estructura para la plantilla de alimentos, agrupada por tipo de comida
export type FoodPlanTemplate = {
  [key in MealType]: FoodItem[];
};

// Estructura para los datos completos de la guía de nutrición
export interface FullNutritionData {
  foodTemplate: FoodPlanTemplate;
  generalGuide: {
    AVOID: GeneralGuideItem[];
    SUBSTITUTE: GeneralGuideItem[];
  };
  wellnessKeys: WellnessKey[];
}