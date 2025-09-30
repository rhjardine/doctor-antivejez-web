// START OF FILE: prisma/fix-contacts-v2.ts

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface CsvRecord {
  identification_id: string;
  phone_code: string;
  phone: string;
  cellphone_code: string;
  cellphone: string;
  bloody_type: string;
  names: string;
  surnames: string;
}

function normalizePhoneNumber(code: string, number: string): string {
  let fullNumber = `${code || ''}${number || ''}`.replace(/\D/g, '');

  if (fullNumber.startsWith('58')) {
    fullNumber = `+${fullNumber}`;
  } else if (fullNumber.length === 10 && fullNumber.startsWith('4')) {
    fullNumber = `+58${fullNumber}`;
  } else if (fullNumber.length === 11 && fullNumber.startsWith('04')) {
    fullNumber = `+58${fullNumber.substring(1)}`;
  }

  if (fullNumber.length >= 12 && fullNumber.startsWith('+58')) {
    return fullNumber;
  }
  
  return 'N/A';
}

async function main() {
  console.log('🚀 Iniciando script de reparación VERIFICABLE de datos de contacto (v2)...');

  const csvFilePath = path.join(__dirname, 'data', 'persons.csv');
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ Error: No se encontró el archivo CSV en ${csvFilePath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
  const records: CsvRecord[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`📄 Se encontraron ${records.length} registros en el archivo CSV.`);

  let updatedCount = 0;
  let notFoundCount = 0;
  let skippedCount = 0;
  let alreadyCorrectCount = 0;
  const notFoundIdentifications: string[] = [];
  const failedUpdates: string[] = [];

  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    console.log(`\n--- Procesando lote ${Math.floor(i / batchSize) + 1} / ${Math.ceil(records.length / batchSize)} ---`);

    for (const record of batch) {
      const identification = record.identification_id?.trim();
      if (!identification || identification.length < 5) {
        skippedCount++;
        continue;
      }

      const newPhone = normalizePhoneNumber(record.cellphone_code || record.phone_code, record.cellphone || record.phone);
      const newEmail = `${identification}@email-legacy.com`;
      const newBloodType = record.bloody_type?.trim() || 'N/A';

      try {
        const patientInDb = await prisma.patient.findUnique({
          where: { identification },
        });

        if (patientInDb) {
          const isPhoneCorrect = patientInDb.phone === newPhone;
          const isEmailCorrect = patientInDb.email === newEmail;
          const isBloodTypeCorrect = patientInDb.bloodType === newBloodType;

          if (isPhoneCorrect && isEmailCorrect && isBloodTypeCorrect) {
            alreadyCorrectCount++;
            console.log(`✔️  Datos ya correctos para ID: ${identification}. Omitiendo.`);
            continue;
          }

          const updatedPatient = await prisma.patient.update({
            where: { identification },
            data: {
              phone: newPhone,
              email: newEmail,
              bloodType: newBloodType,
            },
          });
          
          if (updatedPatient.phone === newPhone) {
            updatedCount++;
            console.log(`✅ Paciente actualizado: ${updatedPatient.firstName} (ID: ${identification})`);
          } else {
            failedUpdates.push(identification);
            console.error(`❌ FALLO DE ESCRITURA: La actualización no se reflejó para el ID: ${identification}`);
          }

        } else {
          notFoundCount++;
          notFoundIdentifications.push(identification);
        }
      } catch (error) {
        console.error(`❌ Error en el proceso para el ID ${identification}:`, error);
        failedUpdates.push(identification);
      }
    }
  }

  console.log('\n\n--- 📊 Informe Final de Reparación (v2) ---');
  console.log(`Total de registros en CSV: ${records.length}`);
  console.log(`✅ Pacientes actualizados exitosamente: ${updatedCount}`);
  console.log(`✔️  Pacientes que ya tenían datos correctos: ${alreadyCorrectCount}`);
  console.log(`🔍 Pacientes no encontrados en la BD: ${notFoundCount}`);
  console.log(`⚠️ Registros CSV omitidos (sin ID válido): ${skippedCount}`);
  console.log(`❌ Actualizaciones fallidas: ${failedUpdates.length}`);
  console.log('-------------------------------------\n');

  if (notFoundIdentifications.length > 0) {
    console.log('Cédulas de pacientes del CSV que no se encontraron en la base de datos:');
    console.log(notFoundIdentifications.join(', '));
  }
  if (failedUpdates.length > 0) {
    console.log('Cédulas de pacientes cuya actualización falló:');
    console.log(failedUpdates.join(', '));
  }

  console.log('🏁 Script de reparación finalizado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// END OF FILE: prisma/fix-contacts-v2.ts