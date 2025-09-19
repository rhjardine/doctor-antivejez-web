// prisma/import-legacy.ts
import { PrismaClient, Gender } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

// --- INICIO DEL SCRIPT ---

const prisma = new PrismaClient();

interface CsvRecord {
  [key: string]: string;
}

function transformGender(gender: string): Gender {
  if (gender === '1' || gender?.toUpperCase() === 'F') return Gender.FEMENINO;
  if (gender === '2' || gender?.toUpperCase() === 'M') return Gender.MASCULINO;
  return Gender.FEMENINO;
}

function isValidEmail(email: string): boolean {
  if (!email || email === 'NULL' || email === 'N/A') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function formatPhone(phoneCode: string, phone: string, cellphoneCode: string, cellphone: string): string | null {
  if (phone && phone !== 'NULL' && phoneCode && phoneCode !== 'NULL') {
    return `+58${phoneCode.trim()}${phone.trim()}`;
  }
  if (cellphone && cellphone !== 'NULL' && cellphoneCode && cellphoneCode !== 'NULL') {
    return `+58${cellphoneCode.trim()}${cellphone.trim()}`;
  }
  return null;
}

function parseDate(dateString: string): Date {
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

async function importFromCsv(filePath: string) {
  console.log(`🚀 Iniciando importación desde: ${filePath}`);
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`❌ El archivo no existe: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
    const records: CsvRecord[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`📊 Registros encontrados en CSV: ${records.length}`);
    if (records.length === 0) {
      console.log('⚠️ No hay registros para importar.');
      return { success: true, processed: 0 };
    }

    console.log('👤 Buscando usuario administrador...');
    const adminUser = await prisma.user.findFirst({
      where: { email: 'dr.admin@example.com' }, // Reemplaza con el email real
    });
    if (!adminUser) {
      throw new Error('❌ No se encontró usuario administrador.');
    }
    console.log(`👤 Usuario admin encontrado: ${adminUser.email}`);

    let processedCount = 0, errorCount = 0, skippedCount = 0;

    // Usamos un bucle 'for' clásico para máxima compatibilidad
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const index = i;

      try {
        const identification = record.identification_id;
        if (!identification || identification === 'NULL' || identification.trim() === '') {
          skippedCount++;
          continue;
        }

        const phone = formatPhone(record.phone_code, record.phone, record.cellphone_code, record.cellphone);
        let email = record.email;
        if (!isValidEmail(email)) {
          email = `${identification.trim()}@email-legacy.com`;
        }

        const patientData = {
          firstName: (record.names || 'N/A').trim(),
          lastName: (record.surnames || 'N/A').trim(),
          identification: identification.trim(),
          email: email,
          phone: phone || 'N/A',
          birthDate: parseDate(record.birthday),
          gender: transformGender(record.gender),
          chronologicalAge: record.age && record.age !== 'NULL' ? parseInt(record.age, 10) || 0 : 0,
          userId: adminUser.id,
          nationality: record.document || 'V',
          historyDate: parseDate(record.history || record.created_at),
          birthPlace: (record.birthplace || 'N/A').trim(),
          maritalStatus: (record.marital_status || 'N/A').trim(),
          profession: (record.occupation || 'N/A').trim(),
          country: 'Venezuela',
          state: 'N/A',
          city: 'N/A',
          address: (record.address || 'N/A').trim(),
          bloodType: 'N/A',
          observations: (record.observations || 'Paciente importado desde CSV.').trim(),
        };

        await prisma.patient.upsert({
          where: { identification: patientData.identification },
          update: patientData,
          create: patientData,
        });

        processedCount++;
        if (processedCount % 100 === 0) {
          console.log(`📈 Progreso: ${processedCount}/${records.length}`);
        }
      } catch (recordError: any) {
        errorCount++;
        console.error(`❌ Error en registro ${index + 1} (ID: ${record.identification_id}):`, recordError.message);
      }
    }

    console.log(`\n🎉 Importación completada:\n✅ Procesados: ${processedCount}\n⚠️ Omitidos: ${skippedCount}\n❌ Errores: ${errorCount}`);
    return { success: true, processed: processedCount };
    
  } catch (error: any) {
    console.error('💥 Error crítico durante la importación:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

// --- Punto de Entrada del Script ---
async function main() {
  // Construimos la ruta al archivo CSV basándonos en la raíz del proyecto.
  const filePath = path.join(process.cwd(), 'prisma', 'data', 'persons.csv');
  await importFromCsv(filePath);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});