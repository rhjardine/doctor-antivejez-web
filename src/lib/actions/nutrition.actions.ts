'use server';

import { prisma } from '@/lib/db';
import { FoodPlanTemplate, MealType, GeneralGuideType, FullNutritionData, DietType } from '@/types/nutrition';
import { revalidatePath } from 'next/cache';

export async function getFullNutritionData(): Promise<{ success: boolean; data?: FullNutritionData; error?: string }> {
  try {
    const [foodItems, generalGuideItems, wellnessKeys] = await Promise.all([
      prisma.foodItem.findMany({ where: { isDefault: true }, orderBy: { name: 'asc' } }),
      prisma.generalGuideItem.findMany({ where: { isDefault: true } }),
      prisma.wellnessKey.findMany({ where: { isDefault: true }, orderBy: { id: 'asc' } }),
    ]);

    const foodTemplate = (Object.values(MealType) as MealType[]).reduce((acc, mealType) => {
        acc[mealType] = foodItems.filter(item => item.mealType === mealType);
        return acc;
    }, {} as FoodPlanTemplate);

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

// ===== AJUSTE: La función ahora acepta un array de IDs de ítems (string[]) =====
export async function savePatientNutritionPlan(
  patientId: string, 
  selectedItemIds: string[],
  selectedDiets: DietType[]
) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            await tx.patient.update({
                where: { id: patientId },
                data: {
                    selectedDiets: {
                        set: selectedDiets,
                    },
                },
            });

            let foodPlan = await tx.foodPlan.findFirst({
                where: { patientId },
            });

            if (!foodPlan) {
                foodPlan = await tx.foodPlan.create({
                    data: { patientId },
                });
            }

            // Aquí se usan los IDs directamente para establecer la relación
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