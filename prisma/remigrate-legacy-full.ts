// prisma/remigrate-legacy-full.ts

import { PrismaClient, Gender } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';


const prisma = new PrismaClient();

// Interfaces para tipar los datos de cada CSV
interface PersonCsvRecord {
    user_id: string;
    identification_id: string;
    surnames: string;
    names: string;
    birthday: string;
    gender: string;
    birthplace: string;
    phone: string;
    marital_status: string;
    occupation: string;
    address: string;
    observations: string;
    bloody_type: string;
    country: string;
    state: string;
    city: string;
    history: string;
}

interface UserCsvRecord {
    id: string;
    email: string;
}

function normalizePhoneNumber(rawPhoneNumber: string): string {
    if (!rawPhoneNumber) return 'N/A';
    let digits = rawPhoneNumber.replace(/\D/g, '');
    if (digits.startsWith('58')) return `+${digits}`;
    if (digits.length === 11 && digits.startsWith('04')) return `+58${digits.substring(1)}`;
    if (digits.length === 10 && digits.startsWith('4')) return `+58${digits}`;
    return 'N/A';
}

async function main() {
    console.log('🚀 Iniciando script de RE-MIGRACIÓN ENRIQUECIDA de datos legados (v3)...');

    // --- 1. Eliminar registros legados ---
    console.log('🔥 Paso 1: Eliminando pacientes migrados previamente...');
    try {
        const { count } = await prisma.patient.deleteMany({
            where: {
                email: {
                    endsWith: '@email-legacy.com',
                },
            },
        });
        console.log(`✅ Se eliminaron ${count} registros de pacientes legados.`);
    } catch (error) {
        console.error('❌ Error crítico al eliminar los registros antiguos. Abortando.', error);
        process.exit(1);
    }

    // --- 2. Cargar y Mapear ambos CSVs ---
    console.log('\n📄 Paso 2: Leyendo y procesando archivos CSV...');

    // Cargar users.csv y crear un mapa para búsqueda rápida
    const usersCsvPath = path.join(__dirname, 'data', 'users.csv');
    if (!fs.existsSync(usersCsvPath)) {
        console.error(`❌ Error: No se encontró el archivo users.csv en ${usersCsvPath}`);
        return;
    }
    const usersFileContent = fs.readFileSync(usersCsvPath, 'utf-8');
    const userRecords: UserCsvRecord[] = parse(usersFileContent, { columns: true, skip_empty_lines: true, trim: true });

    const emailMap = new Map<string, string>();
    for (const user of userRecords) {
        if (user.id && user.email) {
            emailMap.set(user.id.trim(), user.email.trim().toLowerCase());
        }
    }
    console.log(`🧑‍💻 Se mapearon ${emailMap.size} usuarios con sus correos electrónicos.`);

    // Cargar persons.csv
    const personsCsvPath = path.join(__dirname, 'data', 'persons.csv');
    if (!fs.existsSync(personsCsvPath)) {
        console.error(`❌ Error: No se encontró el archivo persons.csv en ${personsCsvPath}`);
        return;
    }
    const personsFileContent = fs.readFileSync(personsCsvPath, 'utf-8');
    const personRecords: PersonCsvRecord[] = parse(personsFileContent, { columns: true, skip_empty_lines: true, trim: true });
    console.log(`🧍 Se encontraron ${personRecords.length} registros de personas en el CSV.`);

    // --- 3. Procesar e insertar nuevos registros ---
    console.log('\n✨ Paso 3: Combinando datos y creando nuevos registros de pacientes...');
    let createdCount = 0;
    let skippedCount = 0;

    for (const person of personRecords) {
        const identification = person.identification_id?.trim();
        const userId = person.user_id?.trim();

        if (!identification || identification.length < 5 || isNaN(parseInt(identification)) || !userId) {
            skippedCount++;
            continue;
        }

        // Búsqueda del email usando el mapa
        const email = emailMap.get(userId) || `${identification}@email-legacy.com`;
        const phone = normalizePhoneNumber(person.phone);

        let gender: Gender = Gender.FEMENINO; // Usamos un valor por defecto válido
        if (person.gender === '1' || person.gender === '2') {
            gender = Gender.FEMENINO;
        } else if (person.gender === '3' || person.gender === '4') {
            gender = Gender.MASCULINO;
        }

        try {
            await prisma.patient.create({
                data: {
                    userId: process.env.ADMIN_USER_ID || 'clwscb27900001234abcd5678',
                    identification: identification,
                    historyDate: person.history ? new Date(person.history) : new Date(),
                    lastName: person.surnames || 'N/A',
                    firstName: person.names || 'N/A',
                    birthDate: person.birthday ? new Date(person.birthday) : new Date('1900-01-01'),
                    chronologicalAge: 0,
                    gender: gender,
                    birthPlace: person.birthplace || 'N/A',
                    phone: phone,
                    maritalStatus: person.marital_status || 'N/A',
                    profession: person.occupation || 'N/A',
                    country: person.country || 'Venezuela',
                    state: person.state || 'N/A',
                    city: person.city || 'N/A',
                    address: person.address || 'N/A',
                    bloodType: person.bloody_type || 'N/A',
                    email: email, // <-- AHORA USAMOS EL EMAIL REAL O EL PLACEHOLDER
                    observations: person.observations,
                },
            });
            createdCount++;
            console.log(`➕ Creado paciente: ${person.names} ${person.surnames} (Email: ${email})`);
        } catch (error: any) {
            if (error.code === 'P2002') {
                console.warn(`⚠️  El paciente con ID ${identification} ya existe. Omitiendo.`);
                skippedCount++;
            } else {
                console.error(`❌ Error creando al paciente con ID ${identification}:`, error);
                skippedCount++;
            }
        }
    }

    // --- 4. Informe final ---
    console.log('\n\n--- 📊 Informe Final de Re-Migración Enriquecida ---');
    console.log(`Total de registros de personas en CSV: ${personRecords.length}`);
    console.log(`✅ Pacientes creados exitosamente: ${createdCount}`);
    console.log(`⚠️ Registros omitidos (ID inválido, duplicado o sin user_id): ${skippedCount}`);
    console.log('-------------------------------------\n');
    console.log('🏁 Script de re-migración finalizado.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });