import mysql from 'mysql2/promise';
import { PrismaClient, Gender } from '@prisma/client';

// Inicializamos Prisma Client para nuestra BD de PostgreSQL
const prisma = new PrismaClient();

// Función para transformar el género del formato antiguo al nuevo
function transformGender(gender: number | null): Gender {
  // Basado en tu captura de phpMyAdmin: 1 = Femenino, 2 = Masculino
  if (gender === 1) return Gender.FEMENINO;
  if (gender === 2) return Gender.MASCULINO;
  // Un valor por defecto seguro
  return Gender.FEMENINO; 
}

export async function syncLegacyDatabase() {
  console.log('Iniciando la sincronización con la base de datos legada...');
  let mysqlConnection;

  try {
    // 1. Conectar a MySQL
    console.log('Conectando a la base de datos MySQL legada...');
    mysqlConnection = await mysql.createConnection({
      host: process.env.LEGACY_DB_HOST,
      user: process.env.LEGACY_DB_USER,
      password: process.env.LEGACY_DB_PASSWORD,
      database: process.env.LEGACY_DB_DATABASE,
    });
    console.log('Conexión a MySQL exitosa.');

    // 2. Leer los registros de la tabla 'persons'
    console.log('Obteniendo registros de la tabla "persons"...');
    const [rows] = await mysqlConnection.execute('SELECT * FROM persons');
    const legacyPatients = rows as any[];
    console.log(`Se encontraron ${legacyPatients.length} registros en la base de datos legada.`);

    if (legacyPatients.length === 0) {
      console.log('No hay registros para sincronizar. Proceso finalizado.');
      return { success: true, created: 0, updated: 0 };
    }

    // 3. Transformar y hacer "upsert" en PostgreSQL
    let createdCount = 0;
    let updatedCount = 0;

    // Obtenemos el ID del usuario "Dr. Admin" para asociar los pacientes.
    // En un sistema real, esto debería ser más dinámico.
    const adminUser = await prisma.user.findFirst({
      where: { email: 'dr.admin@example.com' }, // Reemplaza con el email real del admin
    });

    if (!adminUser) {
      throw new Error('No se encontró el usuario administrador para asociar los pacientes.');
    }

    for (const legacyPatient of legacyPatients) {
      const patientData = {
        // Mapeo de campos basado en tu captura de phpMyAdmin
        firstName: legacyPatient.name || 'N/A',
        lastName: legacyPatient.surnames || 'N/A',
        identification: legacyPatient.identification_id || `legacy_${legacyPatient.id}`,
        email: legacyPatient.email || `legacy_${legacyPatient.id}@example.com`,
        phone: legacyPatient.phone || 'N/A',
        birthDate: legacyPatient.birthday || new Date('1900-01-01'),
        gender: transformGender(legacyPatient.gender),
        chronologicalAge: legacyPatient.age || 0,
        // Campos con valores por defecto ya que no existen en la BD legada
        userId: adminUser.id,
        photo: null,
        nationality: legacyPatient.document || 'N/A',
        historyDate: legacyPatient.history_date || new Date(),
        birthPlace: 'N/A',
        maritalStatus: 'N/A',
        profession: 'N/A',
        country: 'Venezuela',
        state: 'N/A',
        city: 'N/A',
        address: 'N/A',
        bloodType: 'N/A',
        observations: 'Paciente migrado desde sistema legado.',
      };

      // Usamos 'upsert' de Prisma:
      // - Si un paciente con esa 'identification' ya existe, lo actualiza.
      // - Si no existe, lo crea.
      await prisma.patient.upsert({
        where: { identification: patientData.identification },
        update: {
          // Define qué campos actualizar si el paciente ya existe
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          email: patientData.email,
          phone: patientData.phone,
        },
        create: patientData,
      });

      // Este es un ejemplo simple de conteo, se puede mejorar
      // para detectar si fue creación o actualización.
    }
    
    // Simplificamos el conteo por ahora
    console.log(`Sincronización completada. ${legacyPatients.length} registros procesados.`);
    
    return { success: true, processed: legacyPatients.length };

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