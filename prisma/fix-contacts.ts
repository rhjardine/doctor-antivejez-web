// prisma/fix-contacts.ts

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Interfaz adaptada a los nombres de columna del CSV
interface CsvRecord {
  identification_id: string;
  phone_code: string;
  phone: string;
  cellphone_code: string;
  cellphone: string;
  bloody_type: string;
  // Añadimos nombres para un logging más claro
  names: string;
  surnames: string;
}

/**
 * Normaliza un número de teléfono a un formato consistente.
 * - Elimina caracteres no numéricos.
 * - Si tiene 10 dígitos y empieza con '4', le añade '+58'.
 * - Si tiene 11 dígitos y empieza con '04', le quita el '0' y le añade '+58'.
 * - Si ya tiene el formato internacional, lo deja igual.
 * @param code El código de área del CSV (ej. '0414')
 * @param number El número del CSV (ej. '1234567')
 * @returns El número normalizado o 'N/A' si no es válido.
 */
function normalizePhoneNumber(code: string, number: string): string {
  let fullNumber = `${code || ''}${number || ''}`.replace(/\D/g, ''); // Elimina todo lo que no sea dígito

  if (fullNumber.startsWith('58')) {
    fullNumber = `+${fullNumber}`;
  } else if (fullNumber.length === 10 && fullNumber.startsWith('4')) {
    fullNumber = `+58${fullNumber}`;
  } else if (fullNumber.length === 11 && fullNumber.startsWith('04')) {
    fullNumber = `+58${fullNumber.substring(1)}`;
  }

  // Validación simple de longitud para un número venezolano
  if (fullNumber.length >= 12 && fullNumber.startsWith('+58')) {
    return fullNumber;
  }
  
  return 'N/A';
}


async function main() {
  console.log('🚀 Iniciando script de reparación de datos de contacto y tipo de sangre...');

  // --- 1. Cargar y parsear el archivo CSV ---
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

  console.log(`📄 Se encontraron ${records.length} registros en el archivo CSV a procesar.`);

  // --- 2. Preparar contadores para el informe final ---
  let updatedCount = 0;
  let notFoundCount = 0;
  let skippedCount = 0;
  const notFoundIdentifications: string[] = [];
  const updatePromises: Promise<any>[] = [];

  // --- 3. Iterar y preparar las actualizaciones ---
  for (const record of records) {
    const identification = record.identification_id?.trim();
    if (!identification || identification === '000000000' || identification === '123456789') {
      skippedCount++;
      continue; // Omitir registros de prueba o sin identificación válida
    }

    // Priorizar 'cellphone' sobre 'phone'
    const phone = normalizePhoneNumber(record.cellphone_code || record.phone_code, record.cellphone || record.phone);
    const email = `${identification}@email-legacy.com`; // Mantener el formato genérico por ahora
    const bloodType = record.bloody_type?.trim() || 'N/A';
    
    // ANÁLISIS DE SEGURIDAD:
    // Esta operación es un UPDATE SELECTIVO. Solo modifica los campos especificados
    // en la cláusula `data`. El resto de los datos del paciente (historiales médicos,
    // datos biológicos, etc.) NO SERÁN TOCADOS. La operación se basa en una clave
    // única (`identification`), lo que garantiza que solo se actualice el registro correcto.
    const updatePromise = prisma.patient.updateMany({
      where: { identification },
      data: {
        phone,
        email,
        bloodType,
      },
    }).then(result => {
      if (result.count > 0) {
        updatedCount++;
        console.log(`✅ Datos de contacto para ${record.names} ${record.surnames} (ID: ${identification}) preparados para actualizar.`);
      } else {
        notFoundCount++;
        notFoundIdentifications.push(identification);
        console.warn(`🔍 Paciente no encontrado en la BD con identificación: ${identification}`);
      }
    }).catch(error => {
      console.error(`❌ Error preparando la actualización para el paciente con ID ${identification}:`, error);
    });

    updatePromises.push(updatePromise);
  }
  
  console.log('\n⏳ Ejecutando todas las actualizaciones en la base de datos...');
  await Promise.all(updatePromises);
  console.log('✅ Todas las operaciones de actualización han sido enviadas.');


  // --- 4. Generar y mostrar el informe final ---
  console.log('\n\n--- 📊 Informe Final de Reparación ---');
  console.log(`Total de registros en CSV: ${records.length}`);
  console.log(`✅ Pacientes actualizados exitosamente: ${updatedCount}`);
  console.log(`🔍 Pacientes no encontrados en la BD: ${notFoundCount}`);
  console.log(`⚠️ Registros CSV omitidos (inválidos o de prueba): ${skippedCount}`);
  console.log('-------------------------------------\n');

  if (notFoundIdentifications.length > 0) {
    console.log('Cédulas de pacientes del CSV que no se encontraron en la base de datos:');
    console.log(notFoundIdentifications.join(', '));
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