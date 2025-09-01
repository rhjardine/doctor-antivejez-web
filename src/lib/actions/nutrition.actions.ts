'use server';

import { prisma } from '@/lib/db';
import { GuideFormValues, GuideCategory, StandardGuideItem, RevitalizationGuideItem, MetabolicActivator, RemocionItem } from '@/types/guide';
import { revalidatePath } from 'next/cache';

/**
 * Obtiene la estructura completa de la guía (categorías e ítems)
 * desde la base de datos para construir el formulario dinámicamente.
 */
export async function getGuideTemplate() {
  try {
    const categories = await prisma.guideCategory.findMany({
      include: {
        items: {
          where: { isDefault: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });
    return { success: true, data: categories };
  } catch (error) {
    console.error('Error fetching guide template:', error);
    return { success: false, error: 'No se pudo cargar la plantilla de la guía.' };
  }
}

/**
 * Guarda la guía personalizada de un paciente en la base de datos.
 */
export async function savePatientGuide(patientId: string, formData: GuideFormValues) {
  try {
    const { guideDate, selections, observaciones } = formData;

    // Iniciar una transacción para asegurar la consistencia de los datos
    const newGuide = await prisma.$transaction(async (tx) => {
      // 1. Crear la cabecera de la guía
      const createdGuide = await tx.patientGuide.create({
        data: {
          patientId,
          guideDate: new Date(guideDate),
          // 'observaciones' se manejará en un campo separado si es necesario
        },
      });

      // 2. Preparar los datos de las selecciones para la inserción
      const selectionData = Object.entries(selections)
        .filter(([, details]) => details.selected)
        .map(([guideItemId, details]) => {
          // Asegurarse de que los valores numéricos sean números o null
          const qty = details.qty ? String(details.qty) : null;
          const complejoB_cc = 'complejoB_cc' in details ? String(details.complejoB_cc) : null;
          const bioquel_cc = 'bioquel_cc' in details ? String(details.bioquel_cc) : null;
          
          return {
            patientGuideId: createdGuide.id,
            guideItemId,
            qty,
            freq: details.freq || null,
            custom: details.custom || null,
            complejoB_cc,
            bioquel_cc,
            frequency: 'frequency' in details ? details.frequency : null,
          };
        });

      // 3. Insertar todas las selecciones
      if (selectionData.length > 0) {
        await tx.patientGuideSelection.createMany({
          data: selectionData,
        });
      }

      return createdGuide;
    });

    revalidatePath(`/historias/${patientId}`);
    return { success: true, message: 'Guía guardada exitosamente.', data: newGuide };
  } catch (error) {
    console.error('Error saving patient guide:', error);
    return { success: false, error: 'Ocurrió un error al guardar la guía.' };
  }
}

// Función auxiliar para encontrar un ítem por ID en la estructura de datos anidada
function findItemInGuide(guideData: GuideCategory[], itemId: string): { item: StandardGuideItem | RevitalizationGuideItem | RemocionItem | MetabolicActivatorItem | null, categoryName: string | null } {
    let foundItem: StandardGuideItem | RevitalizationGuideItem | RemocionItem | MetabolicActivatorItem | null = null;
    let categoryName: string | null = null;

    for (const category of guideData) {
        if (category.type === 'METABOLIC') {
            const activator = category.items[0] as MetabolicActivator;
            let item = activator.homeopathy.find(i => i.id === itemId) || activator.bachFlowers.find(i => i.id === itemId);
            if (item) {
                foundItem = item;
                categoryName = category.title;
                break;
            }
        } else {
            const item = (category.items as (StandardGuideItem | RevitalizationGuideItem | RemocionItem)[]).find(i => i.id === itemId);
            if (item) {
                foundItem = item;
                // ===== SOLUCIÓN: Acceder a 'category.title' en lugar de 'category.name' =====
                categoryName = category.title;
                // ========================================================================
                break;
            }
        }
    }
    return { item: foundItem, categoryName };
}