// prisma/fix-ages.ts
import { PrismaClient } from '@prisma/client';

// ===== INICIO DE LA CORRECCIÓN DEFINITIVA =====
// En lugar de depender de una variable de entorno implícita,
// definimos la URL de conexión directamente en el código para este script.
// Esto elimina cualquier problema con la carga de archivos .env.
const DATABASE_URL_RENDER = "postgresql://doctor_antivejez_user:B4EkVm0XytODHqOrZp8fb548BOtjjPVR@dpg-d1ddbq7diees73cqons0-a/doctor_antivejez?ssl=true";

// Creamos una nueva instancia de PrismaClient, pasándole explícitamente
// la fuente de datos que debe usar.
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL_RENDER,
    },
  },
});
// ===== FIN DE LA CORRECCIÓN DEFINITIVA =====

/**
 * Calcula la edad de una persona basándose en su fecha de nacimiento.
 */
function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

async function fixPatientAges() {
  console.log('🚀 Iniciando script de corrección de edades cronológicas...');
  try {
    console.log('👤 Obteniendo todos los pacientes de la base de datos...');
    const allPatients = await prisma.patient.findMany({
      select: {
        id: true,
        birthDate: true,
        chronologicalAge: true,
        firstName: true,
        lastName: true,
      },
    });

    console.log(`📊 Se encontraron ${allPatients.length} pacientes.`);
    let updatedCount = 0;
    const updatePromises: Promise<any>[] = [];

    for (const patient of allPatients) {
      const correctAge = calculateAge(patient.birthDate);

      if (correctAge !== patient.chronologicalAge) {
        console.log(`- Corrigiendo edad para ${patient.firstName} ${patient.lastName} (ID: ${patient.id})... Edad incorrecta: ${patient.chronologicalAge}, Edad correcta: ${correctAge}`);
        
        const updatePromise = prisma.patient.update({
          where: { id: patient.id },
          data: { chronologicalAge: correctAge },
        });
        updatePromises.push(updatePromise);
        updatedCount++;
      }
    }

    if (updatePromises.length > 0) {
      console.log(`\n🔄 Ejecutando ${updatePromises.length} actualizaciones en la base de datos...`);
      await Promise.all(updatePromises);
    }

    console.log(`\n🎉 Proceso de corrección completado.`);
    console.log(`✅ ${updatedCount} registros de pacientes fueron actualizados con la edad cronológica correcta.`);
    console.log(`👍 ${allPatients.length - updatedCount} registros ya tenían la edad correcta.`);

  } catch (error: any) {
    console.error('💥 Error crítico durante la corrección de edades:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPatientAges();