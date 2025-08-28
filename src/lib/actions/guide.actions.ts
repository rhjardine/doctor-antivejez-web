// src/lib/actions/guide.actions.ts
'use server';

import { prisma } from '@/lib/db';
import { GuideFormValues, StandardFormItem, RevitalizationFormItem, MetabolicFormItem, RemocionFormItem } from '@/types/guide';
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
 * Esta función ahora implementa la lógica completa de guardado.
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
        const selectionData = selections[itemId];
        if (selectionData.selected) {
          // Mapear los datos del formulario al esquema de la base de datos
          const dbSelectionData: any = {
            patientGuideId: patientGuide.id,
            guideItemId: itemId,
          };
          
          // Mapeo para StandardFormItem y otros que comparten campos
          if ('qty' in selectionData) dbSelectionData.qty = selectionData.qty;
          if ('freq' in selectionData) dbSelectionData.freq = selectionData.freq;
          if ('custom' in selectionData) dbSelectionData.custom = selectionData.custom;
          if ('doseType' in selectionData) dbSelectionData.doseType = selectionData.doseType;

          // Mapeo específico para RevitalizationFormItem
          if ('complejoB_cc' in selectionData) dbSelectionData.complejoB_cc = selectionData.complejoB_cc;
          if ('bioquel_cc' in selectionData) dbSelectionData.bioquel_cc = selectionData.bioquel_cc;
          if ('frequency' in selectionData) dbSelectionData.frequency = selectionData.frequency;

          // Mapeo específico para MetabolicFormItem
          if ('gotas' in selectionData) dbSelectionData.gotas = selectionData.gotas;
          if ('vecesAlDia' in selectionData) dbSelectionData.vecesAlDia = selectionData.vecesAlDia;
          if ('horario' in selectionData) dbSelectionData.horario = selectionData.horario;

          // Mapeo específico para RemocionFormItem
          if ('cucharadas' in selectionData) dbSelectionData.cucharadas = selectionData.cucharadas;
          if ('horario' in (selectionData as RemocionFormItem)) dbSelectionData.horario = (selectionData as RemocionFormItem).horario;
          if ('semanas' in selectionData) dbSelectionData.semanas = selectionData.semanas;
          if ('alimentacionTipo' in selectionData) dbSelectionData.alimentacionTipo = selectionData.alimentacionTipo;
          if ('tacita_qty' in selectionData) dbSelectionData.tacita_qty = selectionData.tacita_qty;
          if ('tacita' in selectionData) dbSelectionData.tacita = selectionData.tacita;
          if ('frascos' in selectionData) dbSelectionData.frascos = selectionData.frascos;
          
          selectionsToCreate.push(dbSelectionData);
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
