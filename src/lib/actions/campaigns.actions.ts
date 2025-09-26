// src/lib/actions/campaign.actions.ts

'use server';

import { prisma } from '@/lib/db'; // Asumo que tienes un alias para @/lib/prisma
import { Contact, Channel } from '@/components/campaigns/NewCampaignWizard';
import { getSmsProvider, getEmailProvider, getWhatsAppProvider } from '@/lib/services/notificationService';
import { revalidatePath } from 'next/cache';
import { Campaign, CampaignMessage } from '@prisma/client';

// ANÁLISIS SENIOR: Se define un tipo explícito para la respuesta de la función de detalles.
// Esto mejora la seguridad de tipos en los componentes que la consumen.
export type CampaignWithMessages = Campaign & { messages: CampaignMessage[] };

// --- FUNCIONALIDAD EXISTENTE (INTACTA) ---

export async function getContactsFromDB() {
  try {
    const patients = await prisma.patient.findMany({
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

async function processMassiveSend(
  campaignId: string,
  contacts: Contact[], 
  channels: Channel[], 
  message: string, 
  campaignName: string,
  mediaUrls: string[] | null
) {
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
            status: result.success ? 'SUCCESS' : 'FAILED', // ANÁLISIS SENIOR: Estandarizar estados.
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
          status: 'FAILED',
          error: error.message,
        });
      }
    })
  );

  await Promise.all(sendPromises);

  if (messagesToCreate.length > 0) {
    await prisma.campaignMessage.createMany({ data: messagesToCreate });
  }
  
  const sentCount = messagesToCreate.filter(m => m.status === 'SUCCESS').length;
  const failedCount = messagesToCreate.length - sentCount;

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: failedCount > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED',
      sentCount,
      failedCount,
    },
  });
  
  revalidatePath('/dashboard/campaigns');
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
    const newCampaign = await prisma.campaign.create({
      data: {
        name: campaignName,
        messageBody: message,
        status: 'IN_PROGRESS',
        channels: channels as string[],
        totalContacts: contacts.length,
        attachmentUrls: mediaUrls || [], // ANÁLISIS SENIOR: Asegurarse de guardar las URLs
      },
    });

    processMassiveSend(newCampaign.id, contacts, channels, message, campaignName, mediaUrls);

    revalidatePath('/dashboard/campaigns');

    return {
      success: true,
      message: `Campaña "${campaignName}" encolada para ${contacts.length} contactos.`,
    };
  } catch (error: any) {
    console.error("Error creating campaign record:", error);
    return { success: false, error: "No se pudo crear el registro de la campaña en la base de datos." };
  }
}

// --- FUNCIONALIDAD DE LECTURA (REFACTORIZADA) ---

/**
 * ANÁLISIS SENIOR: 
 * - Convertida a una función asíncrona estándar que devuelve los datos o un array vacío.
 * - Se elimina la envoltura { success, data } para simplificar su uso en Server Components.
 * - Se añade JSON.parse(JSON.stringify(...)) como una medida de seguridad para asegurar que los
 *   objetos de fecha sean serializables y no causen errores en el límite Servidor-Cliente.
 */
export async function getCampaignHistory(): Promise<Campaign[]> {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return JSON.parse(JSON.stringify(campaigns));
  } catch (error) {
    console.error("Error fetching campaign history:", error);
    return [];
  }
}

/**
 * ANÁLISIS SENIOR:
 * - Similar a la anterior, devuelve el objeto directamente o null.
 * - El tipo de retorno explícito `Promise<CampaignWithMessages | null>` mejora la inferencia de tipos.
 */
export async function getCampaignDetails(campaignId: string): Promise<CampaignWithMessages | null> {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        messages: {
          orderBy: { sentAt: 'asc' },
        },
      },
    });
    if (!campaign) {
      return null;
    }
    return JSON.parse(JSON.stringify(campaign));
  } catch (error) {
    console.error(`Error fetching details for campaign ${campaignId}:`, error);
    return null;
  }
}