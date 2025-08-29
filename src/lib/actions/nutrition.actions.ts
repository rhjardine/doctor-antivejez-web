'use server';

import { prisma } from '@/lib/db';
import { Patient, FoodPlan, Meal, MealItem, Food } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Interfaz para la estructura de datos que usará el frontend
export interface GroupedFoods {
  [category: string]: {
    BENEFICIAL: Food[];
    NEUTRAL: Food[];
    AVOID: Food[];
  };
}

/**
 * Obtiene y agrupa los alimentos según el tipo de sangre de un paciente.
 * @param patientId - El ID del paciente.
 * @returns Un objeto con los alimentos agrupados por categoría y nivel de beneficio.
 */
export async function getFoodsByBloodType(patientId: string): Promise<GroupedFoods> {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { bloodType: true },
    });

    if (!patient || !patient.bloodType) {
      // Devuelve un objeto vacío si el paciente no tiene tipo de sangre
      console.warn(`Paciente con ID ${patientId} no encontrado o sin tipo de sangre.`);
      return {};
    }

    const bloodTypeRecord = await prisma.bloodType.findUnique({
      where: { name: patient.bloodType },
    });

    if (!bloodTypeRecord) {
      console.error(`Tipo de sangre ${patient.bloodType} no encontrado en la base de datos.`);
      return {};
    }

    const foodBenefits = await prisma.foodBloodTypeBenefit.findMany({
      where: { bloodTypeId: bloodTypeRecord.id },
      include: {
        food: true,
      },
    });

    const groupedFoods: GroupedFoods = {};

    for (const item of foodBenefits) {
      const category = item.food.category;
      const benefit = item.benefit;

      if (!groupedFoods[category]) {
        groupedFoods[category] = {
          BENEFICIAL: [],
          NEUTRAL: [],
          AVOID: [],
        };
      }
      groupedFoods[category][benefit].push(item.food);
    }

    return groupedFoods;

  } catch (error) {
    console.error('Error al obtener los alimentos por tipo de sangre:', error);
    throw new Error('No se pudieron cargar los alimentos.');
  }
}


// --- ACCIÓN EXISTENTE (SIN CAMBIOS) ---
export async function createOrUpdateNutritionGuide(
  patientId: string,
  data: {
    plan: {
      breakfast: { foodIds: string[] };
      lunch: { foodIds: string[] };
      snack: { foodIds: string[] };
      dinner: { foodIds: string[] };
    },
    observations: string;
  }
) {
  try {
    const { plan, observations } = data;

    // Buscar una guía existente para el paciente
    let guide = await prisma.nutritionGuide.findUnique({
      where: { patientId },
      include: { foodPlan: { include: { meals: true } } },
    });

    if (guide && guide.foodPlan) {
      // --- ACTUALIZAR GUÍA EXISTENTE ---
      const foodPlanId = guide.foodPlan.id;

      // 1. Eliminar los items de comida antiguos para evitar duplicados
      await prisma.mealItem.deleteMany({
        where: {
          mealId: {
            in: guide.foodPlan.meals.map((m) => m.id),
          },
        },
      });

      // 2. Actualizar las comidas con los nuevos alimentos
      const mealTypes = ['BREAKFAST', 'LUNCH', 'SNACK', 'DINNER'];
      for (const mealType of mealTypes) {
        const mealData = plan[mealType.toLowerCase() as keyof typeof plan];
        if (mealData) {
          await prisma.meal.update({
            where: {
              foodPlanId_type: {
                foodPlanId,
                type: mealType as any,
              },
            },
            data: {
              items: {
                create: mealData.foodIds.map((foodId) => ({
                  foodId,
                })),
              },
            },
          });
        }
      }
      // 3. Actualizar las observaciones
      await prisma.nutritionGuide.update({
        where: { id: guide.id },
        data: { observations },
      });

    } else {
      // --- CREAR NUEVA GUÍA ---
      await prisma.nutritionGuide.create({
        data: {
          patientId,
          observations,
          foodPlan: {
            create: {
              patientId,
              meals: {
                create: [
                  {
                    type: 'BREAKFAST',
                    items: {
                      create: plan.breakfast.foodIds.map((foodId) => ({ foodId })),
                    },
                  },
                  {
                    type: 'LUNCH',
                    items: {
                      create: plan.lunch.foodIds.map((foodId) => ({ foodId })),
                    },
                  },
                  {
                    type: 'SNACK',
                    items: {
                      create: plan.snack.foodIds.map((foodId) => ({ foodId })),
                    },
                  },
                  {
                    type: 'DINNER',
                    items: {
                      create: plan.dinner.foodIds.map((foodId) => ({ foodId })),
                    },
                  },
                ],
              },
            },
          },
        },
      });
    }

    revalidatePath(`/historias/${patientId}`);
    return { success: true, message: 'Guía nutricional guardada con éxito.' };
  } catch (error) {
    console.error('Error al guardar la guía nutricional:', error);
    return { success: false, message: 'Ocurrió un error al guardar la guía.' };
  }
}
