// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@doctorantivejez.com' },
    update: {},
    create: {
      email: 'admin@doctorantivejez.com',
      password: hashedPassword,
      name: 'Dr. Admin',
      role: 'MEDICO',
    },
  });
  console.log(`✅ Usuario admin creado o actualizado con ID: ${adminUser.id}`);

  const ageRanges = [
    { id: 1, minAge: 21, maxAge: 28 }, { id: 2, minAge: 28, maxAge: 35 },
    { id: 3, minAge: 35, maxAge: 42 }, { id: 4, minAge: 42, maxAge: 49 },
    { id: 5, minAge: 49, maxAge: 56 }, { id: 6, minAge: 56, maxAge: 63 },
    { id: 7, minAge: 63, maxAge: 70 }, { id: 8, minAge: 70, maxAge: 77 },
    { id: 9, minAge: 77, maxAge: 84 }, { id: 10, minAge: 84, maxAge: 91 },
    { id: 11, minAge: 91, maxAge: 98 }, { id: 12, minAge: 98, maxAge: 105 },
    { id: 13, minAge: 105, maxAge: 112 }, { id: 14, minAge: 112, maxAge: 120 },
  ];

  for (const range of ageRanges) {
    await prisma.range.upsert({
      where: { id: range.id },
      update: { minAge: range.minAge, maxAge: range.maxAge },
      create: range,
    });
  }
  console.log('✅ Rangos de edad creados o actualizados.');

  / Datos de baremos biofísicos
  const biophysicsBoards = [
    // % Grasa Masculino
    { rangeId: 1, name: 'male_fat', minValue: 10, maxValue: 14 },
    { rangeId: 2, name: 'male_fat', minValue: 14, maxValue: 18 },
    { rangeId: 3, name: 'male_fat', minValue: 18, maxValue: 21 },
    { rangeId: 4, name: 'male_fat', minValue: 21, maxValue: 24 },
    { rangeId: 5, name: 'male_fat', minValue: 24, maxValue: 27 },
    { rangeId: 6, name: 'male_fat', minValue: 27, maxValue: 30 },
    { rangeId: 7, name: 'male_fat', minValue: 30, maxValue: 33 },
    { rangeId: 8, name: 'male_fat', minValue: 33, maxValue: 36 },
    { rangeId: 9, name: 'male_fat', minValue: 36, maxValue: 39 },
    { rangeId: 10, name: 'male_fat', minValue: 39, maxValue: 42 },
    { rangeId: 11, name: 'male_fat', minValue: 42, maxValue: 45 },
    { rangeId: 12, name: 'male_fat', minValue: 45, maxValue: 48 },
    { rangeId: 13, name: 'male_fat', minValue: 48, maxValue: 51 },
    { rangeId: 14, name: 'male_fat', minValue: 51, maxValue: 54 },
    // Con inverse para valores bajos
    { rangeId: 1, name: 'male_fat', minValue: 7, maxValue: 9.99, inverse: true },
    { rangeId: 2, name: 'male_fat', minValue: 6, maxValue: 7, inverse: true },
    { rangeId: 3, name: 'male_fat', minValue: 5, maxValue: 6, inverse: true },
    { rangeId: 4, name: 'male_fat', minValue: 4, maxValue: 5, inverse: true },
    { rangeId: 5, name: 'male_fat', minValue: 3, maxValue: 4, inverse: true },
    { rangeId: 6, name: 'male_fat', minValue: 2, maxValue: 3, inverse: true },
    { rangeId: 7, name: 'male_fat', minValue: 1, maxValue: 2, inverse: true },
    { rangeId: 8, name: 'male_fat', minValue: 0, maxValue: 1, inverse: true },

    // % Grasa Masculino Deportivo
    { rangeId: 1, name: 'sporty_male_fat', minValue: 1, maxValue: 7 },
    { rangeId: 2, name: 'sporty_male_fat', minValue: 7, maxValue: 14 },
    { rangeId: 3, name: 'sporty_male_fat', minValue: 14, maxValue: 17 },
    { rangeId: 4, name: 'sporty_male_fat', minValue: 17, maxValue: 21 },
    { rangeId: 5, name: 'sporty_male_fat', minValue: 21, maxValue: 25 },
    { rangeId: 6, name: 'sporty_male_fat', minValue: 25, maxValue: 28 },
    { rangeId: 7, name: 'sporty_male_fat', minValue: 28, maxValue: 31 },
    { rangeId: 8, name: 'sporty_male_fat', minValue: 31, maxValue: 34 },
    { rangeId: 9, name: 'sporty_male_fat', minValue: 34, maxValue: 37 },
    { rangeId: 10, name: 'sporty_male_fat', minValue: 37, maxValue: 40 },
    { rangeId: 11, name: 'sporty_male_fat', minValue: 40, maxValue: 43 },
    { rangeId: 12, name: 'sporty_male_fat', minValue: 43, maxValue: 46 },
    { rangeId: 13, name: 'sporty_male_fat', minValue: 46, maxValue: 49 },
    { rangeId: 14, name: 'sporty_male_fat', minValue: 49, maxValue: 52 },

    // % Grasa Femenino
    { rangeId: 1, name: 'female_fat', minValue: 18, maxValue: 22 },
    { rangeId: 2, name: 'female_fat', minValue: 22, maxValue: 26 },
    { rangeId: 3, name: 'female_fat', minValue: 26, maxValue: 29 },
    { rangeId: 4, name: 'female_fat', minValue: 29, maxValue: 32 },
    { rangeId: 5, name: 'female_fat', minValue: 32, maxValue: 35 },
    { rangeId: 6, name: 'female_fat', minValue: 35, maxValue: 38 },
    { rangeId: 7, name: 'female_fat', minValue: 38, maxValue: 41 },
    { rangeId: 8, name: 'female_fat', minValue: 41, maxValue: 44 },
    { rangeId: 9, name: 'female_fat', minValue: 44, maxValue: 47 },
    { rangeId: 10, name: 'female_fat', minValue: 47, maxValue: 50 },
    { rangeId: 11, name: 'female_fat', minValue: 50, maxValue: 53 },
    { rangeId: 12, name: 'female_fat', minValue: 53, maxValue: 56 },
    { rangeId: 13, name: 'female_fat', minValue: 56, maxValue: 59 },
    { rangeId: 14, name: 'female_fat', minValue: 59, maxValue: 62 },
    // Con inverse para valores bajos
    { rangeId: 1, name: 'female_fat', minValue: 15, maxValue: 17.99, inverse: true },
    { rangeId: 2, name: 'female_fat', minValue: 14, maxValue: 15, inverse: true },
    { rangeId: 3, name: 'female_fat', minValue: 13, maxValue: 14, inverse: true },
    { rangeId: 4, name: 'female_fat', minValue: 12, maxValue: 13, inverse: true },
    { rangeId: 5, name: 'female_fat', minValue: 11, maxValue: 12, inverse: true },
    { rangeId: 6, name: 'female_fat', minValue: 10, maxValue: 11, inverse: true },
    { rangeId: 7, name: 'female_fat', minValue: 9, maxValue: 10, inverse: true },
    { rangeId: 8, name: 'female_fat', minValue: 8, maxValue: 9, inverse: true },

    // % Grasa Femenino Deportivo
    { rangeId: 1, name: 'sporty_female_fat', minValue: 1, maxValue: 9 },
    { rangeId: 2, name: 'sporty_female_fat', minValue: 9, maxValue: 18 },
    { rangeId: 3, name: 'sporty_female_fat', minValue: 18, maxValue: 22 },
    { rangeId: 4, name: 'sporty_female_fat', minValue: 22, maxValue: 25 },
    { rangeId: 5, name: 'sporty_female_fat', minValue: 25, maxValue: 27 },
    { rangeId: 6, name: 'sporty_female_fat', minValue: 27, maxValue: 30 },
    { rangeId: 7, name: 'sporty_female_fat', minValue: 30, maxValue: 33 },
    { rangeId: 8, name: 'sporty_female_fat', minValue: 33, maxValue: 36 },
    { rangeId: 9, name: 'sporty_female_fat', minValue: 36, maxValue: 39 },
    { rangeId: 10, name: 'sporty_female_fat', minValue: 39, maxValue: 42 },
    { rangeId: 11, name: 'sporty_female_fat', minValue: 42, maxValue: 45 },
    { rangeId: 12, name: 'sporty_female_fat', minValue: 45, maxValue: 48 },
    { rangeId: 13, name: 'sporty_female_fat', minValue: 48, maxValue: 51 },
    { rangeId: 14, name: 'sporty_female_fat', minValue: 51, maxValue: 54 },

    // IMC (Índice de Masa Corporal)
    { rangeId: 1, name: 'body_mass', minValue: 18, maxValue: 22 },
    { rangeId: 2, name: 'body_mass', minValue: 22, maxValue: 25 },
    { rangeId: 3, name: 'body_mass', minValue: 25, maxValue: 27 },
    { rangeId: 4, name: 'body_mass', minValue: 27, maxValue: 30 },
    { rangeId: 5, name: 'body_mass', minValue: 30, maxValue: 33 },
    { rangeId: 6, name: 'body_mass', minValue: 33, maxValue: 36 },
    { rangeId: 7, name: 'body_mass', minValue: 36, maxValue: 39 },
    { rangeId: 8, name: 'body_mass', minValue: 39, maxValue: 42 },
    { rangeId: 9, name: 'body_mass', minValue: 42, maxValue: 45 },
    { rangeId: 10, name: 'body_mass', minValue: 45, maxValue: 48 },
    { rangeId: 11, name: 'body_mass', minValue: 48, maxValue: 51 },
    { rangeId: 12, name: 'body_mass', minValue: 51, maxValue: 54 },
    { rangeId: 13, name: 'body_mass', minValue: 54, maxValue: 57 },
    { rangeId: 14, name: 'body_mass', minValue: 57, maxValue: 60 },
    // Con inverse para valores bajos
    { rangeId: 1, name: 'body_mass', minValue: 16, maxValue: 17.99, inverse: true },
    { rangeId: 2, name: 'body_mass', minValue: 15, maxValue: 16, inverse: true },
    { rangeId: 3, name: 'body_mass', minValue: 14, maxValue: 15, inverse: true },
    { rangeId: 4, name: 'body_mass', minValue: 13, maxValue: 14, inverse: true },
    { rangeId: 5, name: 'body_mass', minValue: 12, maxValue: 13, inverse: true },
    { rangeId: 6, name: 'body_mass', minValue: 11, maxValue: 12, inverse: true },
    { rangeId: 7, name: 'body_mass', minValue: 10, maxValue: 11, inverse: true },
    { rangeId: 8, name: 'body_mass', minValue: 9, maxValue: 10, inverse: true },

    // Reflejos Digitales
    { rangeId: 1, name: 'digital_reflections', minValue: 45, maxValue: 50 },
    { rangeId: 2, name: 'digital_reflections', minValue: 35, maxValue: 45 },
    { rangeId: 3, name: 'digital_reflections', minValue: 30, maxValue: 35 },
    { rangeId: 4, name: 'digital_reflections', minValue: 25, maxValue: 30 },
    { rangeId: 5, name: 'digital_reflections', minValue: 20, maxValue: 25 },
    { rangeId: 6, name: 'digital_reflections', minValue: 15, maxValue: 20 },
    { rangeId: 7, name: 'digital_reflections', minValue: 10, maxValue: 15 },
    { rangeId: 8, name: 'digital_reflections', minValue: 8, maxValue: 10 },
    { rangeId: 9, name: 'digital_reflections', minValue: 6, maxValue: 8 },
    { rangeId: 10, name: 'digital_reflections', minValue: 4, maxValue: 6 },
    { rangeId: 11, name: 'digital_reflections', minValue: 3, maxValue: 4 },
    { rangeId: 12, name: 'digital_reflections', minValue: 2, maxValue: 3 },
    { rangeId: 13, name: 'digital_reflections', minValue: 1, maxValue: 2 },
    { rangeId: 14, name: 'digital_reflections', minValue: 0, maxValue: 1 },

    // Acomodación Visual
    { rangeId: 1, name: 'visual_accommodation', minValue: 0, maxValue: 10 },
    { rangeId: 2, name: 'visual_accommodation', minValue: 10, maxValue: 15 },
    { rangeId: 3, name: 'visual_accommodation', minValue: 15, maxValue: 18 },
    { rangeId: 4, name: 'visual_accommodation', minValue: 18, maxValue: 21 },
    { rangeId: 5, name: 'visual_accommodation', minValue: 21, maxValue: 24 },
    { rangeId: 6, name: 'visual_accommodation', minValue: 24, maxValue: 27 },
    { rangeId: 7, name: 'visual_accommodation', minValue: 27, maxValue: 30 },
    { rangeId: 8, name: 'visual_accommodation', minValue: 30, maxValue: 33 },
    { rangeId: 9, name: 'visual_accommodation', minValue: 33, maxValue: 37 },
    { rangeId: 10, name: 'visual_accommodation', minValue: 37, maxValue: 40 },
    { rangeId: 11, name: 'visual_accommodation', minValue: 40, maxValue: 43 },
    { rangeId: 12, name: 'visual_accommodation', minValue: 43, maxValue: 47 },
    { rangeId: 13, name: 'visual_accommodation', minValue: 47, maxValue: 50 },
    { rangeId: 14, name: 'visual_accommodation', minValue: 50, maxValue: 53 },

    // Balance Estático
    { rangeId: 1, name: 'static_balance', minValue: 64, maxValue: 120 },
    { rangeId: 2, name: 'static_balance', minValue: 32, maxValue: 64 },
    { rangeId: 3, name: 'static_balance', minValue: 16, maxValue: 32 },
    { rangeId: 4, name: 'static_balance', minValue: 8, maxValue: 16 },
    { rangeId: 5, name: 'static_balance', minValue: 4, maxValue: 8 },
    { rangeId: 6, name: 'static_balance', minValue: 2, maxValue: 4 },
    { rangeId: 7, name: 'static_balance', minValue: 1, maxValue: 2 },
    { rangeId: 8, name: 'static_balance', minValue: 0, maxValue: 1 },

    // Hidratación Cutánea
    { rangeId: 1, name: 'quaten_hydration', minValue: 0, maxValue: 1 },
    { rangeId: 2, name: 'quaten_hydration', minValue: 1, maxValue: 2 },
    { rangeId: 3, name: 'quaten_hydration', minValue: 2, maxValue: 4 },
    { rangeId: 4, name: 'quaten_hydration', minValue: 4, maxValue: 8 },
    { rangeId: 5, name: 'quaten_hydration', minValue: 8, maxValue: 16 },
    { rangeId: 6, name: 'quaten_hydration', minValue: 16, maxValue: 32 },
    { rangeId: 7, name: 'quaten_hydration', minValue: 32, maxValue: 64 },
    { rangeId: 8, name: 'quaten_hydration', minValue: 64, maxValue: 74 },
    { rangeId: 9, name: 'quaten_hydration', minValue: 74, maxValue: 84 },
    { rangeId: 10, name: 'quaten_hydration', minValue: 84, maxValue: 94 },
    { rangeId: 11, name: 'quaten_hydration', minValue: 94, maxValue: 104 },
    { rangeId: 12, name: 'quaten_hydration', minValue: 104, maxValue: 108 },
    { rangeId: 13, name: 'quaten_hydration', minValue: 108, maxValue: 112 },
    { rangeId: 14, name: 'quaten_hydration', minValue: 112, maxValue: 120 },

    // Tensión Arterial Sistólica
    { rangeId: 1, name: 'systolic_blood_pressure', minValue: 100, maxValue: 110 },
    { rangeId: 2, name: 'systolic_blood_pressure', minValue: 110, maxValue: 120 },
    { rangeId: 3, name: 'systolic_blood_pressure', minValue: 120, maxValue: 130 },
    { rangeId: 4, name: 'systolic_blood_pressure', minValue: 130, maxValue: 140 },
    { rangeId: 5, name: 'systolic_blood_pressure', minValue: 140, maxValue: 150 },
    { rangeId: 6, name: 'systolic_blood_pressure', minValue: 150, maxValue: 160 },
    { rangeId: 7, name: 'systolic_blood_pressure', minValue: 160, maxValue: 170 },
    { rangeId: 8, name: 'systolic_blood_pressure', minValue: 170, maxValue: 180 },
    { rangeId: 9, name: 'systolic_blood_pressure', minValue: 180, maxValue: 190 },
    { rangeId: 10, name: 'systolic_blood_pressure', minValue: 190, maxValue: 200 },
    { rangeId: 11, name: 'systolic_blood_pressure', minValue: 200, maxValue: 210 },
    { rangeId: 12, name: 'systolic_blood_pressure', minValue: 210, maxValue: 220 },
    { rangeId: 13, name: 'systolic_blood_pressure', minValue: 220, maxValue: 230 },
    { rangeId: 14, name: 'systolic_blood_pressure', minValue: 230, maxValue: 240 },
    // Con inverse para valores bajos
    { rangeId: 1, name: 'systolic_blood_pressure', minValue: 95, maxValue: 99.99, inverse: true },
    { rangeId: 2, name: 'systolic_blood_pressure', minValue: 90, maxValue: 95, inverse: true },
    { rangeId: 3, name: 'systolic_blood_pressure', minValue: 85, maxValue: 90, inverse: true },
    { rangeId: 4, name: 'systolic_blood_pressure', minValue: 80, maxValue: 85, inverse: true },
    { rangeId: 5, name: 'systolic_blood_pressure', minValue: 75, maxValue: 80, inverse: true },
    { rangeId: 6, name: 'systolic_blood_pressure', minValue: 70, maxValue: 75, inverse: true },
    { rangeId: 7, name: 'systolic_blood_pressure', minValue: 65, maxValue: 70, inverse: true },
    { rangeId: 8, name: 'systolic_blood_pressure', minValue: 60, maxValue: 65, inverse: true },
    { rangeId: 9, name: 'systolic_blood_pressure', minValue: 55, maxValue: 60, inverse: true },
    { rangeId: 10, name: 'systolic_blood_pressure', minValue: 50, maxValue: 55, inverse: true },
    { rangeId: 11, name: 'systolic_blood_pressure', minValue: 45, maxValue: 50, inverse: true },
    { rangeId: 12, name: 'systolic_blood_pressure', minValue: 40, maxValue: 45, inverse: true },

    // Tensión Arterial Diastólica
    { rangeId: 1, name: 'diastolic_blood_pressure', minValue: 60, maxValue: 65 },
    { rangeId: 2, name: 'diastolic_blood_pressure', minValue: 65, maxValue: 70 },
    { rangeId: 3, name: 'diastolic_blood_pressure', minValue: 70, maxValue: 75 },
    { rangeId: 4, name: 'diastolic_blood_pressure', minValue: 75, maxValue: 80 },
    { rangeId: 5, name: 'diastolic_blood_pressure', minValue: 80, maxValue: 85 },
    { rangeId: 6, name: 'diastolic_blood_pressure', minValue: 85, maxValue: 90 },
    { rangeId: 7, name: 'diastolic_blood_pressure', minValue: 90, maxValue: 95 },
    { rangeId: 8, name: 'diastolic_blood_pressure', minValue: 95, maxValue: 100 },
    { rangeId: 9, name: 'diastolic_blood_pressure', minValue: 100, maxValue: 110 },
    { rangeId: 10, name: 'diastolic_blood_pressure', minValue: 110, maxValue: 120 },
    { rangeId: 11, name: 'diastolic_blood_pressure', minValue: 120, maxValue: 130 },
    { rangeId: 12, name: 'diastolic_blood_pressure', minValue: 130, maxValue: 140 },
    { rangeId: 13, name: 'diastolic_blood_pressure', minValue: 140, maxValue: 150 },
    { rangeId: 14, name: 'diastolic_blood_pressure', minValue: 150, maxValue: 160 },
    // Con inverse para valores bajos
    { rangeId: 1, name: 'diastolic_blood_pressure', minValue: 57, maxValue: 59.99, inverse: true },
    { rangeId: 2, name: 'diastolic_blood_pressure', minValue: 53, maxValue: 57, inverse: true },
    { rangeId: 3, name: 'diastolic_blood_pressure', minValue: 50, maxValue: 53, inverse: true },
    { rangeId: 4, name: 'diastolic_blood_pressure', minValue: 47, maxValue: 50, inverse: true },
    { rangeId: 5, name: 'diastolic_blood_pressure', minValue: 44, maxValue: 47, inverse: true },
    { rangeId: 6, name: 'diastolic_blood_pressure', minValue: 41, maxValue: 44, inverse: true },
    { rangeId: 7, name: 'diastolic_blood_pressure', minValue: 38, maxValue: 41, inverse: true },
    { rangeId: 8, name: 'diastolic_blood_pressure', minValue: 35, maxValue: 38, inverse: true },
  ];

  console.log('🎉 Seed completado exitosamente');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });