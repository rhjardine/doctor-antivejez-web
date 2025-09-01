'use server';

import { prisma } from '@/lib/db';
import { FoodPlanTemplate, MealType, GeneralGuideType, FullNutritionData, DietType, BloodTypeGroup } from '@/types/nutrition';
import { revalidatePath } from 'next/cache';

/**
 * Obtiene todos los datos POR DEFECTO para la plantilla de la guía de alimentación.
 */
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

/**
 * Guarda una NUEVA versión del plan de alimentación de un paciente, creando un historial.
 */
export async function savePatientNutritionPlan(
  patientId: string, 
  foodData: FoodPlanTemplate,
  selectedDiets: DietType[]
) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Actualizar los tipos de dieta seleccionados para el paciente
            await tx.patient.update({
                where: { id: patientId },
                data: { selectedDiets: { set: selectedDiets } },
            });

            // 2. Sincronizar los ítems de comida: crear los que no existen
            const allItemsInPlan = Object.values(foodData).flat();
            const allItemNamesInPlan = allItemsInPlan.map(item => item.name);

            // Buscar qué items del plan ya existen en la BD (por nombre)
            const existingItems = await tx.foodItem.findMany({
                where: { name: { in: allItemNamesInPlan } },
                select: { id: true, name: true }
            });
            const existingItemNames = new Set(existingItems.map(item => item.name));

            // Determinar qué items son nuevos y necesitan ser creados
            const itemsToCreate = allItemsInPlan
                .filter(item => !existingItemNames.has(item.name))
                .map(item => ({
                    name: item.name,
                    mealType: item.mealType,
                    // Asignamos 'ALL' a los nuevos items para simplicidad, o se podría pasar el bloodType actual
                    bloodTypeGroup: 'ALL' as BloodTypeGroup, 
                    isDefault: false,
                }));

            // Crear los nuevos items si los hay
            if (itemsToCreate.length > 0) {
                await tx.foodItem.createMany({ data: itemsToCreate });
            }

            // Obtener los IDs de TODOS los items del plan (existentes + recién creados)
            const allCurrentDbItems = await tx.foodItem.findMany({
                where: { name: { in: allItemNamesInPlan } },
                select: { id: true }
            });
            const allItemIdsToConnect = allCurrentDbItems.map(item => ({ id: item.id }));

            // 3. Crear SIEMPRE un nuevo registro de FoodPlan para generar historial
            const newFoodPlan = await tx.foodPlan.create({
                data: {
                    patientId: patientId,
                    items: {
                        connect: allItemIdsToConnect,
                    },
                },
            });

            return newFoodPlan;
        });
        
        revalidatePath(`/historias/${patientId}`);
        return { success: true, data: result };

    } catch (error) {
        console.error('Error saving patient nutrition plan:', error);
        return { success: false, error: 'No se pudo guardar el plan de alimentación.' };
    }
}```

Con estos tres archivos actualizados y el `seed.ts` de la respuesta anterior, tu funcionalidad estará completa y alineada con todos tus requerimientos.