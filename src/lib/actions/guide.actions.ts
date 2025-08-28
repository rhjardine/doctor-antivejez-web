'use server';

import { prisma } from '@/lib/db';
import { GuideFormValues, StandardFormItem, RevitalizationFormItem, MetabolicFormItem, RemocionFormItem, RemocionAlimentacionType, NoniAloeVeraTime } from '@/types/guide';
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
 * Esta versión maneja la creación de nuevos ítems dinámicos.
 */
export async function savePatientGuide(
  patientId: string, 
  formData: GuideFormValues,
  newItems: { tempId: string; name: string; categoryId: string }[]
) {
  try {
    const { guideDate, selections, observaciones } = formData;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear la guía principal
      const patientGuide = await tx.patientGuide.create({
        data: {
          patientId,
          guideDate: new Date(guideDate),
          observations: observaciones,
        },
      });

      // 2. Crear los nuevos ítems y mapear sus IDs temporales a las nuevas IDs de la BD
      const tempIdToDbIdMap = new Map<string, string>();
      for (const newItem of newItems) {
        const createdItem = await tx.guideItem.create({
          data: {
            name: newItem.name,
            categoryId: newItem.categoryId,
            isDefault: false, // Los ítems creados dinámicamente no son por defecto
          },
        });
        tempIdToDbIdMap.set(newItem.tempId, createdItem.id);
      }

      // 3. Preparar todas las selecciones para guardarlas en lote
      const selectionsToCreate = [];
      for (const itemId in selections) {
        if (Object.prototype.hasOwnProperty.call(selections, itemId)) {
          const selectionData = selections[itemId];
          if (selectionData.selected) {
            // Usar la nueva ID de la BD si es un ítem dinámico, o la ID original si es uno por defecto
            const finalItemId = tempIdToDbIdMap.get(itemId) || itemId;

            const dbSelectionData: any = {
              patientGuideId: patientGuide.id,
              guideItemId: finalItemId,
              qty: (selectionData as StandardFormItem).qty,
              doseType: (selectionData as StandardFormItem).doseType,
              freq: (selectionData as StandardFormItem).freq,
              custom: (selectionData as StandardFormItem).custom,
              complejoB_cc: (selectionData as RevitalizationFormItem).complejoB_cc,
              bioquel_cc: (selectionData as RevitalizationFormItem).bioquel_cc,
              frequency: (selectionData as RevitalizationFormItem).frequency,
              cucharadas: (selectionData as RemocionFormItem).cucharadas,
              horario: (selectionData as RemocionFormItem).horario,
              semanas: (selectionData as RemocionFormItem).semanas,
              alimentacionTipo: (selectionData as RemocionFormItem).alimentacionTipo,
              tacita_qty: (selectionData as RemocionFormItem).tacita_qty,
              tacita: (selectionData as RemocionFormItem).tacita,
              frascos: (selectionData as RemocionFormItem).frascos,
              gotas: (selectionData as MetabolicFormItem).gotas,
              vecesAlDia: (selectionData as MetabolicFormItem).vecesAlDia,
            };
            selectionsToCreate.push(dbSelectionData);
          }
        }
      }

      // 4. Insertar todas las selecciones en la base de datos
      if (selectionsToCreate.length > 0) {
        await tx.patientGuideSelection.createMany({
          data: selectionsToCreate,
        });
      }

      return patientGuide;
    });

    revalidatePath(`/historias/${patientId}`);
    return { success: true, message: 'Guía guardada exitosamente.', data: result };
  } catch (error) {
    console.error('Error saving patient guide:', error);
    return { success: false, error: 'Ocurrió un error al guardar la guía.' };
  }
}
