// src/types/nutrition.ts
import type {
  FoodItem as PrismaFoodItem,
  GeneralGuideItem as PrismaGeneralGuideItem,
  WellnessKey as PrismaWellnessKey,
} from '@prisma/client';

// ===== ANÁLISIS Y CORRECCIÓN ESTRATÉGICA =====
// 1. IMPORTACIÓN CORRECTA: Se utiliza 'import' en lugar de 'import type' para los ENUMS.
//    Esto asegura que importamos tanto el TIPO (para la verificación de TypeScript) como
//    el OBJETO (para usarlo en tiempo de ejecución, ej. Object.values(DietType)).
//    Esto resuelve de raíz los errores "Attempted import error".
//
// 2. FUENTE ÚNICA DE LA VERDAD: Se elimina la declaración manual de 'const DietType' y
//    'type DietTypeEnum'. El enum 'DietType' importado directamente de Prisma se convierte
//    en la única fuente de la verdad, garantizando la sincronización con la base de datos.
import {
  MealType,
  BloodTypeGroup,
  GeneralGuideType,
  DietType, // Importamos el enum directamente desde el cliente de Prisma.
  FoodCategory
} from '@prisma/client';

// Re-exportamos los enums y tipos para que el resto de la aplicación
// los consuma desde este archivo central, manteniendo la arquitectura limpia.
export { MealType, BloodTypeGroup, GeneralGuideType, DietType, FoodCategory };

// Interfaces extendidas (práctica correcta que se mantiene)
export interface FoodItem extends PrismaFoodItem { }
export interface GeneralGuideItem extends PrismaGeneralGuideItem { }
export interface WellnessKey extends PrismaWellnessKey { }

// Tipos personalizados que componen los tipos de Prisma.
// Se mejora la robustez para que se adapten a los enums.
export type FoodPlanTemplate = {
  [key in MealType]: FoodItem[];
};

export interface FullNutritionData {
  foodTemplate: FoodPlanTemplate;
  generalGuide: {
    [key in GeneralGuideType]: GeneralGuideItem[];
  };
  wellnessKeys: WellnessKey[];
}