'use server';

import { prisma } from '@/lib/db';
import { Contact } from '@/components/campaigns/NewCampaignWizard';

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

    // Mapeamos los datos de la BD al tipo 'Contact' que espera el frontend
    const contacts: Contact[] = patients.map(p => ({
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      email: p.email,
      phone: p.phone,
      origin: 'RENDER PG',
      // Lógica de consentimiento (a implementar en el futuro)
      consent: ['EMAIL', 'SMS'], 
    }));

    return { success: true, data: contacts };
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return { success: false, error: 'No se pudieron cargar los contactos.' };
  }
}