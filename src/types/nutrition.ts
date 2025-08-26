// src/types/nutrition.ts
import type { FoodItem as PrismaFoodItem, MealType, BloodTypeGroup } from '@prisma/client';

export type { MealType, BloodTypeGroup };

export interface FoodItem extends PrismaFoodItem {}

export type FoodPlanTemplate = {
  [key in MealType]: FoodItem[];
};

export interface PatientFoodPlan {
  id: string;
  selectedItemIds: Set<string>;
}