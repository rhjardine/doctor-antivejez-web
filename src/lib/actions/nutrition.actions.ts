'use server';

import { prisma } from '@/lib/db';
import { Patient, Food, MealType, BloodTypeGroup, DietType, GeneralGuideItem, WellnessKey } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { FullNutritionData } from '@/types/nutrition';

/**
 * Obtiene la plantilla completa de nutrición Y el plan existente de un paciente.
 * Esta acción unificada es más eficiente que múltiples llamadas a la base de datos.
 * @param patientId - El ID del paciente.
 * @returns Un objeto con todos los datos necesarios para construir la guía.
 */
export async function getFullNutritionDataForPatient(patientId: string): Promise<{ success: boolean; data?: FullNutritionData; error?: string }> {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { 
        // Se obtiene el último plan de alimentación creado para el paciente.
        foodPlans: { 
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { items: true } 
        } 
      },
    });

    if (!patient || !patient.bloodType) {
      return { success: false, error: 'Paciente no encontrado o sin tipo de sangre asignado.' };
    }
    
    // ===== LÓGICA DE NEGOCIO CLAVE =====
    // Se mapea el tipo de sangre del paciente (ej: 'A+') al grupo correspondiente ('A_AB')
    // para filtrar los alimentos correctamente según las reglas de negocio.
    const bloodTypeGroup = (patient.bloodType.includes('A') || patient.bloodType.includes('AB')) ? 'A_AB' : 'O_B';
    const relevantGroups: BloodTypeGroup[] = ['ALL', bloodTypeGroup];

    // Se obtienen todos los datos de la plantilla (alimentos, guías, claves) en paralelo para optimizar el tiempo de carga.
    const [allFoodItems, generalGuideItems, wellnessKeys] = await Promise.all([
      prisma.foodItem.findMany({ where: { bloodTypeGroup: { in: relevantGroups } }, orderBy: { name: 'asc' } }),
      prisma.generalGuideItem.findMany({ where: { isDefault: true }, orderBy: { type: 'asc' } }),
      prisma.wellnessKey.findMany({ where: { isDefault: true }, orderBy: { id: 'asc' } }),
    ]);

    // Se estructura la plantilla de alimentos por tipo de comida (Desayuno, Almuerzo, etc.)
    const foodTemplate = allFoodItems.reduce((acc, item) => {
      acc[item.mealType] = acc[item.mealType] || [];
      acc[item.mealType].push(item);
      return acc;
    }, {} as Record<MealType, Food[]>);

    // Se estructura la guía general en "Evitar" y "Sustituir".
    const generalGuide = {
      AVOID: generalGuideItems.filter(i => i.type === 'AVOID'),
      SUBSTITUTE: generalGuideItems.filter(i => i.type === 'SUBSTITUTE'),
    };

    // Se procesa el plan de alimentación más reciente del paciente, si existe.
    const latestPlan = patient.foodPlans?.[0];
    const existingPlan = latestPlan?.items.reduce((acc, item) => {
      acc[item.mealType] = acc[item.mealType] || [];
      acc[item.mealType].push(item.id);
      return acc;
    }, {} as Record<MealType, string[]>) || null;

    return {
      success: true,
      data: {
        foodTemplate,
        generalGuide,
        wellnessKeys,
        patientData: {
          bloodTypeGroup,
          selectedDiets: patient.selectedDiets,
          existingPlan,
          observations: latestPlan?.observations || null,
        }
      },
    };
  } catch (error) {
    console.error('Error al obtener los datos de nutrición:', error);
    return { success: false, error: 'No se pudieron cargar los datos de la guía.' };
  }
}

/**
 * Crea o actualiza el plan de nutrición completo de un paciente de forma transaccional.
 * Esto garantiza que todas las operaciones (actualizar paciente, borrar plan antiguo, crear nuevo plan)
 * se completen con éxito o ninguna lo haga, evitando datos inconsistentes.
 */
export async function saveFullNutritionPlan(
  patientId: string,
  data: {
    selectedDiets: DietType[];
    mealPlan: Record<MealType, string[]>;
    observations: string;
  }
) {
  try {
    const { selectedDiets, mealPlan, observations } = data;

    const allFoodItemIds = Object.values(mealPlan).flat().filter(id => !id.startsWith('custom_'));

    await prisma.$transaction([
      // 1. Actualizar los tipos de dieta seleccionados directamente en el perfil del paciente.
      prisma.patient.update({
        where: { id: patientId },
        data: { selectedDiets },
      }),
      
      // 2. Borrar cualquier plan de alimentación anterior para este paciente.
      prisma.foodPlan.deleteMany({
        where: { patientId }
      }),

      // 3. Crear el nuevo plan de alimentación con sus relaciones a los alimentos seleccionados.
      prisma.foodPlan.create({
        data: {
          patientId,
          observations,
          items: {
            connect: allFoodItemIds.map(id => ({ id })),
          },
        },
      }),
    ]);

    revalidatePath(`/historias/${patientId}`);
    return { success: true, message: 'Plan de bienestar guardado con éxito.' };
  } catch (error) {
    console.error('Error al guardar el plan de bienestar:', error);
    return { success: false, error: 'Ocurrió un error al guardar el plan.' };
  }
}
