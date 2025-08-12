// src/lib/actions/guide.actions.ts
'use server';

import { prisma } from '@/lib/db';
import { GuideFormValues } from '@/types/guide';
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
          where: { isDefault: true }, // Solo trae los ítems por defecto
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
    // Aquí iría la lógica para guardar los datos en los modelos
    // PatientGuide y PatientGuideSelection.
    // Esta parte es compleja y se puede implementar en un siguiente paso.
    console.log('Datos a guardar para el paciente:', patientId, formData);
    
    // Por ahora, solo revalidamos la ruta para simular una actualización.
    revalidatePath(`/historias/${patientId}`);
    
    return { success: true, message: 'Guía guardada exitosamente (simulación).' };
  } catch (error) {
    console.error('Error saving patient guide:', error);
    return { success: false, error: 'Ocurrió un error al guardar la guía.' };
  }
}
