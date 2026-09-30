'use server';

import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Contact, Channel } from '@/components/campaigns/NewCampaignWizard';
import { getSmsProvider, getEmailProvider, getWhatsAppProvider } from '@/lib/services/notificationService';
import { revalidatePath } from 'next/cache';
import { requireSession } from '@/lib/auth-guards';
import { alcanceDePacientes } from '@/lib/scope/patient-scope';
import { mensajeDeErrorDeAcceso } from '@/lib/scope/access-errors';
import {
  idsPedidos,
  idsFueraDeAlcance,
  destinatariosDesdePacientes,
} from '@/lib/scope/campaign-recipients';

export async function getContactsFromDB() {
  try {
    // ─── S6: BLINDAJE ───────────────────────────────────────────────────────
    // Devolvía nombre, email y teléfono de TODOS los pacientes de TODAS las
    // clínicas, sin sesión. Ahora exige autenticación y aísla por tenant.
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado' };
    }

    const { role, tenantId, id: userId } = session.user;
    const isAdmin = role === 'ADMIN';

    // Mismo criterio de scoping que patients.actions y dashboard.actions:
    // ADMIN ve todo; con tenant, su clínica; sin tenant, solo sus pacientes.
    const scopeFilter: Prisma.PatientWhereInput = isAdmin
      ? { deletedAt: null }
      : tenantId
        ? { tenantId, deletedAt: null }
        : { userId, deletedAt: null };
    // ────────────────────────────────────────────────────────────────────────

    const patients = await prisma.patient.findMany({
      where: scopeFilter,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
      orderBy: {
        lastName: 'asc',
      },
    });

    const contacts: Contact[] = patients.map(p => ({
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      email: p.email,
      phone: p.phone,
      consent: ['EMAIL', 'SMS', 'WHATSAPP'],
    }));

    return { success: true, data: contacts };
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return { success: false, error: 'No se pudieron cargar los contactos.' };
  }
}

// ===== INICIO DE LA CORRECCIÓN =====
// Se añade el parámetro 'campaignName' a la firma de la función.
async function processMassiveSend(
  campaignId: string,
  contacts: Contact[], 
  channels: Channel[], 
  message: string, 
  campaignName: string, // <-- PARÁMETRO AÑADIDO
  mediaUrls: string[] | null
) {
// ===== FIN DE LA CORRECCIÓN =====
  console.log(`[Background Process] Iniciando envío masivo para Campaign ID: ${campaignId}...`);
  
  const messagesToCreate: any[] = [];

  const sendPromises = channels.flatMap(channel => 
    contacts.map(async (contact) => {
      let result: { success: boolean; messageId?: string; error?: string } | null = null;
      let contactInfo = '';

      try {
        switch (channel) {
          case 'EMAIL':
            if (!contact.email) return;
            contactInfo = contact.email;
            const emailProvider = getEmailProvider();
            // Ahora 'campaignName' está disponible y la llamada es correcta.
            result = await emailProvider.send(contact.email, campaignName, message, mediaUrls);
            break;
          case 'SMS':
            if (!contact.phone) return;
            contactInfo = contact.phone;
            let messageWithMedia = message;
            if (mediaUrls && mediaUrls.length > 0) {
              messageWithMedia += `\n\nArchivos: ${mediaUrls.join('\n')}`;
            }
            const smsProvider = getSmsProvider();
            result = await smsProvider.send(contact.phone, messageWithMedia);
            break;
          case 'WHATSAPP':
            if (!contact.phone) return;
            contactInfo = contact.phone;
            const whatsAppProvider = getWhatsAppProvider();
            const templateSid = process.env.TWILIO_WHATSAPP_TEMPLATE_SID;
            if (!templateSid) throw new Error('WhatsApp Template SID no configurado.');
            
            const firstMediaUrl = (mediaUrls && mediaUrls.length > 0) ? mediaUrls[0] : null;
            const variables = {
              '1': contact.name || 'Estimado Cliente',
              '2': message || '(Sin contenido)',
              '3': firstMediaUrl ? `Para ver el archivo adjunto, visite: ${firstMediaUrl}` : '(Este mensaje no contiene archivos adjuntos.)',
            };
            result = await whatsAppProvider.sendTemplate(contact.phone, templateSid, variables);
            break;
        }

        if (result) {
          messagesToCreate.push({
            campaignId,
            contactId: contact.id,
            contactName: contact.name,
            contactInfo,
            channel,
            status: result.success ? 'Sent' : 'Failed',
            providerId: result.messageId,
            error: result.error,
          });
        }
      } catch (error: any) {
        messagesToCreate.push({
          campaignId,
          contactId: contact.id,
          contactName: contact.name,
          contactInfo,
          channel,
          status: 'Failed',
          error: error.message,
        });
      }
    })
  );

  await Promise.all(sendPromises);

  if (messagesToCreate.length > 0) {
    await prisma.campaignMessage.createMany({ data: messagesToCreate });
  }
  
  const sentCount = messagesToCreate.filter(m => m.status === 'Sent').length;
  const failedCount = messagesToCreate.length - sentCount;

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: failedCount > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED',
      sentCount,
      failedCount,
    },
  });
  
  console.log(`[Background Process] Envío completado para Campaign ID: ${campaignId}. Exitosos: ${sentCount}, Fallidos: ${failedCount}`);
}

