'use server';

import { prisma } from '@/lib/db';
import { GuideFormValues } from '@/types/guide';
import { revalidatePath } from 'next/cache';
import { getEmailProvider } from '@/lib/services/notificationService';
import { render } from '@react-email/render';
import { GuideEmailTemplate } from '@/components/emails/GuideEmailTemplate';
import { getGuideTemplate } from './guide.actions'; // Reutilizamos la función para obtener los datos

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
export async function savePatientGuide(
  patientId: string,
  formData: GuideFormValues
) {
  try {
    const { selections, observaciones, guideDate } = formData;

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      throw new Error('Paciente no encontrado');
    }

    const newGuide = await prisma.patientGuide.create({
      data: {
        patientId: patientId,
        observations: observaciones,
        selections: selections as any,
        createdAt: new Date(guideDate), // Usamos la fecha del formulario
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
 * Envía la guía del paciente por correo electrónico en formato HTML.
 */
export async function sendGuideByEmail(patientId: string, guideId: string) {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        // Incluimos los datos necesarios para el tipo PatientWithDetails
        biophysicsTests: true,
        biochemistryTests: true,
        orthomolecularTests: true,
        appointments: true,
        guides: true,
        foodPlans: true,
        user: true,
      }
    });
    const guide = await prisma.patientGuide.findUnique({ where: { id: guideId } });

    if (!patient || !guide) {
      return { success: false, error: 'Paciente o guía no encontrados.' };
    }
    if (!patient.email) {
      return { success: false, error: 'El paciente no tiene un correo electrónico registrado.' };
    }

    // 1. Obtenemos la estructura de la guía para poder renderizarla
    const guideTemplateResult = await getGuideTemplate();
    if (!guideTemplateResult.success || !guideTemplateResult.data) {
        throw new Error("No se pudo cargar la estructura de la guía para el email.");
    }
    const guideData: GuideCategory[] = guideTemplateResult.data;

    // 2. Construimos el objeto formValues a partir de los datos guardados
    const formValues: GuideFormValues = {
      guideDate: guide.createdAt.toISOString(),
      selections: guide.selections as any,
      observaciones: guide.observations || '',
    };

    // 3. Renderizamos el componente de React a una cadena de HTML
    const emailHtml = render(
      <GuideEmailTemplate
        patient={patient}
        guideData={guideData}
        formValues={formValues}
      />
    );

    const subject = `Tu Guía de Tratamiento Personalizada - Dr. AntiVejez`;
    const textBody = `Hola ${patient.firstName}, tu guía de tratamiento personalizada ha sido generada. Por favor, visualízala en un cliente de correo que soporte HTML.`;

    // 4. Usamos nuestro servicio de email para enviar el HTML
    const emailProvider = getEmailProvider();
    const result = await emailProvider.send(patient.email, subject, textBody, null, emailHtml);

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