// src/types/nutrition.ts
import type { FoodItem as PrismaFoodItem, MealType, BloodTypeGroup, GeneralGuideItem as PrismaGeneralGuideItem, WellnessKey as PrismaWellnessKey, DietType, GeneralGuideType } from '@prisma/client';

export type { MealType, BloodTypeGroup, DietType, GeneralGuideType };

export interface FoodItem extends PrismaFoodItem {}
export interface GeneralGuideItem extends PrismaGeneralGuideItem {}
export interface WellnessKey extends PrismaWellnessKey {}

export type FoodPlanTemplate = {
  [key in MealType]: FoodItem[];
};

export interface PatientFoodPlan {
  id: string;
  selectedItemIds: Set<string>;
}

export interface FullNutritionData {
  foodTemplate: FoodPlanTemplate;
  generalGuide: {
    AVOID: GeneralGuideItem[];
    SUBSTITUTE: GeneralGuideItem[];
  };
  wellnessKeys: WellnessKey[];
}