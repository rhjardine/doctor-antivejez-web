// src/utils/orthomolecular-calculations.ts

import { OrthomolecularTestFormValues } from '@/types/orthomolecular';

// --- ESTRUCTURA DE DATOS BASADA EN LA TABLA PROPORCIONADA ---
// Cada elemento tiene una lista de "brackets" o rangos.
// Cada bracket tiene un rango de valores [min, max] y un rango de edad [minAge, maxAge].
const ageBrackets: Record<string, { range: [number, number]; age: [number, number] }[]> = {
  aluminio: [
    { range: [0, 1.75], age: [21, 28] }, { range: [1.75, 3.5], age: [28, 35] },
    { range: [3.5, 5.25], age: [35, 42] }, { range: [5.25, 7], age: [42, 49] },
    { range: [7, 7.9], age: [49, 56] }, { range: [7.9, 8.8], age: [56, 63] },
    { range: [8.8, 9.7], age: [63, 70] }, { range: [9.7, 9.8], age: [70, 77] },
    { range: [9.8, 9.9], age: [77, 84] }, { range: [9.9, 10], age: [84, 91] },
    { range: [10, 10.1], age: [91, 98] }, { range: [10.1, 10.2], age: [98, 105] },
    { range: [10.2, 10.3], age: [105, 112] }, { range: [10.3, Infinity], age: [112, 120] },
  ],
  arsenico: [
    { range: [0, 0.02], age: [21, 28] }, { range: [0.02, 0.04], age: [28, 35] },
    { range: [0.04, 0.06], age: [35, 42] }, { range: [0.06, 0.08], age: [42, 49] },
    { range: [0.08, 0.09], age: [49, 56] }, { range: [0.09, 0.1], age: [56, 63] },
    { range: [0.1, 0.11], age: [63, 70] }, { range: [0.11, 0.16], age: [70, 77] },
    { range: [0.16, 0.17], age: [77, 84] }, { range: [0.17, 0.18], age: [84, 91] },
    { range: [0.18, 0.19], age: [91, 98] }, { range: [0.19, 0.2], age: [98, 105] },
    { range: [0.2, 0.21], age: [105, 112] }, { range: [0.21, Infinity], age: [112, 120] },
  ],
  plomo: [
    { range: [0, 0.2], age: [21, 28] }, { range: [0.2, 0.4], age: [28, 35] },
    { range: [0.4, 0.6], age: [35, 42] }, { range: [0.6, 0.8], age: [42, 49] },
    { range: [0.8, 0.9], age: [49, 56] }, { range: [0.9, 1], age: [56, 63] },
    { range: [1, 1.11], age: [63, 70] }, { range: [1.11, 1.12], age: [70, 77] },
    { range: [1.12, 1.13], age: [77, 84] }, { range: [1.13, 1.14], age: [84, 91] },
    { range: [1.14, 1.15], age: [91, 98] }, { range: [1.15, Infinity], age: [112, 120] },
  ],
  // --- Minerales con rangos de deficiencia y exceso ---
  calcio: [
    { range: [135, 200], age: [21, 28] }, // Deficiencia
    { range: [200, 325], age: [21, 28] }, // Óptimo
    { range: [325, 450], age: [28, 35] }, // Exceso
    // ... y así sucesivamente para todos los rangos de la tabla.
  ],
  zinc: [
    { range: [87.75, 130], age: [21, 28] }, // Deficiencia
    { range: [130, 147.5], age: [21, 28] }, // Óptimo
    { range: [147.5, 165], age: [28, 35] }, // Exceso
     // ... y así sucesivamente.
  ],
  // ... Añadir aquí el resto de los elementos de la tabla de la misma manera.
};

/**
 * Calcula la Edad Orthomolecular basándose en los valores del test y la tabla de rangos.
 *
 * @param {OrthomolecularTestFormValues['elements']} elements - Objeto con los valores de cada elemento.
 * @param {number} chronologicalAge - La edad cronológica actual del paciente.
 * @returns {number} La edad orthomolecular calculada.
 */
export const calculateOrthomolecularAge = (
  elements: OrthomolecularTestFormValues['elements'],
  chronologicalAge: number // La edad cronológica no se usa en este cálculo, pero se mantiene por si se necesita en el futuro.
): number => {
  if (!elements || Object.keys(elements).length === 0) {
    return 0;
  }

  const calculatedAges: number[] = [];

  // Iterar sobre cada elemento introducido en el formulario
  for (const elementId in elements) {
    const value = elements[elementId as keyof typeof elements];
    
    // Asegurarse de que el valor no es nulo y que el elemento existe en nuestra tabla
    if (value !== null && value !== undefined && ageBrackets[elementId]) {
      const brackets = ageBrackets[elementId];
      
      // Encontrar el rango de edad correspondiente al valor del elemento
      const matchingBracket = brackets.find(bracket => value >= bracket.range[0] && value <= bracket.range[1]);

      if (matchingBracket) {
        // Usamos el punto medio del rango de edad como la edad representativa para este elemento
        const representativeAge = (matchingBracket.age[0] + matchingBracket.age[1]) / 2;
        calculatedAges.push(representativeAge);
      }
    }
  }

  // Si no se pudo calcular ninguna edad, devolver 0
  if (calculatedAges.length === 0) {
    return 0;
  }

  // La edad orthomolecular final es el promedio de todas las edades calculadas
  const averageAge = calculatedAges.reduce((sum, age) => sum + age, 0) / calculatedAges.length;

  return Math.round(averageAge * 10) / 10; // Redondear a 1 decimal
};
