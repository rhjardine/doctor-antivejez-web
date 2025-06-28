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

  // Aquí irían los datos de los baremos (biophysicsBoards)...
  // Por brevedad, se omite el array largo, pero la lógica sería la misma.
  // Puedes copiar el array 'biophysicsBoards' de tu seed.ts aquí.
  // Y luego iterar sobre él con prisma.board.create(...)

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