// src/lib/actions/guide.actions.ts
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
 */
export async function savePatientGuide(patientId: string, formData: GuideFormValues) {
  try {
    const { guideDate, selections, observaciones } = formData;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear la guía principal para el paciente
      const patientGuide = await tx.patientGuide.create({
        data: {
          patientId,
          guideDate: new Date(guideDate),
          observations: observaciones,
        },
      });

      // 2. Preparar todas las selecciones para guardarlas en lote
      const selectionsToCreate = [];

      for (const itemId in selections) {
        // Asegurarse de que el itemId es una propiedad del objeto
        if (Object.prototype.hasOwnProperty.call(selections, itemId)) {
            const selectionData = selections[itemId];
            if (selectionData.selected) {
                // Mapear los datos del formulario al esquema de la base de datos
                const dbSelectionData: any = {
                    patientGuideId: patientGuide.id,
                    guideItemId: itemId,
                    // Mapeo de campos comunes y específicos
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

      // 3. Insertar todas las selecciones en la base de datos
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
