// prisma/seed.ts
import { PrismaClient, FoodCategory, BenefitLevel } from '@prisma/client';

const prisma = new PrismaClient();

// --- TIPOS DE ALIMENTOS POR TIPO DE SANGRE ---
// Esta estructura nos permite definir qué alimentos son beneficiosos, neutros o a evitar para cada tipo de sangre.
const foodData = {
  // --- TIPO O ---
  O: {
    BENEFICIAL: {
      PROTEINS: ['Carne de Res', 'Carne de Carnero', 'Corazón', 'Hígado', 'Ternera', 'Bacalao', 'Lenguado', 'Merluza', 'Salmón', 'Sardina', 'Trucha'],
      DAIRY_EGGS: [],
      OILS_FATS: ['Aceite de Oliva', 'Aceite de Linaza'],
      NUTS_SEEDS: ['Nueces', 'Semillas de Calabaza'],
      LEGUMES: ['Frijoles (caraotas)'],
      GRAINS: [],
      VEGETABLES: ['Ajo', 'Batata', 'Brócoli', 'Cebolla', 'Calabaza', 'Espinaca', 'Lechuga Romana', 'Pimiento Rojo', 'Perejil'],
      FRUITS: ['Ciruelas', 'Higos', 'Ciruelas Pasas'],
      JUICES: ['Jugo de Ciruela', 'Jugo de Piña', 'Jugo de Cereza Negra'],
      SPICES: ['Cúrcuma', 'Pimienta de Cayena', 'Algas Marinas'],
      TEAS: ['Té de Perejil', 'Té de Menta'],
    },
    NEUTRAL: {
      PROTEINS: ['Pollo', 'Pavo', 'Pato', 'Atún', 'Camarón', 'Cangrejo', 'Langosta', 'Mejillones', 'Ostras'],
      DAIRY_EGGS: ['Mantequilla', 'Queso de Cabra', 'Queso Feta', 'Mozzarella', 'Leche de Soja', 'Huevos'],
      OILS_FATS: ['Aceite de Canola', 'Aceite de Sésamo'],
      NUTS_SEEDS: ['Almendras', 'Avellanas', 'Semillas de Girasol', 'Semillas de Sésamo', 'Tahini'],
      LEGUMES: ['Garbanzos', 'Lentejas Verdes', 'Guisantes'],
      GRAINS: ['Arroz', 'Mijo', 'Avena'],
      VEGETABLES: ['Apio', 'Berenjena', 'Espárragos', 'Hinojo', 'Jengibre', 'Pepino', 'Pimiento Verde', 'Pimiento Amarillo', 'Rábano', 'Tomate', 'Zanahoria', 'Zuquini'],
      FRUITS: ['Albaricoque', 'Arándano', 'Cereza', 'Dátil', 'Frambuesa', 'Granada', 'Guayaba', 'Kiwi', 'Limón', 'Mango', 'Manzana', 'Melocotón', 'Melón', 'Papaya', 'Pera', 'Piña', 'Sandía', 'Uvas'],
      JUICES: ['Jugo de Uva', 'Jugo de Papaya', 'Jugo de Apio', 'Jugo de Pepino'],
      SPICES: ['Albahaca', 'Azafrán', 'Canela', 'Cardamomo', 'Clavo', 'Comino', 'Eneldo', 'Laurel', 'Menta', 'Mostaza', 'Orégano', 'Pimentón', 'Romero', 'Salvia', 'Tomillo'],
      TEAS: ['Té Verde', 'Té de Manzanilla', 'Té de Jengibre'],
    },
    AVOID: {
      PROTEINS: ['Carne de Cerdo', 'Ganso', 'Pulpo', 'Salmón Ahumado', 'Arenque'],
      DAIRY_EGGS: ['Leche de Vaca', 'Queso Americano', 'Queso Azul', 'Queso Crema', 'Yogur', 'Helado'],
      OILS_FATS: ['Aceite de Maíz', 'Aceite de Maní', 'Aceite de Cártamo'],
      NUTS_SEEDS: ['Maní (cacahuetes)', 'Pistachos', 'Semillas de Amapola'],
      LEGUMES: ['Lentejas Rojas'],
      GRAINS: ['Trigo', 'Maíz', 'Cuscús', 'Gluten'],
      VEGETABLES: ['Aguacate', 'Coliflor', 'Champiñones', 'Maíz', 'Papa', 'Repollo'],
      FRUITS: ['Fresa', 'Mandarina', 'Naranja', 'Melón Cantalupo'],
      JUICES: ['Jugo de Naranja', 'Jugo de Manzana'],
      SPICES: ['Pimienta Blanca', 'Pimienta Negra', 'Vinagre', 'Canela'],
      TEAS: ['Té Negro'],
    },
  },
  // --- TIPO A ---
  A: {
    BENEFICIAL: {
      PROTEINS: ['Bacalao', 'Carpa', 'Salmón', 'Sardina', 'Trucha'],
      DAIRY_EGGS: [],
      OILS_FATS: ['Aceite de Oliva', 'Aceite de Linaza'],
      NUTS_SEEDS: ['Maní (cacahuetes)', 'Semillas de Calabaza'],
      LEGUMES: ['Lentejas', 'Frijoles Negros', 'Soja'],
      GRAINS: ['Avena', 'Arroz Integral', 'Pan de Soja'],
      VEGETABLES: ['Ajo', 'Brócoli', 'Cebolla', 'Espinaca', 'Zanahoria', 'Calabaza'],
      FRUITS: ['Albaricoque', 'Ciruela', 'Higos', 'Limón', 'Piña'],
      JUICES: ['Jugo de Albaricoque', 'Jugo de Ciruela', 'Jugo de Piña', 'Jugo de Apio'],
      SPICES: ['Jengibre', 'Ajo', 'Salsa de Soja'],
      TEAS: ['Té Verde', 'Té de Manzanilla', 'Té de Jengibre'],
    },
    NEUTRAL: {
      PROTEINS: ['Pollo', 'Pavo', 'Atún'],
      DAIRY_EGGS: ['Yogur', 'Queso de Cabra', 'Kefir', 'Mozzarella'],
      OILS_FATS: ['Aceite de Canola'],
      NUTS_SEEDS: ['Almendras', 'Nueces', 'Semillas de Girasol'],
      LEGUMES: ['Guisantes'],
      GRAINS: ['Maíz', 'Mijo', 'Quinoa'],
      VEGETABLES: ['Espárragos', 'Pepino', 'Lechuga', 'Zuquini'],
      FRUITS: ['Manzana', 'Pera', 'Uvas', 'Kiwi', 'Melocotón'],
      JUICES: ['Jugo de Manzana', 'Jugo de Uva'],
      SPICES: ['Albahaca', 'Orégano', 'Mostaza'],
      TEAS: ['Té de Diente de León'],
    },
    AVOID: {
      PROTEINS: ['Carne de Res', 'Carne de Cerdo', 'Pato', 'Camarón', 'Cangrejo', 'Langosta'],
      DAIRY_EGGS: ['Leche de Vaca', 'Queso Americano', 'Queso Azul', 'Mantequilla'],
      OILS_FATS: ['Aceite de Maíz', 'Aceite de Sésamo'],
      NUTS_SEEDS: ['Pistachos'],
      LEGUMES: ['Garbanzos', 'Frijoles Rojos'],
      GRAINS: ['Trigo'],
      VEGETABLES: ['Berenjena', 'Champiñones', 'Papa', 'Pimiento', 'Tomate', 'Repollo'],
      FRUITS: ['Banana', 'Mango', 'Naranja', 'Papaya'],
      JUICES: ['Jugo de Naranja', 'Jugo de Tomate'],
      SPICES: ['Pimienta Negra', 'Pimienta de Cayena', 'Vinagre'],
      TEAS: ['Té Negro'],
    },
  },
  // --- TIPO B ---
  B: {
    BENEFICIAL: {
      PROTEINS: ['Carnero', 'Cordero', 'Sardina', 'Salmón', 'Lenguado'],
      DAIRY_EGGS: ['Leche de Cabra', 'Queso de Cabra', 'Yogur', 'Kefir', 'Huevos'],
      OILS_FATS: ['Aceite de Oliva'],
      NUTS_SEEDS: [],
      LEGUMES: ['Frijoles'],
      GRAINS: ['Avena', 'Arroz'],
      VEGETABLES: ['Brócoli', 'Repollo', 'Pimiento', 'Batata', 'Zanahoria'],
      FRUITS: ['Banana', 'Uvas', 'Papaya', 'Piña'],
      JUICES: ['Jugo de Uva', 'Jugo de Papaya', 'Jugo de Piña'],
      SPICES: ['Jengibre', 'Curry', 'Pimienta de Cayena'],
      TEAS: ['Té de Jengibre', 'Té de Menta'],
    },
    NEUTRAL: {
      PROTEINS: ['Carne de Res', 'Pavo', 'Atún', 'Bacalao'],
      DAIRY_EGGS: ['Queso Feta', 'Mozzarella', 'Leche de Vaca (con moderación)'],
      OILS_FATS: ['Aceite de Linaza'],
      NUTS_SEEDS: ['Almendras', 'Nueces'],
      LEGUMES: ['Lentejas Verdes', 'Guisantes'],
      GRAINS: ['Mijo'],
      VEGETABLES: ['Ajo', 'Cebolla', 'Espinaca', 'Pepino', 'Lechuga'],
      FRUITS: ['Manzana', 'Pera', 'Cereza', 'Kiwi', 'Limón', 'Mango'],
      JUICES: ['Jugo de Manzana', 'Jugo de Cereza'],
      SPICES: ['Albahaca', 'Orégano', 'Cúrcuma'],
      TEAS: ['Té Verde', 'Té de Manzanilla'],
    },
    AVOID: {
      PROTEINS: ['Pollo', 'Carne de Cerdo', 'Pato', 'Camarón', 'Cangrejo', 'Langosta'],
      DAIRY_EGGS: ['Queso Americano', 'Queso Azul'],
      OILS_FATS: ['Aceite de Maíz', 'Aceite de Canola', 'Aceite de Girasol', 'Aceite de Sésamo'],
      NUTS_SEEDS: ['Maní (cacahuetes)', 'Semillas de Girasol', 'Semillas de Sésamo', 'Tahini'],
      LEGUMES: ['Lentejas Rojas', 'Garbanzos', 'Frijoles Negros'],
      GRAINS: ['Trigo', 'Maíz', 'Centeno'],
      VEGETABLES: ['Tomate', 'Aguacate', 'Maíz', 'Calabaza'],
      FRUITS: ['Granada', 'Coco'],
      JUICES: ['Jugo de Tomate'],
      SPICES: ['Pimienta Negra', 'Canela'],
      TEAS: ['Té de Tilo'],
    },
  },
  // --- TIPO AB ---
  AB: {
    BENEFICIAL: {
      PROTEINS: ['Carnero', 'Pavo', 'Atún', 'Bacalao', 'Salmón', 'Sardina'],
      DAIRY_EGGS: ['Yogur', 'Kefir', 'Queso de Cabra', 'Mozzarella'],
      OILS_FATS: ['Aceite de Oliva'],
      NUTS_SEEDS: ['Maní (cacahuetes)', 'Nueces'],
      LEGUMES: ['Lentejas', 'Soja'],
      GRAINS: ['Avena', 'Arroz', 'Mijo'],
      VEGETABLES: ['Brócoli', 'Apio', 'Pepino', 'Ajo', 'Batata'],
      FRUITS: ['Cereza', 'Uvas', 'Kiwi', 'Limón', 'Piña'],
      JUICES: ['Jugo de Uva', 'Jugo de Cereza'],
      SPICES: ['Curry', 'Ajo', 'Perejil'],
      TEAS: ['Té Verde', 'Té de Manzanilla'],
    },
    NEUTRAL: {
      PROTEINS: ['Hígado', 'Carpa'],
      DAIRY_EGGS: ['Queso Crema', 'Leche de Soja', 'Huevos'],
      OILS_FATS: ['Aceite de Canola', 'Aceite de Linaza'],
      NUTS_SEEDS: ['Almendras', 'Pistachos'],
      LEGUMES: ['Guisantes', 'Frijoles Blancos'],
      GRAINS: [],
      VEGETABLES: ['Espinaca', 'Cebolla', 'Lechuga', 'Champiñones', 'Papa'],
      FRUITS: ['Manzana', 'Pera', 'Albaricoque', 'Frambuesa', 'Higos'],
      JUICES: ['Jugo de Manzana', 'Jugo de Albaricoque'],
      SPICES: ['Albahaca', 'Orégano', 'Mostaza'],
      TEAS: ['Té de Menta'],
    },
    AVOID: {
      PROTEINS: ['Carne de Res', 'Pollo', 'Carne de Cerdo', 'Camarón', 'Cangrejo', 'Langosta'],
      DAIRY_EGGS: ['Leche de Vaca Entera', 'Mantequilla', 'Queso Americano', 'Queso Azul'],
      OILS_FATS: ['Aceite de Maíz', 'Aceite de Girasol', 'Aceite de Sésamo'],
      NUTS_SEEDS: ['Semillas de Girasol', 'Semillas de Sésamo', 'Semillas de Calabaza'],
      LEGUMES: ['Garbanzos', 'Frijoles Negros', 'Frijoles Rojos'],
      GRAINS: ['Maíz'],
      VEGETABLES: ['Pimiento', 'Aguacate', 'Maíz', 'Rábano'],
      FRUITS: ['Banana', 'Mango', 'Naranja', 'Guayaba'],
      JUICES: ['Jugo de Naranja'],
      SPICES: ['Pimienta Negra', 'Pimienta de Cayena', 'Vinagre'],
      TEAS: ['Té Negro', 'Té de Tilo'],
    },
  },
};


