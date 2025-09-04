// src/types/nutrition.ts
import type { 
    FoodItem as PrismaFoodItem, 
    MealType, 
    BloodTypeGroup, 
    GeneralGuideItem as PrismaGeneralGuideItem, 
    WellnessKey as PrismaWellnessKey, 
    GeneralGuideType 
} from '@prisma/client';

// ===== SOLUCIÓN: Definir objeto DietType con valores explícitos =====
export const DietType = {
    VEGETARIAN: 'VEGETARIAN',
    VEGAN: 'VEGAN',
    GLUTEN_FREE: 'GLUTEN_FREE',
    DAIRY_FREE: 'DAIRY_FREE',
    PALEO: 'PALEO',
    KETO: 'KETO',
    LOW_CARB: 'LOW_CARB',
    LOW_FAT: 'LOW_FAT',
} as const;

// Exportar el tipo basado en los valores del objeto
export type DietTypeEnum = keyof typeof DietType;

// Exportar tipos y enums de Prisma
export { MealType, BloodTypeGroup, GeneralGuideType };

// Interfaces extendidas
export interface FoodItem extends PrismaFoodItem {}
export interface GeneralGuideItem extends PrismaGeneralGuideItem {}
export interface WellnessKey extends PrismaWellnessKey {}

export type FoodPlanTemplate = {
  DESAYUNO: FoodItem[];
  ALMUERZO: FoodItem[];
  CENA: FoodItem[];
  MERIENDAS_POSTRES: FoodItem[];
};

export interface FullNutritionData {
  foodTemplate: FoodPlanTemplate;
  generalGuide: {
    AVOID: GeneralGuideItem[];
    SUBSTITUTE: GeneralGuideItem[];
  };
  wellnessKeys: WellnessKey[];
}