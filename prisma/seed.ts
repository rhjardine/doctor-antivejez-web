// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seeding de la base de datos...');

  // --- 1. Limpiar datos antiguos de Baremos y Rangos ---
  // Es más seguro eliminar y recrear para evitar conflictos.
  await prisma.board.deleteMany({});
  await prisma.range.deleteMany({});
  console.log('🗑️ Baremos y Rangos antiguos eliminados.');

  // --- 2. Crear Rangos de Edad ---
  // Estos son los 14 rangos de edad que se usarán en los baremos.
  const rangesData = [
    { id: 1, minAge: 21, maxAge: 28 },   { id: 2, minAge: 28, maxAge: 35 },
    { id: 3, minAge: 35, maxAge: 42 },   { id: 4, minAge: 42, maxAge: 49 },
    { id: 5, minAge: 49, maxAge: 56 },   { id: 6, minAge: 56, maxAge: 63 },
    { id: 7, minAge: 63, maxAge: 70 },   { id: 8, minAge: 70, maxAge: 77 },
    { id: 9, minAge: 77, maxAge: 84 },   { id: 10, minAge: 84, maxAge: 91 },
    { id: 11, minAge: 91, maxAge: 98 },  { id: 12, minAge: 98, maxAge: 105 },
    { id: 13, minAge: 105, maxAge: 112 },{ id: 14, minAge: 112, maxAge: 120 },
  ];
  await prisma.range.createMany({ data: rangesData });
  console.log('📊 Rangos de edad creados/actualizados.');

  // --- 3. Crear Baremos (Boards) ---
  // Estos datos se extrajeron del PDF "Formulas Test Biofisico.pdf"
  const boardsData = [
    // --- % Grasa Masculino (Normal) ---
    { name: 'male_fat', minValue: 10, maxValue: 14, rangeId: 1, inverse: false },
    { name: 'male_fat', minValue: 14, maxValue: 18, rangeId: 2, inverse: false },
    { name: 'male_fat', minValue: 18, maxValue: 21, rangeId: 3, inverse: false },
    { name: 'male_fat', minValue: 21, maxValue: 24, rangeId: 4, inverse: false },
    { name: 'male_fat', minValue: 24, maxValue: 27, rangeId: 5, inverse: false },
    { name: 'male_fat', minValue: 27, maxValue: 30, rangeId: 6, inverse: false },
    { name: 'male_fat', minValue: 30, maxValue: 33, rangeId: 7, inverse: false },
    { name: 'male_fat', minValue: 33, maxValue: 36, rangeId: 8, inverse: false },
    { name: 'male_fat', minValue: 36, maxValue: 39, rangeId: 9, inverse: false },
    { name: 'male_fat', minValue: 39, maxValue: 42, rangeId: 10, inverse: false },
    { name: 'male_fat', minValue: 42, maxValue: 45, rangeId: 11, inverse: false },
    { name: 'male_fat', minValue: 45, maxValue: 48, rangeId: 12, inverse: false },
    { name: 'male_fat', minValue: 48, maxValue: 51, rangeId: 13, inverse: false },
    { name: 'male_fat', minValue: 51, maxValue: 54, rangeId: 14, inverse: false },

    // --- % Grasa Femenino (Normal) ---
    { name: 'female_fat', minValue: 18, maxValue: 22, rangeId: 1, inverse: false },
    { name: 'female_fat', minValue: 22, maxValue: 26, rangeId: 2, inverse: false },
    { name: 'female_fat', minValue: 26, maxValue: 29, rangeId: 3, inverse: false },
    { name: 'female_fat', minValue: 29, maxValue: 32, rangeId: 4, inverse: false },
    { name: 'female_fat', minValue: 32, maxValue: 35, rangeId: 5, inverse: false }, // Ejemplo: 34.5 -> 55 años
    { name: 'female_fat', minValue: 35, maxValue: 38, rangeId: 6, inverse: false },
    { name: 'female_fat', minValue: 38, maxValue: 41, rangeId: 7, inverse: false },
    { name: 'female_fat', minValue: 41, maxValue: 44, rangeId: 8, inverse: false },
    { name: 'female_fat', minValue: 44, maxValue: 47, rangeId: 9, inverse: false },
    { name: 'female_fat', minValue: 47, maxValue: 50, rangeId: 10, inverse: false },
    { name: 'female_fat', minValue: 50, maxValue: 53, rangeId: 11, inverse: false },
    { name: 'female_fat', minValue: 53, maxValue: 56, rangeId: 12, inverse: false },
    { name: 'female_fat', minValue: 56, maxValue: 59, rangeId: 13, inverse: false },
    { name: 'female_fat', minValue: 59, maxValue: 62, rangeId: 14, inverse: false },

    // --- % Grasa Masculino (Deportivo) ---
    { name: 'male_fat_athlete', minValue: 1, maxValue: 7, rangeId: 1, inverse: false },
    { name: 'male_fat_athlete', minValue: 7, maxValue: 14, rangeId: 2, inverse: false },
    { name: 'male_fat_athlete', minValue: 14, maxValue: 17, rangeId: 3, inverse: false },
    { name: 'male_fat_athlete', minValue: 17, maxValue: 21, rangeId: 4, inverse: false },
    { name: 'male_fat_athlete', minValue: 21, maxValue: 25, rangeId: 5, inverse: false },
    { name: 'male_fat_athlete', minValue: 25, maxValue: 28, rangeId: 6, inverse: false },
    { name: 'male_fat_athlete', minValue: 28, maxValue: 31, rangeId: 7, inverse: false },
    { name: 'male_fat_athlete', minValue: 31, maxValue: 34, rangeId: 8, inverse: false },
    { name: 'male_fat_athlete', minValue: 34, maxValue: 37, rangeId: 9, inverse: false },
    { name: 'male_fat_athlete', minValue: 37, maxValue: 40, rangeId: 10, inverse: false },
    { name: 'male_fat_athlete', minValue: 40, maxValue: 43, rangeId: 11, inverse: false },
    { name: 'male_fat_athlete', minValue: 43, maxValue: 46, rangeId: 12, inverse: false },
    { name: 'male_fat_athlete', minValue: 46, maxValue: 49, rangeId: 13, inverse: false },
    { name: 'male_fat_athlete', minValue: 49, maxValue: 52, rangeId: 14, inverse: false },

    // --- % Grasa Femenino (Deportivo) ---
    { name: 'female_fat_athlete', minValue: 1, maxValue: 9, rangeId: 1, inverse: false },
    { name: 'female_fat_athlete', minValue: 9, maxValue: 18, rangeId: 2, inverse: false },
    { name: 'female_fat_athlete', minValue: 18, maxValue: 22, rangeId: 3, inverse: false },
    { name: 'female_fat_athlete', minValue: 22, maxValue: 25, rangeId: 4, inverse: false },
    { name: 'female_fat_athlete', minValue: 25, maxValue: 27, rangeId: 5, inverse: false },
    { name: 'female_fat_athlete', minValue: 27, maxValue: 30, rangeId: 6, inverse: false },
    { name: 'female_fat_athlete', minValue: 30, maxValue: 33, rangeId: 7, inverse: false },
    { name: 'female_fat_athlete', minValue: 33, maxValue: 36, rangeId: 8, inverse: false },
    { name: 'female_fat_athlete', minValue: 36, maxValue: 39, rangeId: 9, inverse: false },
    { name: 'female_fat_athlete', minValue: 39, maxValue: 42, rangeId: 10, inverse: false },
    { name: 'female_fat_athlete', minValue: 42, maxValue: 45, rangeId: 11, inverse: false },
    { name: 'female_fat_athlete', minValue: 45, maxValue: 48, rangeId: 12, inverse: false },
    { name: 'female_fat_athlete', minValue: 48, maxValue: 51, rangeId: 13, inverse: false },
    { name: 'female_fat_athlete', minValue: 51, maxValue: 54, rangeId: 14, inverse: false },

    // --- Índice de Masa Corporal (Universal) ---
    { name: 'body_mass', minValue: 18, maxValue: 22, rangeId: 1, inverse: false },
    { name: 'body_mass', minValue: 22, maxValue: 25, rangeId: 2, inverse: false }, // Ejemplo: 23.1 -> 31 años
    { name: 'body_mass', minValue: 25, maxValue: 27, rangeId: 3, inverse: false },
    { name: 'body_mass', minValue: 27, maxValue: 30, rangeId: 4, inverse: false },
    { name: 'body_mass', minValue: 30, maxValue: 33, rangeId: 5, inverse: false },
    { name: 'body_mass', minValue: 33, maxValue: 36, rangeId: 6, inverse: false },
    { name: 'body_mass', minValue: 36, maxValue: 39, rangeId: 7, inverse: false },
    { name: 'body_mass', minValue: 39, maxValue: 42, rangeId: 8, inverse: false },
    { name: 'body_mass', minValue: 42, maxValue: 45, rangeId: 9, inverse: false },
    { name: 'body_mass', minValue: 45, maxValue: 48, rangeId: 10, inverse: false },
    { name: 'body_mass', minValue: 48, maxValue: 51, rangeId: 11, inverse: false },
    { name: 'body_mass', minValue: 51, maxValue: 54, rangeId: 12, inverse: false },
    { name: 'body_mass', minValue: 54, maxValue: 57, rangeId: 13, inverse: false },
    { name: 'body_mass', minValue: 57, maxValue: 60, rangeId: 14, inverse: false },

    // --- Reflejos Digitales (Universal, Inverso) ---
    { name: 'digital_reflections', minValue: 50, maxValue: 45, rangeId: 1, inverse: true },
    { name: 'digital_reflections', minValue: 45, maxValue: 35, rangeId: 2, inverse: true },
    { name: 'digital_reflections', minValue: 35, maxValue: 30, rangeId: 3, inverse: true },
    { name: 'digital_reflections', minValue: 30, maxValue: 25, rangeId: 4, inverse: true },
    { name: 'digital_reflections', minValue: 25, maxValue: 20, rangeId: 5, inverse: true },
    { name: 'digital_reflections', minValue: 20, maxValue: 15, rangeId: 6, inverse: true },
    { name: 'digital_reflections', minValue: 15, maxValue: 10, rangeId: 7, inverse: true },
    { name: 'digital_reflections', minValue: 10, maxValue: 8, rangeId: 8, inverse: true },
    { name: 'digital_reflections', minValue: 8, maxValue: 6, rangeId: 9, inverse: true },
    { name: 'digital_reflections', minValue: 6, maxValue: 4, rangeId: 10, inverse: true },
    { name: 'digital_reflections', minValue: 4, maxValue: 3, rangeId: 11, inverse: true }, // Ejemplo: 3 -> 98 años
    { name: 'digital_reflections', minValue: 3, maxValue: 2, rangeId: 12, inverse: true },
    { name: 'digital_reflections', minValue: 2, maxValue: 1, rangeId: 13, inverse: true },
    { name: 'digital_reflections', minValue: 1, maxValue: 0, rangeId: 14, inverse: true },
    
    // --- Acomodación Visual (Universal, Inverso) ---
    { name: 'visual_accommodation', minValue: 0, maxValue: 10, rangeId: 1, inverse: true },
    { name: 'visual_accommodation', minValue: 10, maxValue: 15, rangeId: 2, inverse: true },
    { name: 'visual_accommodation', minValue: 15, maxValue: 18, rangeId: 3, inverse: true },
    { name: 'visual_accommodation', minValue: 18, maxValue: 21, rangeId: 4, inverse: true },
    { name: 'visual_accommodation', minValue: 21, maxValue: 24, rangeId: 5, inverse: true },
    { name: 'visual_accommodation', minValue: 24, maxValue: 27, rangeId: 6, inverse: true },
    { name: 'visual_accommodation', minValue: 27, maxValue: 30, rangeId: 7, inverse: true },
    { name: 'visual_accommodation', minValue: 30, maxValue: 33, rangeId: 8, inverse: true },
    { name: 'visual_accommodation', minValue: 33, maxValue: 37, rangeId: 9, inverse: true }, // Ejemplo: 35 -> 81 años
    { name: 'visual_accommodation', minValue: 37, maxValue: 40, rangeId: 10, inverse: true },
    { name: 'visual_accommodation', minValue: 40, maxValue: 43, rangeId: 11, inverse: true },
    { name: 'visual_accommodation', minValue: 43, maxValue: 47, rangeId: 12, inverse: true },
    { name: 'visual_accommodation', minValue: 47, maxValue: 50, rangeId: 13, inverse: true },
    { name: 'visual_accommodation', minValue: 50, maxValue: 53, rangeId: 14, inverse: true },

    // --- Balance Estático (Universal, Inverso) ---
    { name: 'static_balance', minValue: 120, maxValue: 30, rangeId: 1, inverse: true },
    { name: 'static_balance', minValue: 30, maxValue: 25, rangeId: 2, inverse: true },
    { name: 'static_balance', minValue: 25, maxValue: 20, rangeId: 3, inverse: true },
    { name: 'static_balance', minValue: 20, maxValue: 15, rangeId: 4, inverse: true },
    { name: 'static_balance', minValue: 15, maxValue: 12, rangeId: 5, inverse: true },
    { name: 'static_balance', minValue: 12, maxValue: 9, rangeId: 6, inverse: true },
    { name: 'static_balance', minValue: 9, maxValue: 7, rangeId: 7, inverse: true },
    { name: 'static_balance', minValue: 7, maxValue: 6, rangeId: 8, inverse: true },
    { name: 'static_balance', minValue: 6, maxValue: 5, rangeId: 9, inverse: true },
    { name: 'static_balance', minValue: 5, maxValue: 4, rangeId: 10, inverse: true },
    { name: 'static_balance', minValue: 4, maxValue: 3, rangeId: 11, inverse: true },
    { name: 'static_balance', minValue: 3, maxValue: 2, rangeId: 12, inverse: true },
    { name: 'static_balance', minValue: 2, maxValue: 1, rangeId: 13, inverse: true }, // Ejemplo: 1 -> 112 años
    { name: 'static_balance', minValue: 1, maxValue: 0, rangeId: 14, inverse: true },

    // --- Hidratación Cutánea (Universal) ---
    { name: 'quaten_hydration', minValue: 0, maxValue: 1, rangeId: 1, inverse: false },
    { name: 'quaten_hydration', minValue: 1, maxValue: 2, rangeId: 2, inverse: false },
    { name: 'quaten_hydration', minValue: 2, maxValue: 4, rangeId: 3, inverse: false },
    { name: 'quaten_hydration', minValue: 4, maxValue: 8, rangeId: 4, inverse: false },
    { name: 'quaten_hydration', minValue: 8, maxValue: 16, rangeId: 5, inverse: false },
    { name: 'quaten_hydration', minValue: 16, maxValue: 32, rangeId: 6, inverse: false }, // Ejemplo: 120 -> 120 años
    { name: 'quaten_hydration', minValue: 32, maxValue: 64, rangeId: 7, inverse: false },
    { name: 'quaten_hydration', minValue: 64, maxValue: 74, rangeId: 8, inverse: false },
    { name: 'quaten_hydration', minValue: 74, maxValue: 84, rangeId: 9, inverse: false },
    { name: 'quaten_hydration', minValue: 84, maxValue: 94, rangeId: 10, inverse: false },
    { name: 'quaten_hydration', minValue: 94, maxValue: 104, rangeId: 11, inverse: false },
    { name: 'quaten_hydration', minValue: 104, maxValue: 108, rangeId: 12, inverse: false },
    { name: 'quaten_hydration', minValue: 108, maxValue: 112, rangeId: 13, inverse: false },
    { name: 'quaten_hydration', minValue: 112, maxValue: 120, rangeId: 14, inverse: false },

    // --- Tensión Arterial Sistólica (Universal) ---
    { name: 'systolic_blood_pressure', minValue: 100, maxValue: 110, rangeId: 1, inverse: false },
    { name: 'systolic_blood_pressure', minValue: 110, maxValue: 120, rangeId: 2, inverse: false },
    { name: 'systolic_blood_pressure', minValue: 120, maxValue: 130, rangeId: 3, inverse: false },
    { name: 'systolic_blood_pressure', minValue: 130, maxValue: 140, rangeId: 4, inverse: false },
    { name: 'systolic_blood_pressure', minValue: 140, maxValue: 150, rangeId: 5, inverse: false },
    { name: 'systolic_blood_pressure', minValue: 150, maxValue: 160, rangeId: 6, inverse: false }, // Ejemplo: 152 -> 58 años
    { name: 'systolic_blood_pressure', minValue: 160, maxValue: 170, rangeId: 7, inverse: false },
    { name: 'systolic_blood_pressure', minValue: 170, maxValue: 180, rangeId: 8, inverse: false },
    { name: 'systolic_blood_pressure', minValue: 180, maxValue: 190, rangeId: 9, inverse: false },
    { name: 'systolic_blood_pressure', minValue: 190, maxValue: 200, rangeId: 10, inverse: false },
    { name: 'systolic_blood_pressure', minValue: 200, maxValue: 210, rangeId: 11, inverse: false },
    { name: 'systolic_blood_pressure', minValue: 210, maxValue: 220, rangeId: 12, inverse: false },
    { name: 'systolic_blood_pressure', minValue: 220, maxValue: 230, rangeId: 13, inverse: false },
    { name: 'systolic_blood_pressure', minValue: 230, maxValue: 240, rangeId: 14, inverse: false },

    // --- Tensión Arterial Diastólica (Universal) ---
    { name: 'diastolic_blood_pressure', minValue: 60, maxValue: 65, rangeId: 1, inverse: false },
    { name: 'diastolic_blood_pressure', minValue: 65, maxValue: 70, rangeId: 2, inverse: false },
    { name: 'diastolic_blood_pressure', minValue: 70, maxValue: 75, rangeId: 3, inverse: false },
    { name: 'diastolic_blood_pressure', minValue: 75, maxValue: 80, rangeId: 4, inverse: false }, // Ejemplo: 80 -> 49 años
    { name: 'diastolic_blood_pressure', minValue: 80, maxValue: 85, rangeId: 5, inverse: false },
    { name: 'diastolic_blood_pressure', minValue: 85, maxValue: 90, rangeId: 6, inverse: false },
    { name: 'diastolic_blood_pressure', minValue: 90, maxValue: 95, rangeId: 7, inverse: false },
    { name: 'diastolic_blood_pressure', minValue: 95, maxValue: 100, rangeId: 8, inverse: false },
    { name: 'diastolic_blood_pressure', minValue: 100, maxValue: 110, rangeId: 9, inverse: false },
    { name: 'diastolic_blood_pressure', minValue: 110, maxValue: 120, rangeId: 10, inverse: false },
    { name: 'diastolic_blood_pressure', minValue: 120, maxValue: 130, rangeId: 11, inverse: false },
    { name: 'diastolic_blood_pressure', minValue: 130, maxValue: 140, rangeId: 12, inverse: false },
    { name: 'diastolic_blood_pressure', minValue: 140, maxValue: 150, rangeId: 13, inverse: false },
    { name: 'diastolic_blood_pressure', minValue: 150, maxValue: 160, rangeId: 14, inverse: false },
  ];

  // Añadir un `type` a cada board para cumplir con el schema
  const boardsToCreate = boardsData.map(board => ({
    ...board,
    type: 'FORM_BIOPHYSICS' // Asignar el tipo requerido por el schema
  }));

  await prisma.board.createMany({ data: boardsToCreate });
  console.log('📏 Baremos (boards) creados/actualizados.');
  
  // --- 4. Crear usuario admin si no existe ---
  const adminEmail = 'admin@doctorantivejez.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const hashedPassword = await require('bcryptjs').hash('admin123', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Dr. Admin',
        role: 'ADMINISTRATIVO',
      },
    });
    console.log('👤 Usuario administrador creado.');
  } else {
    console.log('👤 Usuario administrador ya existe.');
  }

  console.log('✅ Seeding completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
