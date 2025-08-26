'use server';

import { prisma } from '@/lib/db';
import { FoodPlanTemplate, MealType } from '@/types/nutrition';
import { revalidatePath } from 'next/cache';

export async function getFoodPlanTemplate(): Promise<{ success: boolean; data?: FoodPlanTemplate; error?: string }> {
  try {
    const items = await prisma.foodItem.findMany({
      where: { isDefault: true },
      orderBy: { name: 'asc' },
    });

    // ===== SOLUCIÓN: Lógica de agrupación refactorizada para ser segura para los tipos =====
    const template: FoodPlanTemplate = {
      DESAYUNO: [],
      ALMUERZO: [],
      CENA: [],
      MERIENDAS_POSTRES: [],
    };

    for (const item of items) {
      // Como 'template' ya tiene todas las claves definidas, TypeScript sabe que esto es seguro.
      template[item.mealType].push(item);
    }
    // =================================================================================

    return { success: true, data: template };
  } catch (error) {
    console.error('Error fetching food plan template:', error);
    return { success: false, error: 'No se pudo cargar la plantilla de alimentación.' };
  }
}

export async function savePatientFoodPlan(patientId: string, selectedItemIds: string[]) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            let foodPlan = await tx.foodPlan.findFirst({
                where: { patientId },
            });

            if (!foodPlan) {
                foodPlan = await tx.foodPlan.create({
                    data: {
                        patientId,
                    },
                });
            }

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
        console.error('Error saving patient food plan:', error);
        return { success: false, error: 'No se pudo guardar el plan de alimentación.' };
    }
}