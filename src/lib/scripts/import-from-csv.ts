import { PrismaClient, Gender } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// ===== INICIO DE LA CORRECCIÓN =====
// 1. Se añade la propiedad 'email' que faltaba en la interfaz.
//    Ahora la interfaz refleja completamente la estructura del CSV.
interface CsvRecord {
  id: string;
  user_id: string;
  city_id: string;
  document: string;
  identification_id: string;
  history: string;
  surnames: string;
  names: string;
  birthday: string;
  age: string;
  gender: string;
  birthplace: string;
  phone_code: string;
  phone: string;
  cellphone_code: string;
  cellphone: string;
  marital_status: string;
  occupation: string;
  address: string;
  observations: string;
  created_at: string;
  email: string; // <-- PROPIEDAD AÑADIDA
}
// ===== FIN DE LA CORRECCIÓN =====

function transformGender(gender: string | null): Gender {
  if (gender === '1' || gender?.toUpperCase() === 'F') return Gender.FEMENINO;
  if (gender === '2' || gender?.toUpperCase() === 'M') return Gender.MASCULINO;
  return Gender.FEMENINO; 
}

export async function importFromCsv(filePath: string) {
  console.log(`Iniciando la importación desde el archivo: ${filePath}`);
  try {
    const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' });

    const records: CsvRecord[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    console.log(`Se encontraron ${records.length} registros en el archivo CSV.`);

    if (records.length === 0) {
      console.log('No hay registros para importar. Proceso finalizado.');
      return { success: true, processed: 0 };
    }

    const adminUser = await prisma.user.findFirst({
      where: { email: 'dr.admin@example.com' }, // Reemplaza con el email real
    });
    if (!adminUser) {
      throw new Error('No se encontró el usuario administrador.');
    }

    let processedCount = 0;
    for (const record of records) {
      if (!record.identification_id || record.identification_id === 'NULL') continue;

      const fullPhone = record.phone_code && record.phone && record.phone !== 'NULL' 
        ? `+58${record.phone_code}${record.phone}` 
        : (record.cellphone_code && record.cellphone && record.cellphone !== 'NULL' 
            ? `+58${record.cellphone_code}${record.cellphone}` 
            : 'N/A');

      // 2. Ahora, TypeScript permite el acceso a 'record.email' sin errores.
      const patientData = {
        firstName: record.names || 'N/A',
        lastName: record.surnames || 'N/A',
        identification: record.identification_id,
        email: record.email && record.email !== 'NULL' ? record.email : `${record.identification_id}@email.com`,
        phone: fullPhone,
        birthDate: record.birthday && record.birthday !== 'NULL' ? new Date(record.birthday) : new Date('1900-01-01'),
        gender: transformGender(record.gender),
        chronologicalAge: record.age && record.age !== 'NULL' ? parseInt(record.age, 10) : 0,
        userId: adminUser.id,
        nationality: record.document || 'V',
        historyDate: record.history && record.history !== 'NULL' ? new Date(record.history) : new Date(),
        birthPlace: record.birthplace && record.birthplace !== 'NULL' ? record.birthplace : 'N/A',
        maritalStatus: record.marital_status && record.marital_status !== 'NULL' ? record.marital_status : 'N/A',
        profession: record.occupation && record.occupation !== 'NULL' ? record.occupation : 'N/A',
        country: 'Venezuela',
        state: 'N/A',
        city: 'N/A',
        address: record.address && record.address !== 'NULL' ? record.address : 'N/A',
        bloodType: 'N/A',
        observations: record.observations && record.observations !== 'NULL' ? record.observations : 'Paciente importado desde CSV.',
      };

      await prisma.patient.upsert({
        where: { identification: patientData.identification },
        update: patientData,
        create: patientData,
      });
      processedCount++;
    }

    console.log(`Importación completada. ${processedCount} registros procesados.`);
    return { success: true, processed: processedCount };

  } catch (error) {
    console.error('Error durante la importación desde CSV:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
    return { success: false, error: errorMessage };
  } finally {
    await prisma.$disconnect();
  }
}