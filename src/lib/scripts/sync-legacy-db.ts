// src/lib/scripts/sync-legacy-db.ts
import mysql from 'mysql2/promise';
import { PrismaClient, Gender } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Transforma el valor de género del sistema legado (INT) al ENUM del nuevo sistema.
 * @param gender - El valor numérico del género (ej. 1 para Femenino, 2 para Masculino).
 * @returns El valor del ENUM 'Gender' correspondiente.
 */
function transformGender(gender: number | string | null): Gender {
  const genderStr = String(gender);
  if (genderStr === '1' || genderStr.toUpperCase() === 'F') return Gender.FEMENINO;
  if (genderStr === '2' || genderStr.toUpperCase() === 'M') return Gender.MASCULINO;
  // Un valor por defecto seguro si el dato es nulo, inesperado o diferente (ej. 'H').
  return Gender.FEMENINO; 
}

/**
 * Valida y parsea una cadena de fecha.
 * @param dateString - La fecha en formato string.
 * @returns Un objeto Date válido.
 */
function parseDate(dateString: string | null): Date {
  if (!dateString || dateString === 'NULL' || dateString === '0000-00-00') {
    return new Date('1900-01-01');
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return new Date('1900-01-01');
    return date;
  } catch {
    return new Date('1900-01-01');
  }
}

/**
 * Valida si un email tiene un formato estructuralmente correcto.
 * @param email - La cadena de email a validar.
 * @returns true si es válido, false en caso contrario.
 */
function isValidEmail(email: string | null): boolean {
  if (!email || email === 'NULL' || email === 'N/A') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Se conecta a la base de datos MySQL legada, extrae los pacientes, los transforma
 * y los inserta o actualiza en la base de datos de PostgreSQL.
 */
export async function syncLegacyDatabase() {
  console.log('Iniciando la sincronización con la base de datos legada...');
  let mysqlConnection;

  try {
    // 1. Conectar a MySQL usando las variables de entorno
    console.log('Conectando a la base de datos MySQL legada...');
    mysqlConnection = await mysql.createConnection({
      host: process.env.LEGACY_DB_HOST,
      user: process.env.LEGACY_DB_USER,
      password: process.env.LEGACY_DB_PASSWORD,
      database: process.env.LEGACY_DB_DATABASE,
      port: Number(process.env.LEGACY_DB_PORT) || 3306,
    });
    console.log('Conexión a MySQL exitosa.');

    // 2. Leer todos los registros de la tabla 'persons'
    console.log('Obteniendo registros de la tabla "persons"...');
    const [rows] = await mysqlConnection.execute('SELECT * FROM persons');
    const legacyPatients = rows as any[];
    console.log(`Se encontraron ${legacyPatients.length} registros en la base de datos legada.`);

    if (legacyPatients.length === 0) {
      console.log('No hay registros para sincronizar. Proceso finalizado.');
      return { success: true, created: 0, updated: 0 };
    }

    // 3. Obtener el usuario administrador para asociar los pacientes
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@doctorantivejez.com' }, // Reemplaza con el email real del admin
    });
    if (!adminUser) {
      throw new Error('No se encontró el usuario administrador para asociar los pacientes.');
    }

    let processedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // 4. Iterar, transformar y hacer "upsert" en PostgreSQL
    for (const [index, legacyPatient] of legacyPatients.entries()) {
      try {
        const identification = legacyPatient.identification_id;
        if (!identification || identification === 'NULL' || String(identification).trim() === '') {
          skippedCount++;
          continue;
        }

        const fullPhone = (legacyPatient.phone_code && legacyPatient.phone && legacyPatient.phone !== 'NULL')
          ? `+58${String(legacyPatient.phone_code).trim()}${String(legacyPatient.phone).trim()}`
          : ((legacyPatient.cellphone_code && legacyPatient.cellphone && legacyPatient.cellphone !== 'NULL')
            ? `+58${String(legacyPatient.cellphone_code).trim()}${String(legacyPatient.cellphone).trim()}`
            : 'N/A');

        const email = isValidEmail(legacyPatient.email) 
          ? legacyPatient.email 
          : `${identification.trim()}@email-legacy.com`;

        const patientData = {
          firstName: (legacyPatient.names || 'N/A').trim(),
          lastName: (legacyPatient.surnames || 'N/A').trim(),
          identification: String(identification).trim(),
          email: email,
          phone: fullPhone,
          birthDate: parseDate(legacyPatient.birthday),
          gender: transformGender(legacyPatient.gender),
          chronologicalAge: legacyPatient.age && legacyPatient.age !== 'NULL' ? parseInt(legacyPatient.age, 10) || 0 : 0,
          userId: adminUser.id,
          nationality: legacyPatient.document || 'V',
          historyDate: parseDate(legacyPatient.history || legacyPatient.created_at),
          birthPlace: (legacyPatient.birthplace || 'N/A').trim(),
          maritalStatus: (legacyPatient.marital_status || 'N/A').trim(),
          profession: (legacyPatient.occupation || 'N/A').trim(),
          country: 'Venezuela',
          state: 'N/A',
          city: 'N/A',
          address: (legacyPatient.address || 'N/A').trim(),
          bloodType: 'N/A',
          observations: 'Paciente migrado desde sistema legado.',
        };

        await prisma.patient.upsert({
          where: { identification: patientData.identification },
          update: patientData,
          create: patientData,
        });

        processedCount++;
        if (processedCount % 100 === 0) {
          console.log(`📈 Progreso: ${processedCount}/${legacyPatients.length}`);
        }
      } catch (recordError: any) {
        errorCount++;
        console.error(`❌ Error en registro ${index + 1} (ID: ${legacyPatient.identification_id}):`, recordError.message);
      }
    }
    
    console.log(`\n🎉 Sincronización completada:\n✅ Procesados: ${processedCount}\n⚠️ Omitidos: ${skippedCount}\n❌ Errores: ${errorCount}`);
    return { success: true, processed: processedCount, skipped: skippedCount, errors: errorCount };

  } catch (error) {
    console.error('Error durante la sincronización:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
    return { success: false, error: errorMessage };
  } finally {
    if (mysqlConnection) {
      await mysqlConnection.end();
      console.log('Conexión a MySQL cerrada.');
    }
    await prisma.$disconnect();
    console.log('Conexión a Prisma cerrada.');
  }
}