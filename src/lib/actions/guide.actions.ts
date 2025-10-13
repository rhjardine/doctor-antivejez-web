'use server';

import { prisma } from '@/lib/db';
import { GuideFormValues, GuideCategory } from '@/types/guide';
import { revalidatePath } from 'next/cache';
// Importamos nuestro servicio de email estandarizado
import { getEmailProvider } from '@/lib/services/notificationService';

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
 * Esta versión simplificada guarda todo el formulario en un campo JSON.
 */
export async function savePatientGuide(
  patientId: string,
  formData: GuideFormValues
) {
  try {
    const { selections, observaciones } = formData;

    // 1. Verificar que el paciente existe
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      throw new Error('Paciente no encontrado');
    }

    // 2. Crear el nuevo registro de la guía, guardando las selecciones como JSON
    const newGuide = await prisma.patientGuide.create({
      data: {
        patientId: patientId,
        observations: observaciones,
        // Prisma maneja la serialización a JSON automáticamente
        selections: selections as any, 
      },
    });

    // 3. Revalidar la caché para que el historial se actualice
    revalidatePath(`/historias/${patientId}`);

    return {
      success: true,
      message: 'Guía del paciente guardada exitosamente.',
      guideId: newGuide.id,
    };
  } catch (error) {
    console.error('Error saving patient guide:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error al guardar la guía.';
    return { success: false, error: errorMessage };
  }
}

/**
 * Envía la guía del paciente por correo electrónico.
 * (Esta es una implementación básica. La generación de PDF se puede añadir después).
 */
export async function sendGuideByEmail(patientId: string, guideId: string) {
  try {
    // 1. Obtener los datos necesarios
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    const guide = await prisma.patientGuide.findUnique({ where: { id: guideId } });

    if (!patient || !guide) {
      return { success: false, error: 'Paciente o guía no encontrados.' };
    }
    if (!patient.email) {
      return { success: false, error: 'El paciente no tiene un correo electrónico registrado.' };
    }

    // 2. Construir el cuerpo del email (versión simple en texto)
    const subject = `Tu Guía de Tratamiento Personalizada - Dr. AntiVejez`;
    let body = `Hola ${patient.firstName},\n\nAquí tienes un resumen de tu guía de tratamiento:\n\n`;
    
    // (Aquí se podría añadir una lógica para formatear el JSON de 'selections' a un texto legible)
    body += `Observaciones: ${guide.observations || 'Ninguna'}\n\n`;
    body += `Por favor, accede al portal para ver tu guía completa.\n\nSaludos,\nEl equipo de Doctor AntiVejez`;

    // 3. Usar nuestro servicio de email para enviar
    const emailProvider = getEmailProvider();
    const result = await emailProvider.send(patient.email, subject, body, null);

    if (result.success) {
      return { success: true, message: 'Guía enviada por correo exitosamente.' };
    } else {
      return { success: false, error: result.error || 'No se pudo enviar el correo.' };
    }

  } catch (error) {
    console.error('Error sending guide by email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error en el servidor al enviar el correo.';
    return { success: false, error: errorMessage };
  }
}