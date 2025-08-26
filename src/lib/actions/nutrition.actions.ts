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

    const template = items.reduce((acc, item) => {
      if (!acc[item.mealType]) {
        acc[item.mealType] = [];
      }
      acc[item.mealType].push(item);
      return acc;
    }, {} as Partial<FoodPlanTemplate>) as FoodPlanTemplate;

    // Asegurarse de que todas las categorías de comida existan, incluso si están vacías
    for (const mealType in MealType) {
        if (!template[mealType as MealType]) {
            template[mealType as MealType] = [];
        }
    }

    return { success: true, data: template };
  } catch (error) {
    console.error('Error fetching food plan template:', error);
    return { success: false, error: 'No se pudo cargar la plantilla de alimentación.' };
  }
}

export async function savePatientFoodPlan(patientId: string, selectedItemIds: string[]) {
    try {
        // Usar una transacción para asegurar la consistencia de los datos
        const result = await prisma.$transaction(async (tx) => {
            // 1. Buscar si el paciente ya tiene un plan
            let foodPlan = await tx.foodPlan.findFirst({
                where: { patientId },
            });

            // 2. Si no tiene plan, crear uno nuevo
            if (!foodPlan) {
                foodPlan = await tx.foodPlan.create({
                    data: {
                        patientId,
                    },
                });
            }

            // 3. Actualizar el plan con los nuevos items seleccionados
            // El método `set` de Prisma se encarga de desconectar los antiguos y conectar los nuevos.
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