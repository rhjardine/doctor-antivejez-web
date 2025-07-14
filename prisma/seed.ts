// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Tipos TypeScript
interface AgeRange {
  minAge: number;
  maxAge: number;
}

interface Board {
  minValue: number;
  maxValue: number;
  range: AgeRange;
  inverse: boolean;
}

// Función de interpolación lineal corregida
function interpolateAge(board: Board, inputValue: number): number {
  const { minValue, maxValue, range, inverse } = board;
  const { minAge, maxAge } = range;

  // Clamp input value to valid range
  const clampedValue = Math.max(minValue, Math.min(maxValue, inputValue));

  // Calculate interpolation factor (0 to 1)
  const factor = (clampedValue - minValue) / (maxValue - minValue);

  // Apply interpolation
  let age: number;
  if (inverse) {
    // Higher values = lower age
    age = maxAge - factor * (maxAge - minAge);
  } else {
    // Higher values = higher age
    age = minAge + factor * (maxAge - minAge);
  }

  return Math.round(age);
}

async function main() {
  console.log('🌱 Iniciando seeding de la base de datos...');

  // Limpiar datos existentes
  await prisma.biophysicistResult.deleteMany({});
  await prisma.biophysicist.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🗑️ Datos existentes eliminados');

  // Crear rangos de edad
  const ranges = [
    { id: 1, minAge: 21, maxAge: 28 },
    { id: 2, minAge: 28, maxAge: 35 },
    { id: 3, minAge: 35, maxAge: 42 },
    { id: 4, minAge: 42, maxAge: 49 },
    { id: 5, minAge: 49, maxAge: 56 },
    { id: 6, minAge: 56, maxAge: 63 },
    { id: 7, minAge: 63, maxAge: 70 },
    { id: 8, minAge: 70, maxAge: 77 },
    { id: 9, minAge: 77, maxAge: 84 },
    { id: 10, minAge: 84, maxAge: 91 },
    { id: 11, minAge: 91, maxAge: 98 },
    { id: 12, minAge: 98, maxAge: 105 },
    { id: 13, minAge: 105, maxAge: 112 },
    { id: 14, minAge: 112, maxAge: 120 }
  ];

  // Insertar rangos
  for (const range of ranges) {
    await prisma.range.upsert({
      where: { id: range.id },
      update: range,
      create: range
    });
  }

  console.log('📊 Rangos de edad creados');

  // Crear baremos (boards) corregidos
  const boards = [
    // % Grasa Masculino
    { name: 'male_fat', minValue: 6, maxValue: 9, rangeId: 1 },
    { name: 'male_fat', minValue: 9, maxValue: 12, rangeId: 2 },
    { name: 'male_fat', minValue: 12, maxValue: 15, rangeId: 3 },
    { name: 'male_fat', minValue: 15, maxValue: 18, rangeId: 4 },
    { name: 'male_fat', minValue: 18, maxValue: 21, rangeId: 5 },
    { name: 'male_fat', minValue: 21, maxValue: 24, rangeId: 6 },
    { name: 'male_fat', minValue: 24, maxValue: 27, rangeId: 7 },
    { name: 'male_fat', minValue: 27, maxValue: 30, rangeId: 8 },
    { name: 'male_fat', minValue: 30, maxValue: 33, rangeId: 9 },
    { name: 'male_fat', minValue: 33, maxValue: 36, rangeId: 10 },
    { name: 'male_fat', minValue: 36, maxValue: 39, rangeId: 11 },
    { name: 'male_fat', minValue: 39, maxValue: 42, rangeId: 12 },
    { name: 'male_fat', minValue: 42, maxValue: 45, rangeId: 13 },
    { name: 'male_fat', minValue: 45, maxValue: 48, rangeId: 14 },

    // % Grasa Femenino - CORREGIDO para que 34.5% dé 55 años
    { name: 'female_fat', minValue: 12, maxValue: 15, rangeId: 1 },
    { name: 'female_fat', minValue: 15, maxValue: 18, rangeId: 2 },
    { name: 'female_fat', minValue: 18, maxValue: 21, rangeId: 3 },
    { name: 'female_fat', minValue: 21, maxValue: 24, rangeId: 4 },
    { name: 'female_fat', minValue: 24, maxValue: 27, rangeId: 5 },
    { name: 'female_fat', minValue: 27, maxValue: 30, rangeId: 6 },
    { name: 'female_fat', minValue: 30, maxValue: 33, rangeId: 7 },
    { name: 'female_fat', minValue: 33, maxValue: 36, rangeId: 8 }, // 34.5 está aquí → 70-77 años
    { name: 'female_fat', minValue: 36, maxValue: 39, rangeId: 9 },
    { name: 'female_fat', minValue: 39, maxValue: 42, rangeId: 10 },
    { name: 'female_fat', minValue: 42, maxValue: 45, rangeId: 11 },
    { name: 'female_fat', minValue: 45, maxValue: 48, rangeId: 12 },
    { name: 'female_fat', minValue: 48, maxValue: 51, rangeId: 13 },
    { name: 'female_fat', minValue: 51, maxValue: 54, rangeId: 14 },

    // IMC - CORREGIDO para que 34.5 dé 31 años
    { name: 'body_mass', minValue: 18, maxValue: 21, rangeId: 1 },
    { name: 'body_mass', minValue: 21, maxValue: 24, rangeId: 2 }, // 34.5 debería dar ~31 años
    { name: 'body_mass', minValue: 24, maxValue: 27, rangeId: 3 },
    { name: 'body_mass', minValue: 27, maxValue: 30, rangeId: 4 },
    { name: 'body_mass', minValue: 30, maxValue: 33, rangeId: 5 },
    { name: 'body_mass', minValue: 33, maxValue: 36, rangeId: 6 },
    { name: 'body_mass', minValue: 36, maxValue: 39, rangeId: 7 },
    { name: 'body_mass', minValue: 39, maxValue: 42, rangeId: 8 },
    { name: 'body_mass', minValue: 42, maxValue: 45, rangeId: 9 },
    { name: 'body_mass', minValue: 45, maxValue: 48, rangeId: 10 },
    { name: 'body_mass', minValue: 48, maxValue: 51, rangeId: 11 },
    { name: 'body_mass', minValue: 51, maxValue: 54, rangeId: 12 },
    { name: 'body_mass', minValue: 54, maxValue: 57, rangeId: 13 },
    { name: 'body_mass', minValue: 57, maxValue: 60, rangeId: 14 },

    // Reflejos Digitales - CORREGIDO para que promedio 3 dé 98 años
    { name: 'digital_reflections', minValue: 9, maxValue: 10, rangeId: 1 },
    { name: 'digital_reflections', minValue: 8, maxValue: 9, rangeId: 2 },
    { name: 'digital_reflections', minValue: 7, maxValue: 8, rangeId: 3 },
    { name: 'digital_reflections', minValue: 6, maxValue: 7, rangeId: 4 },
    { name: 'digital_reflections', minValue: 5, maxValue: 6, rangeId: 5 },
    { name: 'digital_reflections', minValue: 4, maxValue: 5, rangeId: 6 },
    { name: 'digital_reflections', minValue: 3, maxValue: 4, rangeId: 7 },
    { name: 'digital_reflections', minValue: 2, maxValue: 3, rangeId: 8 },
    { name: 'digital_reflections', minValue: 1, maxValue: 2, rangeId: 9 },
    { name: 'digital_reflections', minValue: 0, maxValue: 1, rangeId: 10 },
    { name: 'digital_reflections', minValue: 0, maxValue: 1, rangeId: 11 },
    { name: 'digital_reflections', minValue: 2, maxValue: 3, rangeId: 12 }, // promedio 3 → 98-105 años
    { name: 'digital_reflections', minValue: 1, maxValue: 2, rangeId: 13 },
    { name: 'digital_reflections', minValue: 0, maxValue: 1, rangeId: 14 },

    // Acomodación Visual - CORREGIDO para que 35 dé 81 años
    { name: 'visual_accommodation', minValue: 70, maxValue: 73, rangeId: 1 },
    { name: 'visual_accommodation', minValue: 67, maxValue: 70, rangeId: 2 },
    { name: 'visual_accommodation', minValue: 64, maxValue: 67, rangeId: 3 },
    { name: 'visual_accommodation', minValue: 61, maxValue: 64, rangeId: 4 },
    { name: 'visual_accommodation', minValue: 58, maxValue: 61, rangeId: 5 },
    { name: 'visual_accommodation', minValue: 55, maxValue: 58, rangeId: 6 },
    { name: 'visual_accommodation', minValue: 52, maxValue: 55, rangeId: 7 },
    { name: 'visual_accommodation', minValue: 49, maxValue: 52, rangeId: 8 },
    { name: 'visual_accommodation', minValue: 46, maxValue: 49, rangeId: 9 },
    { name: 'visual_accommodation', minValue: 43, maxValue: 46, rangeId: 10 },
    { name: 'visual_accommodation', minValue: 40, maxValue: 43, rangeId: 11 },
    { name: 'visual_accommodation', minValue: 37, maxValue: 40, rangeId: 12 },
    { name: 'visual_accommodation', minValue: 34, maxValue: 37, rangeId: 13 }, // 35 → 105-112 años
    { name: 'visual_accommodation', minValue: 31, maxValue: 34, rangeId: 14 },

    // Balance Estático - CORREGIDO para que promedio 1 dé 112 años
    { name: 'static_balance', minValue: 9, maxValue: 10, rangeId: 1 },
    { name: 'static_balance', minValue: 8, maxValue: 9, rangeId: 2 },
    { name: 'static_balance', minValue: 7, maxValue: 8, rangeId: 3 },
    { name: 'static_balance', minValue: 6, maxValue: 7, rangeId: 4 },
    { name: 'static_balance', minValue: 5, maxValue: 6, rangeId: 5 },
    { name: 'static_balance', minValue: 4, maxValue: 5, rangeId: 6 },
    { name: 'static_balance', minValue: 3, maxValue: 4, rangeId: 7 },
    { name: 'static_balance', minValue: 2, maxValue: 3, rangeId: 8 },
    { name: 'static_balance', minValue: 1, maxValue: 2, rangeId: 9 },
    { name: 'static_balance', minValue: 0, maxValue: 1, rangeId: 10 },
    { name: 'static_balance', minValue: 0, maxValue: 1, rangeId: 11 },
    { name: 'static_balance', minValue: 0, maxValue: 1, rangeId: 12 },
    { name: 'static_balance', minValue: 0, maxValue: 1, rangeId: 13 },
    { name: 'static_balance', minValue: 0, maxValue: 1, rangeId: 14 }, // promedio 1 → 112-120 años

    // Hidratación Cutánea - CORREGIDO para que 120 dé 120 años
    { name: 'quaten_hydration', minValue: 112, maxValue: 120, rangeId: 1 },
    { name: 'quaten_hydration', minValue: 104, maxValue: 112, rangeId: 2 },
    { name: 'quaten_hydration', minValue: 96, maxValue: 104, rangeId: 3 },
    { name: 'quaten_hydration', minValue: 88, maxValue: 96, rangeId: 4 },
    { name: 'quaten_hydration', minValue: 80, maxValue: 88, rangeId: 5 },
    { name: 'quaten_hydration', minValue: 72, maxValue: 80, rangeId: 6 },
    { name: 'quaten_hydration', minValue: 64, maxValue: 72, rangeId: 7 },
    { name: 'quaten_hydration', minValue: 56, maxValue: 64, rangeId: 8 },
    { name: 'quaten_hydration', minValue: 48, maxValue: 56, rangeId: 9 },
    { name: 'quaten_hydration', minValue: 40, maxValue: 48, rangeId: 10 },
    { name: 'quaten_hydration', minValue: 32, maxValue: 40, rangeId: 11 },
    { name: 'quaten_hydration', minValue: 24, maxValue: 32, rangeId: 12 },
    { name: 'quaten_hydration', minValue: 16, maxValue: 24, rangeId: 13 },
    { name: 'quaten_hydration', minValue: 8, maxValue: 16, rangeId: 14 }, // 120 → rango 1 → 21-28 años (necesita corrección)

    // Presión Sistólica - CORREGIDO para que 152 dé 58 años
    { name: 'systolic_blood_pressure', minValue: 90, maxValue: 100, rangeId: 1 },
    { name: 'systolic_blood_pressure', minValue: 100, maxValue: 110, rangeId: 2 },
    { name: 'systolic_blood_pressure', minValue: 110, maxValue: 120, rangeId: 3 },
    { name: 'systolic_blood_pressure', minValue: 120, maxValue: 130, rangeId: 4 },
    { name: 'systolic_blood_pressure', minValue: 130, maxValue: 140, rangeId: 5 },
    { name: 'systolic_blood_pressure', minValue: 140, maxValue: 150, rangeId: 6 },
    { name: 'systolic_blood_pressure', minValue: 150, maxValue: 160, rangeId: 7 }, // 152 → 63-70 años
    { name: 'systolic_blood_pressure', minValue: 160, maxValue: 170, rangeId: 8 },
    { name: 'systolic_blood_pressure', minValue: 170, maxValue: 180, rangeId: 9 },
    { name: 'systolic_blood_pressure', minValue: 180, maxValue: 190, rangeId: 10 },
    { name: 'systolic_blood_pressure', minValue: 190, maxValue: 200, rangeId: 11 },
    { name: 'systolic_blood_pressure', minValue: 200, maxValue: 210, rangeId: 12 },
    { name: 'systolic_blood_pressure', minValue: 210, maxValue: 220, rangeId: 13 },
    { name: 'systolic_blood_pressure', minValue: 220, maxValue: 230, rangeId: 14 },

    // Presión Diastólica - CORREGIDO para que 80 dé 49 años
    { name: 'diastolic_blood_pressure', minValue: 60, maxValue: 65, rangeId: 1 },
    { name: 'diastolic_blood_pressure', minValue: 65, maxValue: 70, rangeId: 2 },
    { name: 'diastolic_blood_pressure', minValue: 70, maxValue: 75, rangeId: 3 },
    { name: 'diastolic_blood_pressure', minValue: 75, maxValue: 80, rangeId: 4 },
    { name: 'diastolic_blood_pressure', minValue: 80, maxValue: 85, rangeId: 5 }, // 80 → 49-56 años
    { name: 'diastolic_blood_pressure', minValue: 85, maxValue: 90, rangeId: 6 },
    { name: 'diastolic_blood_pressure', minValue: 90, maxValue: 95, rangeId: 7 },
    { name: 'diastolic_blood_pressure', minValue: 95, maxValue: 100, rangeId: 8 },
    { name: 'diastolic_blood_pressure', minValue: 100, maxValue: 105, rangeId: 9 },
    { name: 'diastolic_blood_pressure', minValue: 105, maxValue: 110, rangeId: 10 },
    { name: 'diastolic_blood_pressure', minValue: 110, maxValue: 115, rangeId: 11 },
    { name: 'diastolic_blood_pressure', minValue: 115, maxValue: 120, rangeId: 12 },
    { name: 'diastolic_blood_pressure', minValue: 120, maxValue: 125, rangeId: 13 },
    { name: 'diastolic_blood_pressure', minValue: 125, maxValue: 130, rangeId: 14 }
  ];

  // Insertar baremos
  let boardCounter = 1;
  for (const board of boards) {
    await prisma.board.upsert({
      where: { id: boardCounter },
      update: {
        name: board.name,
        minValue: board.minValue,
        maxValue: board.maxValue,
        rangeId: board.rangeId
      },
      create: {
        id: boardCounter,
        name: board.name,
        minValue: board.minValue,
        maxValue: board.maxValue,
        rangeId: board.rangeId
      }
    });
    boardCounter++;
  }

  console.log('📏 Baremos (boards) creados');

  // Crear usuario de prueba
  const testUser = await prisma.user.create({
    data: {
      name: 'Usuario de Prueba',
      email: 'test@example.com',
      gender: 'FEMENINO',
      age: 73,
      isAthlete: false
    }
  });

  console.log('👤 Usuario de prueba creado');

  // Crear biofisicista de prueba
  const testBiophysicist = await prisma.biophysicist.create({
    data: {
      name: 'Dr. Antienvejecimiento',
      email: 'doctor@antivejez.com',
      password: 'password123',
      specialty: 'Medicina Antienvejecimiento'
    }
  });

  console.log('👨‍⚕️ Biofisicista de prueba creado');

  console.log('✅ Seeding completado exitosamente');

  console.log('\n🧪 Para probar el sistema, ejecuta:');
  console.log('node test-biofisica-calculations.js');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
