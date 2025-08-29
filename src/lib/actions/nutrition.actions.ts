'use server';

import { prisma } from '@/lib/db';
import { FoodPlanTemplate, MealType, GeneralGuideType, FullNutritionData, DietType } from '@/types/nutrition';
import { revalidatePath } from 'next/cache';

/**
 * Obtiene todos los datos necesarios para la plantilla de la guía de alimentación.
 */
export async function getFullNutritionData(): Promise<{ success: boolean; data?: FullNutritionData; error?: string }> {
  try {
    // Ejecuta todas las consultas a la base de datos en paralelo para mayor eficiencia
    const [foodItems, generalGuideItems, wellnessKeys] = await Promise.all([
      prisma.foodItem.findMany({ where: { isDefault: true }, orderBy: { name: 'asc' } }),
      prisma.generalGuideItem.findMany({ where: { isDefault: true } }),
      prisma.wellnessKey.findMany({ where: { isDefault: true }, orderBy: { id: 'asc' } }),
    ]);

    // Organiza los items de comida por tipo de comida
    const foodTemplate = (Object.values(MealType) as MealType[]).reduce((acc, mealType) => {
        acc[mealType] = foodItems.filter(item => item.mealType === mealType);
        return acc;
    }, {} as FoodPlanTemplate);

    // Organiza la guía general en "Evitar" y "Sustituir"
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
 * Guarda el plan de alimentación completo de un paciente.
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

            // 2. Sincronizar los ítems de comida
            const allItemsInPlan = Object.values(foodData).flat();
            const defaultItemIds = new Set(
                (await tx.foodItem.findMany({ where: { isDefault: true }, select: { id: true } })).map(i => i.id)
            );
            
            const itemsToCreate = allItemsInPlan
                .filter(item => !item.id.startsWith('temp_') && !defaultItemIds.has(item.id))
                .map(item => ({
                    name: item.name,
                    mealType: item.mealType,
                    bloodTypeGroup: item.bloodTypeGroup,
                    isDefault: false,
                }));

            if (itemsToCreate.length > 0) {
                await tx.foodItem.createMany({ data: itemsToCreate });
            }

            const allCurrentDbItems = await tx.foodItem.findMany({ select: { id: true, name: true } });
            const nameToIdMap = new Map(allCurrentDbItems.map(i => [i.name, i.id]));
            const selectedItemIds = allItemsInPlan.map(item => nameToIdMap.get(item.name)).filter((id): id is string => !!id);

            // 3. Buscar o crear el plan de alimentación del paciente
            let foodPlan = await tx.foodPlan.findFirst({ where: { patientId } });
            if (!foodPlan) {
                foodPlan = await tx.foodPlan.create({ data: { patientId } });
            }

            // 4. Actualizar los ítems de comida seleccionados en el plan
            const updatedPlan = await tx.foodPlan.update({
                where: { id: foodPlan.id },
                data: { items: { set: selectedItemIds.map(id => ({ id })) } },
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