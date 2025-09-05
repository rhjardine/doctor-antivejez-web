'use server';

import { prisma } from '@/lib/db';
import { Contact, Channel } from '@/components/campaigns/NewCampaignWizard';
// ===== INICIO DE LA INTEGRACIÓN =====
import { getSmsProvider } from '@/lib/services/notificationService';
// ===== FIN DE LA INTEGRACIÓN =====

export async function getContactsFromDB() {
  // ... (esta función no cambia)
  try {
    const patients = await prisma.patient.findMany({
      select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      orderBy: { lastName: 'asc' },
    });
    const contacts: Contact[] = patients.map(p => ({
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      email: p.email,
      phone: p.phone,
      origin: 'RENDER PG',
      consent: ['EMAIL', 'SMS'], 
    }));
    return { success: true, data: contacts };
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return { success: false, error: 'No se pudieron cargar los contactos.' };
  }
}

// ===== NUEVA SERVER ACTION PARA ENVIAR LA CAMPAÑA =====
export async function sendCampaign(contacts: Contact[], channels: Channel[], message: string) {
  console.log(`[Campaign Action] Iniciando envío de campaña a ${contacts.length} contactos por los canales: ${channels.join(', ')}`);

  let successfulSends = 0;
  let failedSends = 0;

  // Por ahora, nos enfocamos solo en el canal SMS
  if (channels.includes('SMS')) {
    const smsProvider = getSmsProvider();
    
    // Usamos Promise.all para enviar los mensajes en paralelo (con un límite para no sobrecargar)
    const sendPromises = contacts.map(async (contact) => {
      if (!contact.phone) {
        console.log(`[Campaign Action] Omitiendo contacto ${contact.name} (ID: ${contact.id}) por falta de número de teléfono.`);
        failedSends++;
        return;
      }

      console.log(`[Campaign Action] Intentando enviar SMS a ${contact.name} (${contact.phone})`);
      const result = await smsProvider.send(contact.phone, message);

      if (result.success) {
        console.log(`[Campaign Action] SMS enviado exitosamente a ${contact.name}. MessageID: ${result.messageId}`);
        successfulSends++;
      } else {
        console.error(`[Campaign Action] Falló el envío de SMS a ${contact.name}. Error: ${result.error}`);
        failedSends++;
      }
    });

    await Promise.all(sendPromises);
  }

  // Aquí iría la lógica para el canal EMAIL en el futuro

  console.log(`[Campaign Action] Envío completado. Exitosos: ${successfulSends}, Fallidos: ${failedSends}`);

  if (failedSends > 0) {
    return {
      success: false,
      error: `Envío completado con ${failedSends} errores. Revise los logs para más detalles.`,
    };
  }

  return {
    success: true,
    message: `Campaña enviada exitosamente a ${successfulSends} contactos.`,
  };
}