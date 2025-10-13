'use server';

import { prisma } from '@/lib/db';
import { GuideFormValues } from '@/types/guide';
import { revalidatePath } from 'next/cache';
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

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      throw new Error('Paciente no encontrado');
    }

    const newGuide = await prisma.patientGuide.create({
      data: {
        patientId: patientId,
        observations: observaciones,
        selections: selections as any, 
      },
    });

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
 */
export async function sendGuideByEmail(patientId: string, guideId: string) {
  try {
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    const guide = await prisma.patientGuide.findUnique({ where: { id: guideId } });

    if (!patient || !guide) {
      return { success: false, error: 'Paciente o guía no encontrados.' };
    }
    if (!patient.email) {
      return { success: false, error: 'El paciente no tiene un correo electrónico registrado.' };
    }

    const subject = `Tu Guía de Tratamiento Personalizada - Dr. AntiVejez`;
    let body = `Hola ${patient.firstName},\n\nAquí tienes un resumen de tu guía de tratamiento:\n\n`;
    body += `Observaciones: ${guide.observations || 'Ninguna'}\n\n`;
    body += `Por favor, accede al portal para ver tu guía completa.\n\nSaludos,\nEl equipo de Doctor AntiVejez`;

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

// ===== INICIO DE LA NUEVA FUNCIONALIDAD DE HISTORIAL =====
/**
 * Obtiene el historial de guías guardadas para un paciente específico.
 * @param patientId El ID del paciente.
 * @returns Un array con el ID, fecha de creación y observaciones de cada guía.
 */
export async function getPatientGuideHistory(patientId: string) {
  try {
    if (!patientId) {
      return { success: false, error: 'Se requiere el ID del paciente.' };
    }
    const guides = await prisma.patientGuide.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        observations: true,
      },
    });
    return { success: true, data: guides };
  } catch (error) {
    console.error(`Error fetching guide history for patient ${patientId}:`, error);
    return { success: false, error: 'No se pudo cargar el historial de guías.' };
  }
}

/**
 * Obtiene los detalles completos de una guía específica por su ID.
 * @param guideId El ID de la guía.
 * @returns El registro completo de la guía, incluyendo el JSON de selecciones.
 */
export async function getPatientGuideDetails(guideId: string) {
  try {
    if (!guideId) {
      return { success: false, error: 'Se requiere el ID de la guía.' };
    }
    const guide = await prisma.patientGuide.findUnique({
      where: { id: guideId },
    });
    if (!guide) {
      return { success: false, error: 'No se encontró la guía.' };
    }
    // Convertimos el campo 'selections' a un objeto JSON antes de devolverlo
    // ya que Prisma puede devolverlo en un formato no estándar.
    const serializableGuide = {
      ...guide,
      selections: JSON.parse(JSON.stringify(guide.selections)),
    };
    return { success: true, data: serializableGuide };
  } catch (error) {
    console.error(`Error fetching guide details for guide ${guideId}:`, error);
    return { success: false, error: 'No se pudieron cargar los detalles de la guía.' };
  }
}