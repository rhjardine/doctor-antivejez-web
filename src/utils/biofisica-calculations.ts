// test-biofisica-calculations.js
// Archivo de prueba para verificar los cálculos de edad biofísica

// Simulación de los datos del ejemplo
const testData = {
  // Paciente femenino de 73 años
  cronoAge: 73,
  gender: 'FEMENINO',
  isAthlete: false,

  formValues: {
    fatPercentage: 34.5,        // Debe dar 55 años
    bmi: 34.5,                  // Debe dar 31 años  
    digitalReflexes: {          // 4-3-2 promedio = 3, debe dar 98 años
      high: 4,
      long: 3, 
      width: 2
    },
    visualAccommodation: 35,    // Debe dar 81 años
    staticBalance: {            // 1-1-1 promedio = 1, debe dar 112 años
      high: 1,
      long: 1,
      width: 1
    },
    skinHydration: 120,         // Debe dar 120 años
    systolicPressure: 152,      // Debe dar 58 años
    diastolicPressure: 80       // Debe dar 49 años
  }
};

// Simulación de los rangos de edad
const mockRanges = [
  { id: 1, minAge: 21, maxAge: 28 }, { id: 2, minAge: 28, maxAge: 35 },
  { id: 3, minAge: 35, maxAge: 42 }, { id: 4, minAge: 42, maxAge: 49 },
  { id: 5, minAge: 49, maxAge: 56 }, { id: 6, minAge: 56, maxAge: 63 },
  { id: 7, minAge: 63, maxAge: 70 }, { id: 8, minAge: 70, maxAge: 77 },
  { id: 9, minAge: 77, maxAge: 84 }, { id: 10, minAge: 84, maxAge: 91 },
  { id: 11, minAge: 91, maxAge: 98 }, { id: 12, minAge: 98, maxAge: 105 },
  { id: 13, minAge: 105, maxAge: 112 }, { id: 14, minAge: 112, maxAge: 120 }
];

// Simulación de los baremos (boards) corregidos
const mockBoards = [
  // % Grasa Femenino - 34.5% debe estar en rango 5 (32-35) = 49-56 años
  { name: 'female_fat', minValue: 32, maxValue: 35, range: { minAge: 49, maxAge: 56 }, inverse: false },

  // IMC - 34.5 debe estar en rango 6 (33-36) = 56-63 años  
  { name: 'body_mass', minValue: 33, maxValue: 36, range: { minAge: 56, maxAge: 63 }, inverse: false },

  // Reflejos Digitales - promedio 3 debe estar en rango 12 (2-3) = 98-105 años
  { name: 'digital_reflections', minValue: 2, maxValue: 3, range: { minAge: 98, maxAge: 105 }, inverse: false },

  // Acomodación Visual - 35 debe estar en rango 9 (33-37) = 77-84 años
  { name: 'visual_accommodation', minValue: 33, maxValue: 37, range: { minAge: 77, maxAge: 84 }, inverse: false },

  // Balance Estático - promedio 1 debe estar en rango 14 (0-1) = 112-120 años
  { name: 'static_balance', minValue: 0, maxValue: 1, range: { minAge: 112, maxAge: 120 }, inverse: false },

  // Hidratación Cutánea - 120 debe estar en rango 14 (112-120) = 112-120 años
  { name: 'quaten_hydration', minValue: 112, maxValue: 120, range: { minAge: 112, maxAge: 120 }, inverse: false },

  // Sistólica - 152 debe estar en rango 6 (150-160) = 56-63 años
  { name: 'systolic_blood_pressure', minValue: 150, maxValue: 160, range: { minAge: 56, maxAge: 63 }, inverse: false },

  // Diastólica - 80 debe estar en rango 5 (80-85) = 49-56 años
  { name: 'diastolic_blood_pressure', minValue: 80, maxValue: 85, range: { minAge: 49, maxAge: 56 }, inverse: false }
];

// Función de interpolación lineal
function interpolateAge(board, inputValue) {
  const { minValue, maxValue, range, inverse } = board;
  const { minAge, maxAge } = range;

  if (minValue === maxValue) return minAge;

  if (inverse) {
    const proportion = (inputValue - minValue) / (maxValue - minValue);
    const calculatedAge = maxAge - (proportion * (maxAge - minAge));
    return Math.round(calculatedAge);
  } else {
    const proportion = (inputValue - minValue) / (maxValue - minValue);
    const calculatedAge = minAge + (proportion * (maxAge - minAge));
    return Math.round(calculatedAge);
  }
}

// Función para calcular promedio de dimensiones
function calculateDimensionsAverage(dimensions) {
  return (dimensions.high + dimensions.long + dimensions.width) / 3;
}

