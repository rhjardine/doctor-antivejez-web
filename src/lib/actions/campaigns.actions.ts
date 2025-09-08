// src/lib/actions/campaigns.actions.ts
'use server';

import { prisma } from '@/lib/db';
import { Contact, Channel, AttachmentPayload } from '@/components/campaigns/NewCampaignWizard';
import { getSmsProvider, getEmailProvider, getWhatsAppProvider } from '@/lib/services/notificationService';

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
      consent: ['EMAIL', 'SMS', 'WHATSAPP'], // Asumimos consentimiento para la prueba
    }));

    return { success: true, data: contacts };
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return { success: false, error: 'No se pudieron cargar los contactos.' };
  }
}

export async function sendCampaign(
  contacts: Contact[], 
  channels: Channel[], 
  message: string, 
  campaignName: string,
  attachment: AttachmentPayload | null
) {
  console.log(`[Campaign Action] Iniciando envío de campaña a ${contacts.length} contactos por: ${channels.join(', ')}`);

  let successfulSends = 0;
  let failedSends = 0;
  
  const sendPromises: Promise<void>[] = [];

  // --- LÓGICA DE ENVÍO DE EMAIL ---
  if (channels.includes('EMAIL')) {
    const emailProvider = getEmailProvider();
    contacts.forEach(contact => {
      if (!contact.email) {
        console.log(`[Email] Omitiendo a ${contact.name} por falta de email.`);
        return;
      }
      const promise = emailProvider.send(contact.email, campaignName, message, attachment).then(result => {
        if (result.success) {
          console.log(`[Email] Enviado a ${contact.name}. MessageID: ${result.messageId}`);
          successfulSends++;
        } else {
          console.error(`[Email] Falló el envío a ${contact.name}. Error: ${result.error}`);
          failedSends++;
        }
      });
      sendPromises.push(promise);
    });
  }

  // --- LÓGICA DE ENVÍO DE SMS ---
  if (channels.includes('SMS')) {
    const smsProvider = getSmsProvider();
    contacts.forEach(contact => {
      if (!contact.phone) {
        console.log(`[SMS] Omitiendo a ${contact.name} por falta de teléfono.`);
        return;
      }
      const promise = smsProvider.send(contact.phone, message).then(result => {
        if (result.success) {
          console.log(`[SMS] Enviado a ${contact.name}. MessageID: ${result.messageId}`);
          successfulSends++;
        } else {
          console.error(`[SMS] Falló el envío a ${contact.name}. Error: ${result.error}`);
          failedSends++;
        }
      });
      sendPromises.push(promise);
    });
  }

  // --- LÓGICA DE ENVÍO DE WHATSAPP ---
  if (channels.includes('WHATSAPP')) {
    const whatsAppProvider = getWhatsAppProvider();
    const templateName = 'HXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'; // Reemplazar con el SID de la plantilla 'campaign_notification' una vez aprobada
    
    contacts.forEach(contact => {
      if (!contact.phone) {
        console.log(`[WhatsApp] Omitiendo a ${contact.name} por falta de teléfono.`);
        return;
      }
      
      const variables = {
        '1': contact.name,
        '2': message,
      };

      const promise = whatsAppProvider.sendTemplate(contact.phone, templateName, variables).then(result => {
        if (result.success) {
          console.log(`[WhatsApp] Enviado a ${contact.name}. MessageID: ${result.messageId}`);
          successfulSends++;
        } else {
          console.error(`[WhatsApp] Falló el envío a ${contact.name}. Error: ${result.error}`);
          failedSends++;
        }
      });
      sendPromises.push(promise);
    });
  }

  await Promise.all(sendPromises);

  const processedJobs = successfulSends + failedSends;
  console.log(`[Campaign Action] Envío completado. Total procesados: ${processedJobs}, Exitosos: ${successfulSends}, Fallidos: ${failedSends}`);

  if (failedSends > 0) {
    return {
      success: false,
      error: `Envío completado con ${failedSends} de ${processedJobs} errores. Revise los logs.`,
    };
  }

  return {
    success: true,
    message: `Campaña enviada exitosamente. ${successfulSends} mensajes procesados.`,
  };
}