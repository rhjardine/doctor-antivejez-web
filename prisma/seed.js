// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seeding de la base de datos...');

  // --- 1. Limpiar datos antiguos de Baremos y Rangos ---
  await prisma.board.deleteMany({});
  await prisma.range.deleteMany({});
  console.log('🗑️ Baremos y Rangos antiguos eliminados.');

  // --- 2. Crear Rangos de Edad ---
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
  console.log('📊 Rangos de edad creados.');

  // --- 3. Crear Baremos (Boards) ---
  const biophysicsBoards = [
    // % Grasa Masculino
    ...Array(14).fill(0).map((_, i) => ({ name: 'male_fat', minValue: 10 + i * 3, maxValue: 14 + i * 3, rangeId: i + 1, inverse: false, type: 'FORM_BIOPHYSICS' as const })),
    // % Grasa Femenino
    ...Array(14).fill(0).map((_, i) => ({ name: 'female_fat', minValue: 18 + i * 3, maxValue: 22 + i * 3, rangeId: i + 1, inverse: false, type: 'FORM_BIOPHYSICS' as const })),
    // IMC
    ...Array(14).fill(0).map((_, i) => ({ name: 'body_mass', minValue: 18 + i * 3, maxValue: 22 + i * 3, rangeId: i + 1, inverse: false, type: 'FORM_BIOPHYSICS' as const })),
    // Reflejos Digitales
    { name: 'digital_reflections', minValue: 45, maxValue: 50, rangeId: 1, inverse: true, type: 'FORM_BIOPHYSICS' as const },
    { name: 'digital_reflections', minValue: 35, maxValue: 45, rangeId: 2, inverse: true, type: 'FORM_BIOPHYSICS' as const },
    { name: 'digital_reflections', minValue: 30, maxValue: 35, rangeId: 3, inverse: true, type: 'FORM_BIOPHYSICS' as const },
    { name: 'digital_reflections', minValue: 25, maxValue: 30, rangeId: 4, inverse: true, type: 'FORM_BIOPHYSICS' as const },
    { name: 'digital_reflections', minValue: 20, maxValue: 25, rangeId: 5, inverse: true, type: 'FORM_BIOPHYSICS' as const },
    { name: 'digital_reflections', minValue: 15, maxValue: 20, rangeId: 6, inverse: true, type: 'FORM_BIOPHYSICS' as const },
    { name: 'digital_reflections', minValue: 10, maxValue: 15, rangeId: 7, inverse: true, type: 'FORM_BIOPHYSICS' as const },
    { name: 'digital_reflections', minValue: 8, maxValue: 10, rangeId: 8, inverse: true, type: 'FORM_BIOPHYSICS' as const },
    { name: 'digital_reflections', minValue: 6, maxValue: 8, rangeId: 9, inverse: true, type: 'FORM_BIOPHYSICS' as const },
    { name: 'digital_reflections', minValue: 4, maxValue: 6, rangeId: 10, inverse: true, type: 'FORM_BIOPHYSICS' as const },
    { name: 'digital_reflections', minValue: 3, maxValue: 4, rangeId: 11, inverse: true, type: 'FORM_BIOPHYSICS' as const },
    { name: 'digital_reflections', minValue: 2, maxValue: 3, rangeId: 12, inverse: true, type: 'FORM_BIOPHYSICS' as const },
    { name: 'digital_reflections', minValue: 1, maxValue: 2, rangeId: 13, inverse: true, type: 'FORM_BIOPHYSICS' as const },
    { name: 'digital_reflections', minValue: 0, maxValue: 1, rangeId: 14, inverse: true, type: 'FORM_BIOPHYSICS' as const },
  ];

  const biochemistryBoards = [
    // Somatomedina C (IGF-1)
    { name: 'somatomedinC', minValue: 325, maxValue: 350, rangeId: 1, inverse: true, type: 'FORM_BIOCHEMISTRY' as const },
    { name: 'somatomedinC', minValue: 300, maxValue: 325, rangeId: 2, inverse: true, type: 'FORM_BIOCHEMISTRY' as const },
    { name: 'somatomedinC', minValue: 250, maxValue: 300, rangeId: 3, inverse: true, type: 'FORM_BIOCHEMISTRY' as const },
    { name: 'somatomedinC', minValue: 200, maxValue: 250, rangeId: 4, inverse: true, type: 'FORM_BIOCHEMISTRY' as const },
    { name: 'somatomedinC', minValue: 150, maxValue: 200, rangeId: 5, inverse: true, type: 'FORM_BIOCHEMISTRY' as const },
    { name: 'somatomedinC', minValue: 100, maxValue: 150, rangeId: 6, inverse: true, type: 'FORM_BIOCHEMISTRY' as const },
    { name: 'somatomedinC', minValue: 80, maxValue: 100, rangeId: 7, inverse: true, type: 'FORM_BIOCHEMISTRY' as const },
    { name: 'somatomedinC', minValue: 60, maxValue: 80, rangeId: 8, inverse: true, type: 'FORM_BIOCHEMISTRY' as const },
    { name: 'somatomedinC', minValue: 50, maxValue: 60, rangeId: 9, inverse: true, type: 'FORM_BIOCHEMISTRY' as const },
    { name: 'somatomedinC', minValue: 40, maxValue: 50, rangeId: 10, inverse: true, type: 'FORM_BIOCHEMISTRY' as const },
    { name: 'somatomedinC', minValue: 30, maxValue: 40, rangeId: 11, inverse: true, type: 'FORM_BIOCHEMISTRY' as const },
    { name: 'somatomedinC', minValue: 20, maxValue: 30, rangeId: 12, inverse: true, type: 'FORM_BIOCHEMISTRY' as const },
    { name: 'somatomedinC', minValue: 10, maxValue: 20, rangeId: 13, inverse: true, type: 'FORM_BIOCHEMISTRY' as const },
    { name: 'somatomedinC', minValue: 0, maxValue: 10, rangeId: 14, inverse: true, type: 'FORM_BIOCHEMISTRY' as const },
    // Hemoglobina Glicosilada (HbA1c)
    ...Array(14).fill(0).map((_, i) => ({ name: 'hba1c', minValue: i * 1, maxValue: (i * 1) + 0.5, rangeId: i + 1, inverse: false, type: 'FORM_BIOCHEMISTRY' as const })),
    // Insulina Basal
    ...Array(14).fill(0).map((_, i) => ({ name: 'insulinBasal', minValue: 1 + i * 10, maxValue: 2 + i * 10, rangeId: i + 1, inverse: false, type: 'FORM_BIOCHEMISTRY' as const })),
    // DHEA-S
    ...Array(14).fill(0).map((_, i) => ({ name: 'dheaS', minValue: 400 - i * 20, maxValue: 450 - i * 20, rangeId: i + 1, inverse: true, type: 'FORM_BIOCHEMISTRY' as const })),
    // Testosterona Libre
    ...Array(14).fill(0).map((_, i) => ({ name: 'freeTestosterone', minValue: 50 - i * 3, maxValue: 55 - i * 3, rangeId: i + 1, inverse: true, type: 'FORM_BIOCHEMISTRY' as const })),
    // SHBG
    ...Array(14).fill(0).map((_, i) => ({ name: 'shbg', minValue: 20 + i * 5, maxValue: 25 + i * 5, rangeId: i + 1, inverse: false, type: 'FORM_BIOCHEMISTRY' as const })),
    // Antígeno Prostático (PSA)
    ...Array(14).fill(0).map((_, i) => ({ name: 'prostateAntigen', minValue: 1 + i * 0.2, maxValue: 1.5 + i * 0.2, rangeId: i + 1, inverse: false, type: 'FORM_BIOCHEMISTRY' as const })),
    // Ácido Úrico
    ...Array(14).fill(0).map((_, i) => ({ name: 'uricAcid', minValue: 4.5 + i * 0.1, maxValue: 5.0 + i * 0.1, rangeId: i + 1, inverse: false, type: 'FORM_BIOCHEMISTRY' as const })),
    // Ferritina
    ...Array(14).fill(0).map((_, i) => ({ name: 'ferritin', minValue: 80 + i * 5, maxValue: 100 + i * 5, rangeId: i + 1, inverse: false, type: 'FORM_BIOCHEMISTRY' as const })),
    // Vitamina D
    ...Array(14).fill(0).map((_, i) => ({ name: 'vitaminD', minValue: 50 - i * 2, maxValue: 55 - i * 2, rangeId: i + 1, inverse: true, type: 'FORM_BIOCHEMISTRY' as const })),
    // Homocisteína
    ...Array(14).fill(0).map((_, i) => ({ name: 'homocysteine', minValue: 7 + i * 0.5, maxValue: 8 + i * 0.5, rangeId: i + 1, inverse: false, type: 'FORM_BIOCHEMISTRY' as const })),
    // Proteína C Reactiva (PCR)
    ...Array(14).fill(0).map((_, i) => ({ name: 'pcr', minValue: 0.5 + i * 0.1, maxValue: 1.0 + i * 0.1, rangeId: i + 1, inverse: false, type: 'FORM_BIOCHEMISTRY' as const })),
    // Fibrinógeno
    ...Array(14).fill(0).map((_, i) => ({ name: 'fibrinogen', minValue: 250 + i * 10, maxValue: 270 + i * 10, rangeId: i + 1, inverse: false, type: 'FORM_BIOCHEMISTRY' as const })),
    // Triglicéridos
    ...Array(14).fill(0).map((_, i) => ({ name: 'triglycerides', minValue: 70 + i * 5, maxValue: 90 + i * 5, rangeId: i + 1, inverse: false, type: 'FORM_BIOCHEMISTRY' as const })),
    // Colesterol HDL
    ...Array(14).fill(0).map((_, i) => ({ name: 'hdl', minValue: 70 - i * 2, maxValue: 75 - i * 2, rangeId: i + 1, inverse: true, type: 'FORM_BIOCHEMISTRY' as const })),
    // Relación TG/HDL
    ...Array(14).fill(0).map((_, i) => ({ name: 'tgHdlRatio', minValue: 1 + i * 0.2, maxValue: 1.5 + i * 0.2, rangeId: i + 1, inverse: false, type: 'FORM_BIOCHEMISTRY' as const })),
  ];

  const allBoardsToCreate = [...biophysicsBoards, ...biochemistryBoards];

  await prisma.board.createMany({ data: allBoardsToCreate });
  console.log('📏 Baremos (boards) creados/actualizados.');
  
  const adminEmail = 'admin@doctorantivejez.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
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

  // ===== SEEDING DE GUÍA DE ALIMENTACIÓN =====
  console.log('🍓 Iniciando seeding de la guía de alimentación...');
  await prisma.foodItem.deleteMany({});
  console.log('🗑️ Alimentos antiguos eliminados.');

  const foodItems = [
    // DESAYUNO
    { name: 'Cereales de trigo sarraceno, avena sin gluten', mealType: 'DESAYUNO' as const, bloodTypeGroup: 'A_AB' as const },
    { name: 'Tortilla de huevo con avena s/g', mealType: 'DESAYUNO' as const, bloodTypeGroup: 'A_AB' as const },
    { name: 'Creps de avena s/g', mealType: 'DESAYUNO' as const, bloodTypeGroup: 'A_AB' as const },
    { name: 'Leche de soya o almendras', mealType: 'DESAYUNO' as const, bloodTypeGroup: 'A_AB' as const },
    { name: 'Huevo revuelto con vegetales y queso de cabra', mealType: 'DESAYUNO' as const, bloodTypeGroup: 'A_AB' as const },
    { name: 'Yogur de cabra con frutas', mealType: 'DESAYUNO' as const, bloodTypeGroup: 'A_AB' as const },
    { name: 'Huevo escalfado con verduras al vapor', mealType: 'DESAYUNO' as const, bloodTypeGroup: 'A_AB' as const },
    { name: 'Cereales de', mealType: 'DESAYUNO' as const, bloodTypeGroup: 'O_B' as const },
    { name: 'Creps de yuca', mealType: 'DESAYUNO' as const, bloodTypeGroup: 'O_B' as const },
    { name: 'Suero de leche (Whey protein)', mealType: 'DESAYUNO' as const, bloodTypeGroup: 'O_B' as const },
    { name: 'Huevo duro cocido con tiras de queso de cabra', mealType: 'DESAYUNO' as const, bloodTypeGroup: 'O_B' as const },
    { name: 'Omelette de clara de huevo con champiñones', mealType: 'DESAYUNO' as const, bloodTypeGroup: 'O_B' as const },
    { name: 'Infusiones o café sin azúcar', mealType: 'DESAYUNO' as const, bloodTypeGroup: 'O_B' as const },
    { name: 'Pan sin gluten', mealType: 'DESAYUNO' as const, bloodTypeGroup: 'ALL' as const },
    { name: 'Batido de proteínas con espinacas', mealType: 'DESAYUNO' as const, bloodTypeGroup: 'ALL' as const },
    { name: 'Tostadas de pan integral con mantequilla de almendra', mealType: 'DESAYUNO' as const, bloodTypeGroup: 'ALL' as const },
    
    // ALMUERZO
    { name: 'Carnes rojas o blancas', mealType: 'ALMUERZO' as const, bloodTypeGroup: 'O_B' as const },
    { name: 'Pasticho de berenjena con carne', mealType: 'ALMUERZO' as const, bloodTypeGroup: 'O_B' as const },
    { name: 'Tomate relleno con carne molida', mealType: 'ALMUERZO' as const, bloodTypeGroup: 'O_B' as const },
    { name: 'Rissoto o ñoquis', mealType: 'ALMUERZO' as const, bloodTypeGroup: 'O_B' as const },
    { name: 'Pizza de casabe con queso de cabra', mealType: 'ALMUERZO' as const, bloodTypeGroup: 'O_B' as const },
    { name: 'Kibbe con ensalada Fatush', mealType: 'ALMUERZO' as const, bloodTypeGroup: 'O_B' as const },
    { name: 'Lomito con jojoticos chinos', mealType: 'ALMUERZO' as const, bloodTypeGroup: 'O_B' as const },
    { name: 'Carnes blancas', mealType: 'ALMUERZO' as const, bloodTypeGroup: 'A_AB' as const },
    { name: 'Pasticho de berenjena con pollo', mealType: 'ALMUERZO' as const, bloodTypeGroup: 'A_AB' as const },
    { name: 'Tomate relleno con pollo', mealType: 'ALMUERZO' as const, bloodTypeGroup: 'A_AB' as const },
    { name: 'Pizza de coliflor con queso de cabra', mealType: 'ALMUERZO' as const, bloodTypeGroup: 'A_AB' as const },
    { name: 'Falafel con ensalada Tabule de quinoa', mealType: 'ALMUERZO' as const, bloodTypeGroup: 'A_AB' as const },
    { name: 'Pollo a la naranja con ensalada budda', mealType: 'ALMUERZO' as const, bloodTypeGroup: 'A_AB' as const },
    { name: 'Ensaladas', mealType: 'ALMUERZO' as const, bloodTypeGroup: 'ALL' as const },
    { name: 'Granos', mealType: 'ALMUERZO' as const, bloodTypeGroup: 'ALL' as const },
    { name: 'Pan sin gluten', mealType: 'ALMUERZO' as const, bloodTypeGroup: 'ALL' as const },

    // CENA
    { name: 'Ensaladas de sardinas, salmón o mariscos', mealType: 'CENA' as const, bloodTypeGroup: 'O_B' as const },
    { name: 'Sushi', mealType: 'CENA' as const, bloodTypeGroup: 'A_AB' as const },
    { name: 'Ceviche', mealType: 'CENA' as const, bloodTypeGroup: 'A_AB' as const },
    { name: 'Antipasto', mealType: 'CENA' as const, bloodTypeGroup: 'A_AB' as const },
    { name: 'Carpaccio', mealType: 'CENA' as const, bloodTypeGroup: 'A_AB' as const },

    // MERIENDAS Y POSTRES
    { name: 'Gelatina de lámina o 1 cda de polvo sin sabor en infusión con stevia o limón (GELATE)', mealType: 'MERIENDAS_POSTRES' as const, bloodTypeGroup: 'O_B' as const },
    { name: '7 Semillas: almendras, nueces, pistacho, maní, guyama tostada', mealType: 'MERIENDAS_POSTRES' as const, bloodTypeGroup: 'A_AB' as const },
    { name: 'Batido de proteina: 1 cda de suero o ricotta sin sal, whey protein o soy protein', mealType: 'MERIENDAS_POSTRES' as const, bloodTypeGroup: 'A_AB' as const },
    { name: 'Helado Vegano (leche de almendras o coco)', mealType: 'MERIENDAS_POSTRES' as const, bloodTypeGroup: 'A_AB' as const },
    { name: 'Tableta de Cacao Natives 100%', mealType: 'MERIENDAS_POSTRES' as const, bloodTypeGroup: 'A_AB' as const },
  ];

  await prisma.foodItem.createMany({
    data: foodItems,
  });
  console.log(`🍓 ${foodItems.length} alimentos creados.`);

  // ===== SEEDING DE GUÍA GENERAL Y CLAVES DE BIENESTAR =====
  await prisma.generalGuideItem.deleteMany({});
  await prisma.wellnessKey.deleteMany({});
  console.log('🗑️ Guía General y Claves de Bienestar antiguas eliminadas.');

  const foodsToAvoid = [
    "Cocina y sus derivados, atún, pez espada, grasas, frituras, huevos fritos.",
    "Caseína: lácteos de vaca y búfala, parmesano, embutidos con preservativos, refrescos, azúcar, edulcorantes, chucherías, harinas refinadas y sus derivados, cereales refinados, jugos naturales.",
    "Papaya, mango, banana, melón, patilla, piña (una vez por semana).",
    "Tubérculos: gluten, trigo, avena, cebada, centeno integral."
  ];

  const foodSubstitutes = [
    "Carnes a la plancha, sancochado, al horno, huevos sancochados, revueltos o en agua.",
    "Quesos blanco, fresco o yogurt de cabra, leches vegetales (soja, almendra...).",
    "Infusiones de plantas (malojillo, toronjil, té verde, café...), productos naturales, frutas frescas o secas, harinas integrales, germinados, verduras frescas, semillas tostadas (almendras, avellanas, nueces, pistacho, merey, ajonjolí, germen de trigo, maní en concha, etc.).",
    "Enlatados en agua o en aceite. Suero o ricota (sin sal), lácteos de cabra, Pecorino o Manchego.",
    "Leche de soya, almendra, coco..., productos sin gluten: pan, maíz, fororo, arroz, yuca, plátano, papa, batata, granola, avena."
  ];

  await prisma.generalGuideItem.createMany({
    data: [
      ...foodsToAvoid.m