async function main() {
  console.log('🌱 Iniciando seeding de la base de datos...');

  // --- Limpiar datos antiguos para evitar duplicados ---
  await prisma.foodBloodTypeBenefit.deleteMany({});
  await prisma.food.deleteMany({});
  await prisma.bloodType.deleteMany({});
  console.log('🗑️ Datos de nutrición antiguos eliminados.');

  // --- Crear Tipos de Sangre ---
  const bloodTypes = await prisma.bloodType.createManyAndReturn({
    data: [
      { name: 'O' },
      { name: 'A' },
      { name: 'B' },
      { name: 'AB' },
    ],
  });
  const bloodTypeMap = new Map(bloodTypes.map(bt => [bt.name, bt.id]));
  console.log('🩸 Tipos de sangre creados.');

  // --- Crear Alimentos y sus relaciones ---
  const allFoods = new Map<string, { id: string }>();
  const foodBenefitLinks = [];

  for (const [bloodTypeName, benefits] of Object.entries(foodData)) {
    const bloodTypeId = bloodTypeMap.get(bloodTypeName);
    if (!bloodTypeId) continue;

    for (const [benefitLevel, categories] of Object.entries(benefits)) {
      for (const [categoryName, foods] of Object.entries(categories)) {
        for (const foodName of foods) {
          // Crear el alimento si no existe
          if (!allFoods.has(foodName)) {
            const newFood = await prisma.food.create({
              data: {
                name: foodName,
                category: categoryName as FoodCategory,
              },
            });
            allFoods.set(foodName, newFood);
          }

          // Crear el enlace entre el alimento y el tipo de sangre
          const foodId = allFoods.get(foodName)!.id;
          foodBenefitLinks.push({
            foodId,
            bloodTypeId,
            benefit: benefitLevel as BenefitLevel,
          });
        }
      }
    }
  }
  
  // Usar createMany para eficiencia
  if (foodBenefitLinks.length > 0) {
    await prisma.foodBloodTypeBenefit.createMany({
      data: foodBenefitLinks,
      skipDuplicates: true, // Evita errores si el enlace ya existe
    });
  }

  console.log(`🍎 Creados ${allFoods.size} alimentos y ${foodBenefitLinks.length} relaciones de beneficio.`);

  console.log('✅ Seeding de nutrición completado exitosamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
