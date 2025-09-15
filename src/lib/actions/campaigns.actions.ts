// src/lib/actions/campaigns.actions.ts
'use server';

import { prisma } from '@/lib/db';
import { Contact, Channel } from '@/components/campaigns/NewCampaignWizard';
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
      consent: ['EMAIL', 'SMS', 'WHATSAPP'],
    }));

    return { success: true, data: contacts };
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return { success: false, error: 'No se pudieron cargar los contactos.' };
  }
}

// ===== NUEVA FUNCIÓN ASÍNCRONA PARA EL PROCESO EN SEGUNDO PLANO =====
async function processMassiveSend(
  contacts: Contact[], 
  channels: Channel[], 
  message: string, 
  campaignName: string,
  mediaUrls: string[] | null
) {
  console.log(`[Background Process] Iniciando envío masivo para campaña "${campaignName}"...`);
  let successfulSends = 0;
  let failedSends = 0;
  
  const sendPromises: Promise<void>[] = [];

  // --- LÓGICA DE ENVÍO DE EMAIL ---
  if (channels.includes('EMAIL')) {
    const emailProvider = getEmailProvider();
    contacts.forEach(contact => {
      if (!contact.email) {
        return;
      }
      const promise = emailProvider.send(contact.email, campaignName, message, mediaUrls).then(result => {
        if (result.success) {
          console.log(`[Background-Email] Enviado a ${contact.name}.`);
          successfulSends++;
        } else {
          console.error(`[Background-Email] Falló el envío a ${contact.name}. Error: ${result.error}`);
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
        return;
      }
      let messageWithMedia = message;
      if (mediaUrls && mediaUrls.length > 0) {
        const links = mediaUrls.join('\n');
        messageWithMedia += `\n\nArchivos adjuntos:\n${links}`;
      }
      const promise = smsProvider.send(contact.phone, messageWithMedia).then(result => {
        if (result.success) {
          console.log(`[Background-SMS] Enviado a ${contact.name}.`);
          successfulSends++;
        } else {
          console.error(`[Background-SMS] Falló el envío a ${contact.name}. Error: ${result.error}`);
          failedSends++;
        }
      });
      sendPromises.push(promise);
    });
  }

  // --- LÓGICA DE ENVÍO DE WHATSAPP ---
  if (channels.includes('WHATSAPP')) {
    const whatsAppProvider = getWhatsAppProvider();
    const templateSid = process.env.TWILIO_WHATSAPP_TEMPLATE_SID;

    if (!templateSid) {
      console.error('[Background-WhatsApp] Error Crítico: El SID de la plantilla no está configurado.');
      failedSends += contacts.filter(c => c.phone).length;
    } else {
      contacts.forEach(contact => {
        if (!contact.phone) {
          return;
        }
        
        const firstMediaUrl = (mediaUrls && mediaUrls.length > 0) ? mediaUrls[0] : null;

        const variables = {
          '1': contact.name || 'Estimado Cliente',
          '2': message || '(Sin contenido)',
          '3': firstMediaUrl ? `Para ver el archivo adjunto, visite: ${firstMediaUrl}` : '(Este mensaje no contiene archivos adjuntos.)',
        };

        const promise = whatsAppProvider.sendTemplate(contact.phone, templateSid, variables).then(result => {
          if (result.success) {
            console.log(`[Background-WhatsApp] Enviado a ${contact.name}.`);
            successfulSends++;
          } else {
            console.error(`[Background-WhatsApp] Falló el envío a ${contact.name}. Error: ${result.error}`);
            failedSends++;
          }
        });
        sendPromises.push(promise);
      });
    }
  }

  await Promise.all(sendPromises);

  const processedJobs = successfulSends + failedSends;
  console.log(`[Background Process] Envío completado. Total procesados: ${processedJobs}, Exitosos: ${successfulSends}, Fallidos: ${failedSends}`);
  
  // Futura mejora: Guardar el resultado de la campaña en la base de datos.
}


/**
 * Orquesta el envío de una campaña multicanal.
 * Responde inmediatamente a la UI y procesa el envío en segundo plano.
 */
export async function sendCampaign(
  contacts: Contact[], 
  channels: Channel[], 
  message: string, 
  campaignName: string,
  mediaUrls: string[] | null
) {
  console.log(`[Campaign Action] Recibida solicitud para campaña "${campaignName}" a ${contacts.length} contactos.`);

  // "Dispara y olvida": no usamos 'await' aquí.
  processMassiveSend(contacts, channels, message, campaignName, mediaUrls);

  // Devolvemos una respuesta inmediata al frontend.
  return {
    success: true,
    message: `Campaña para ${contacts.length} contactos ha sido encolada. El envío se procesará en segundo plano.`,
  };
}