export async function sendCampaign(
  contacts: Contact[],
  channels: Channel[],
  message: string,
  campaignName: string,
  mediaUrls: string[] | null
) {
  try {
    // ─── Envio masivo: sesion y destinatarios resueltos en el servidor ──────
    //
    // Esta accion no comprobaba sesion, y lo grave no era solo eso: enviaba a
    // los `email`/`phone` que venia DENTRO de `contacts`, o sea, a los valores
    // que eligiera quien invocara el endpoint. Con las credenciales de
    // SMS/WhatsApp/email del cliente detras, era un relay de envio masivo.
    //
    // Ahora del cliente se acepta unicamente el identificador; el destino se lee
    // de la base y solo dentro del alcance del profesional. El wizard no cambia:
    // sus contactos ya salian de `getContactsFromDB`, que si esta acotada.
    const { session } = await requireSession();
    const alcance = alcanceDePacientes({
      id: session.user.id,
      role: session.user.role,
      tenantId: session.user.tenantId,
    });

    const pedidos = idsPedidos(contacts);
    if (pedidos.length === 0) {
      return { success: false, error: 'No hay destinatarios válidos para esta campaña.' };
    }

    const pacientes = await prisma.patient.findMany({
      where: { ...alcance, id: { in: pedidos } },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true },
    });

    const fuera = idsFueraDeAlcance(pedidos, pacientes);
    if (fuera.length > 0) {
      // No se envia «a los que sí»: una peticion que nombra pacientes ajenos no
      // es la que produce el formulario legitimo. Solo IDs opacos en el registro.
      console.warn(
        `[SECURITY WARN] Campana bloqueada | actor=${session.user.id} ` +
        `pedidos=${pedidos.length} fueraDeAlcance=${fuera.length}`
      );
      return {
        success: false,
        error: 'La selección incluye pacientes que no le corresponden. Vuelva a seleccionar los contactos.',
      };
    }

    const destinatarios = destinatariosDesdePacientes(pacientes);
    if (destinatarios.length === 0) {
      return {
        success: false,
        error: 'Ninguno de los pacientes seleccionados tiene correo ni teléfono registrado.',
      };
    }

    const newCampaign = await prisma.campaign.create({
      data: {
        name: campaignName,
        messageBody: message,
        status: 'IN_PROGRESS',
        channels: channels as string[],
        totalContacts: destinatarios.length,
      },
    });

    // Se envia a `destinatarios` —leidos de la base—, nunca a `contacts`.
    processMassiveSend(newCampaign.id, destinatarios, channels, message, campaignName, mediaUrls);

    revalidatePath('/dashboard/campaigns');

    return {
      success: true,
      message: `Campaña "${campaignName}" encolada para ${destinatarios.length} contactos.`,
    };
  } catch (error: any) {
    const errorDeAcceso = mensajeDeErrorDeAcceso(error);
    if (errorDeAcceso) return { success: false, error: errorDeAcceso };

    console.error("Error creating campaign record:", error);
    return { success: false, error: "No se pudo crear el registro de la campaña en la base de datos." };
  }
}

// ===== NUEVAS SERVER ACTIONS PARA LEER EL HISTORIAL =====

export async function getCampaignHistory() {
  try {
    // PENDIENTE (Fase 3): esto exige sesion pero NO acota por profesional,
    // porque el modelo `Campaign` no tiene columna de dueño —ni `userId` ni
    // `tenantId`—. Con varios consultorios, un medico vera el historial de
    // campanas de los demas. Acotarlo requiere migracion, que no entra en este
    // cambio; queda anotado aqui para que no se pierda.
    await requireSession();

    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return { success: true, data: campaigns };
  } catch (error) {
    const errorDeAcceso = mensajeDeErrorDeAcceso(error);
    if (errorDeAcceso) return { success: false, error: errorDeAcceso };

    console.error("Error fetching campaign history:", error);
    return { success: false, error: "No se pudo cargar el historial de campañas." };
  }
}

export async function getCampaignDetails(campaignId: string) {
  try {
    // Misma limitacion que arriba, y aqui pesa mas: los `CampaignMessage`
    // llevan el contacto real (telefono o correo) de cada destinatario. Sin
    // dueño en `Campaign` no hay por donde acotarlo todavia.
    await requireSession();

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        messages: {
          orderBy: { sentAt: 'asc' },
        },
      },
    });
    if (!campaign) {
      return { success: false, error: "Campaña no encontrada." };
    }
    return { success: true, data: campaign };
  } catch (error) {
    const errorDeAcceso = mensajeDeErrorDeAcceso(error);
    if (errorDeAcceso) return { success: false, error: errorDeAcceso };

    console.error(`Error fetching details for campaign ${campaignId}:`, error);
    return { success: false, error: "No se pudieron cargar los detalles de la campaña." };
  }
}