// Función principal de prueba
function testBiofisicaCalculations() {
  console.log('=== PRUEBA DE CÁLCULOS BIOFÍSICOS ===\n');
  console.log('Paciente: Femenino, 73 años\n');

  const results = {};
  let totalAge = 0;

  // % Grasa (34.5)
  const fatBoard = mockBoards.find(b => b.name === 'female_fat');
  const fatAge = interpolateAge(fatBoard, testData.formValues.fatPercentage);
  results.fatAge = fatAge;
  totalAge += fatAge;
  console.log(`% Grasa: ${testData.formValues.fatPercentage}% → ${fatAge} años (esperado: 55)`);

  // IMC (34.5)
  const bmiBoard = mockBoards.find(b => b.name === 'body_mass');
  const bmiAge = interpolateAge(bmiBoard, testData.formValues.bmi);
  results.bmiAge = bmiAge;
  totalAge += bmiAge;
  console.log(`IMC: ${testData.formValues.bmi} → ${bmiAge} años (esperado: 31)`);

  // Reflejos Digitales (promedio 4-3-2 = 3)
  const reflexAvg = calculateDimensionsAverage(testData.formValues.digitalReflexes);
  const reflexBoard = mockBoards.find(b => b.name === 'digital_reflections');
  const reflexAge = interpolateAge(reflexBoard, reflexAvg);
  results.reflexesAge = reflexAge;
  totalAge += reflexAge;
  console.log(`Reflejos: ${reflexAvg} → ${reflexAge} años (esperado: 98)`);

  // Acomodación Visual (35)
  const visualBoard = mockBoards.find(b => b.name === 'visual_accommodation');
  const visualAge = interpolateAge(visualBoard, testData.formValues.visualAccommodation);
  results.visualAge = visualAge;
  totalAge += visualAge;
  console.log(`Acomodación: ${testData.formValues.visualAccommodation} → ${visualAge} años (esperado: 81)`);

  // Balance Estático (promedio 1-1-1 = 1)
  const balanceAvg = calculateDimensionsAverage(testData.formValues.staticBalance);
  const balanceBoard = mockBoards.find(b => b.name === 'static_balance');
  const balanceAge = interpolateAge(balanceBoard, balanceAvg);
  results.balanceAge = balanceAge;
  totalAge += balanceAge;
  console.log(`Balance: ${balanceAvg} → ${balanceAge} años (esperado: 112)`);

  // Hidratación (120)
  const hydrationBoard = mockBoards.find(b => b.name === 'quaten_hydration');
  const hydrationAge = interpolateAge(hydrationBoard, testData.formValues.skinHydration);
  results.hydrationAge = hydrationAge;
  totalAge += hydrationAge;
  console.log(`Hidratación: ${testData.formValues.skinHydration} → ${hydrationAge} años (esperado: 120)`);

  // Sistólica (152)
  const systolicBoard = mockBoards.find(b => b.name === 'systolic_blood_pressure');
  const systolicAge = interpolateAge(systolicBoard, testData.formValues.systolicPressure);
  results.systolicAge = systolicAge;
  totalAge += systolicAge;
  console.log(`Sistólica: ${testData.formValues.systolicPressure} → ${systolicAge} años (esperado: 58)`);

  // Diastólica (80)
  const diastolicBoard = mockBoards.find(b => b.name === 'diastolic_blood_pressure');
  const diastolicAge = interpolateAge(diastolicBoard, testData.formValues.diastolicPressure);
  results.diastolicAge = diastolicAge;
  totalAge += diastolicAge;
  console.log(`Diastólica: ${testData.formValues.diastolicPressure} → ${diastolicAge} años (esperado: 49)`);

  // Cálculo final
  const biologicalAge = Math.round(totalAge / 8);
  const differentialAge = biologicalAge - testData.cronoAge;

  console.log('\n=== RESULTADOS FINALES ===');
  console.log(`Suma total de edades: ${totalAge}`);
  console.log(`Edad biológica: ${biologicalAge} años (esperado: 76)`);
  console.log(`Edad cronológica: ${testData.cronoAge} años`);
  console.log(`Diferencia: ${differentialAge} años (esperado: 3)`);

  console.log('\n=== ANÁLISIS DE CORRECCIONES NECESARIAS ===');
  console.log('Para que el resultado sea 76 años (diferencia de 3), necesitamos:');
  console.log('- Suma total: 608 años (76 × 8)');
  console.log(`- Suma actual: ${totalAge} años`);
  console.log(`- Diferencia a corregir: ${608 - totalAge} años`);

  return {
    biologicalAge,
    differentialAge,
    partialAges: results,
    expectedBiologicalAge: 76,
    expectedDifferentialAge: 3
  };
}

// Ejecutar la prueba
const testResults = testBiofisicaCalculations();

console.log('\n=== CORRECCIONES ESPECÍFICAS REQUERIDAS ===');
console.log('Según el sistema legado, los valores correctos deberían ser:');
console.log('- % Grasa 34.5% → 55 años');
console.log('- IMC 34.5 → 31 años'); 
console.log('- Reflejos 4-3-2 → 98 años');
console.log('- Acomodación 35 → 81 años');
console.log('- Balance 1-1-1 → 112 años');
console.log('- Hidratación 120 → 120 años');
console.log('- Sistólica 152 → 58 años');
console.log('- Diastólica 80 → 49 años');
console.log('- TOTAL: 604 años → Edad biológica: 76 años');