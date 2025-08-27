'use server';

import { prisma } from '@/lib/db';
import { FoodPlanTemplate, MealType, GeneralGuideType, FullNutritionData, DietType } from '@/types/nutrition';
import { revalidatePath } from 'next/cache';

/**
 * Obtiene todos los datos necesarios para la plantilla de la guía de alimentación.
 */
export async function getFullNutritionData(): Promise<{ success: boolean; data?: FullNutritionData; error?: string }> {
  try {
    const [foodItems, generalGuideItems, wellnessKeys] = await Promise.all([
      prisma.foodItem.findMany({ where: { isDefault: true }, orderBy: { name: 'asc' } }),
      prisma.generalGuideItem.findMany({ where: { isDefault: true } }),
      prisma.wellnessKey.findMany({ where: { isDefault: true }, orderBy: { id: 'asc' } }),
    ]);

    const foodTemplate = foodItems.reduce((acc, item) => {
      if (!acc[item.mealType]) {
        acc[item.mealType] = [];
      }
      acc[item.mealType].push(item);
      return acc;
    }, {} as Partial<FoodPlanTemplate>) as FoodPlanTemplate;

    // Asegurarse de que todas las categorías de comida existan
    for (const mealType in MealType) {
        if (!template[mealType as MealType]) {
            template[mealType as MealType] = [];
        }
    }

    const generalGuide = {
      AVOID: generalGuideItems.filter(item => item.type === GeneralGuideType.AVOID),
      SUBSTITUTE: generalGuideItems.filter(item => item.type === GeneralGuideType.SUBSTITUTE),
    };

    return { 
      success: true, 
      data: { foodTemplate, generalGuide, wellnessKeys } 
    };
  } catch (error) {
    console.error('Error fetching full nutrition data:', error);
    return { success: false, error: 'No se pudo cargar la plantilla de alimentación.' };
  }
}

/**
 * Guarda el plan de alimentación completo de un paciente, incluyendo los ítems de comida y los tipos de dieta.
 */
export async function savePatientNutritionPlan(
  patientId: string, 
  selectedItemIds: string[],
  selectedDiets: DietType[]
) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Actualizar los tipos de dieta seleccionados para el paciente
            await tx.patient.update({
                where: { id: patientId },
                data: {
                    selectedDiets: {
                        set: selectedDiets,
                    },
                },
            });

            // 2. Buscar o crear el plan de alimentación del paciente
            let foodPlan = await tx.foodPlan.findFirst({
                where: { patientId },
            });

            if (!foodPlan) {
                foodPlan = await tx.foodPlan.create({
                    data: { patientId },
                });
            }

            // 3. Actualizar los ítems de comida seleccionados en el plan
            const updatedPlan = await tx.foodPlan.update({
                where: { id: foodPlan.id },
                data: {
                    items: {
                        set: selectedItemIds.map(id => ({ id })),
                    },
                },
            });

            return updatedPlan;
        });
        
        revalidatePath(`/historias/${patientId}`);
        return { success: true, data: result };

    } catch (error) {
        console.error('Error saving patient nutrition plan:', error);
        return { success: false, error: 'No se pudo guardar el plan de alimentación.' };
    }
}