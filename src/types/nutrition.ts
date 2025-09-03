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

// ===== SOLUCIÓN: Se exporta el OBJETO 'DietType' además del TIPO =====
export { MealType, BloodTypeGroup, DietType, GeneralGuideType };
// ====================================================================

// También exportamos los tipos para usarlos en las definiciones
export type { DietType as DietTypeEnum };

export interface FoodItem extends PrismaFoodItem {}
export interface GeneralGuideItem extends PrismaGeneralGuideItem {}
export interface WellnessKey extends PrismaWellnessKey {}

export type FoodPlanTemplate = {
  [key in MealType]: FoodItem[];
};

export interface FullNutritionData {
  foodTemplate: FoodPlanTemplate;
  generalGuide: {
    AVOID: GeneralGuideItem[];
    SUBSTITUTE: GeneralGuideItem[];
  };
  wellnessKeys: WellnessKey[];
}