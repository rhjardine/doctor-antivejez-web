'use server';

import { prisma } from '@/lib/db';
import { Contact, Channel } from '@/components/campaigns/NewCampaignWizard';
import { getSmsProvider, getEmailProvider, getWhatsAppProvider } from '@/lib/services/notificationService';
import { revalidatePath } from 'next/cache';

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
      origin: 'RENDER PG',
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
    const newCampaign = await prisma.campaign.create({
      data: {
        name: campaignName,
        messageBody: message,
        status: 'IN_PROGRESS',
        channels: channels as string[],
        totalContacts: contacts.length,
      },
    });

    // ===== INICIO DE LA CORRECCIÓN =====
    // Se pasa 'campaignName' a la función de proceso en segundo plano.
    processMassiveSend(newCampaign.id, contacts, channels, message, campaignName, mediaUrls);
    // ===== FIN DE LA CORRECCIÓN =====

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

// ===== NUEVAS SERVER ACTIONS PARA LEER EL HISTORIAL =====

export async function getCampaignHistory() {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return { success: true, data: campaigns };
  } catch (error) {
    console.error("Error fetching campaign history:", error);
    return { success: false, error: "No se pudo cargar el historial de campañas." };
  }
}

export async function getCampaignDetails(campaignId: string) {
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
      return { success: false, error: "Campaña no encontrada." };
    }
    return { success: true, data: campaign };
  } catch (error) {
    console.error(`Error fetching details for campaign ${campaignId}:`, error);
    return { success: false, error: "No se pudieron cargar los detalles de la campaña." };
  }
}