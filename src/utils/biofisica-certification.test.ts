/**
 * biofisica-certification.test.ts — SUITE DE VALORES DORADOS (Fase A)
 * ============================================================================
 *
 * PROPÓSITO
 * Certificar que el motor de cálculo de edad biofísica reproduce la
 * "Tabla de Cálculo de Edad Biofísica" oficial del Centro Médico Doctor
 * Antivejez, SIN ALTERAR la lógica de cálculo.
 *
 * Esta suite es una RED DE NO REGRESIÓN: su única función es fallar si algún
 * cambio futuro (UI, Guía del Paciente, refactor) modifica un resultado
 * clínico. No prescribe comportamiento nuevo.
 *
 * DECISIONES DEL DUEÑO INCORPORADAS (Plan v2)
 *  - §1.1  El test biofísico opera con 8 parámetros. El pulso en reposo NO
 *          forma parte del alcance. La edad biofísica es el promedio de los
 *          8 baremos entre 8.
 *  - §1.2  El motor está CONGELADO. Esta suite no lo modifica.
 *  - C1 (Opción 3) La interpolación lineal dentro del septenio se ratifica
 *          como correcta. Criterio de aceptación: el resultado debe caer
 *          DENTRO del septenio oficial, no coincidir con un extremo.
 *  - §1.4  Las ambigüedades del documento (p. ej. el hueco 14-13 del IMC)
 *          quedan CONGELADAS. Se cubren con tests de caracterización
 *          explícitamente marcados, que fijan el comportamiento ACTUAL para
 *          detectar cambios accidentales, sin declararlo clínicamente correcto.
 *  - §1.5  Edad máxima = 120 años.
 *
 * FUENTE NORMATIVA
 * "Tabla de Cálculo de Edad Biofísica" (PDF/DOC oficial). Los baremos de este
 * archivo son una transcripción literal de esa tabla y son la única fuente de
 * verdad de las aserciones.
 */

import { describe, expect, it } from 'vitest';

import type { FormValues } from '@/types/biophysics';
import { calculateBiofisicaResults } from '@/utils/biofisica-calculations';

// ═══════════════════════════════════════════════════════════════════════════
// 1. TRANSCRIPCIÓN DE LA TABLA OFICIAL
// ═══════════════════════════════════════════════════════════════════════════

/** Los 14 septenios oficiales de la tabla. */
const SEPTENIOS: [number, number][] = [
  [21, 28], [28, 35], [35, 42], [42, 49], [49, 56], [56, 63], [63, 70],
  [70, 77], [77, 84], [84, 91], [91, 98], [98, 105], [105, 112], [112, 120],
];

/**
 * Banda de valores de un parámetro para un septenio dado.
 * `main` es el rango principal; `low` el rango secundario (doble umbral).
 */
interface Banda {
  main: [number, number];
  low?: [number, number];
}

/** Baremos oficiales, indexados por septenio (0 = 21-28 … 13 = 112-120). */
const TABLA_OFICIAL: Record<string, Banda[]> = {
  // ── % grasa masculino ────────────────────────────────────────────────────
  bodyFatMale: [
    { main: [10, 14] }, { main: [14, 18] }, { main: [18, 21] }, { main: [21, 24] },
    { main: [24, 27] }, { main: [27, 30] },
    { main: [30, 33], low: [9.99, 7] }, { main: [33, 36], low: [7, 6] },
    { main: [36, 39], low: [6, 5] }, { main: [39, 42], low: [5, 4] },
    { main: [42, 45], low: [4, 3] }, { main: [45, 48], low: [3, 2] },
    { main: [48, 51], low: [2, 1] }, { main: [51, 54], low: [1, 0] },
  ],

  // ── % grasa masculino deportivo ──────────────────────────────────────────
  bodyFatMaleAthlete: [
    { main: [1, 7] }, { main: [7, 14] }, { main: [14, 17] }, { main: [17, 21] },
    { main: [21, 25] }, { main: [25, 28] }, { main: [28, 31] }, { main: [31, 34] },
    { main: [34, 37] }, { main: [37, 40] }, { main: [40, 43] }, { main: [43, 46] },
    { main: [46, 49] }, { main: [49, 52] },
  ],

  // ── % grasa femenino ─────────────────────────────────────────────────────
  bodyFatFemale: [
    { main: [18, 22] }, { main: [22, 26] }, { main: [26, 29] }, { main: [29, 32] },
    { main: [32, 35] }, { main: [35, 38] },
    { main: [38, 41], low: [17.99, 15] }, { main: [41, 44], low: [15, 14] },
    { main: [44, 47], low: [14, 13] }, { main: [47, 50], low: [13, 12] },
    { main: [50, 53], low: [12, 11] }, { main: [53, 56], low: [11, 10] },
    { main: [56, 59], low: [10, 9] }, { main: [59, 62], low: [9, 8] },
  ],

  // ── % grasa femenino deportivo ───────────────────────────────────────────
  bodyFatFemaleAthlete: [
    { main: [1, 9] }, { main: [9, 18] }, { main: [18, 22] }, { main: [22, 25] },
    { main: [25, 27] }, { main: [27, 30] }, { main: [30, 33] }, { main: [33, 36] },
    { main: [36, 39] }, { main: [39, 42] }, { main: [42, 45] }, { main: [45, 48] },
    { main: [48, 51] }, { main: [51, 54] },
  ],

  // ── Índice de Masa Corporal (solo rango principal) ───────────────────────
  // Nota: el rango secundario (valores bajos) contiene una ambigüedad del
  // documento fuente y queda CONGELADO (§1.4). Se cubre aparte, como
  // caracterización del comportamiento actual.
  bmi: [
    { main: [18, 22] }, { main: [22, 25] }, { main: [25, 27] }, { main: [27, 30] },
    { main: [30, 33] }, { main: [33, 36] }, { main: [36, 39] }, { main: [39, 42] },
    { main: [42, 45] }, { main: [45, 48] }, { main: [48, 51] }, { main: [51, 54] },
    { main: [54, 57] }, { main: [57, 60] },
  ],

  // ── Reflejos digitales (cm) — inverso: más alto = más joven ──────────────
  reflexes: [
    { main: [50, 45] }, { main: [45, 35] }, { main: [35, 30] }, { main: [30, 25] },
    { main: [25, 20] }, { main: [20, 15] }, { main: [15, 10] }, { main: [10, 8] },
    { main: [8, 6] }, { main: [6, 4] }, { main: [4, 3] }, { main: [3, 2] },
    { main: [2, 1] }, { main: [1, 0] },
  ],

  // ── Acomodación visual (cm) ──────────────────────────────────────────────
  accommodation: [
    { main: [0, 10] }, { main: [10, 15] }, { main: [15, 18] }, { main: [18, 21] },
    { main: [21, 24] }, { main: [24, 27] }, { main: [27, 30] }, { main: [30, 33] },
    { main: [33, 37] }, { main: [37, 40] }, { main: [40, 43] }, { main: [43, 47] },
    { main: [47, 50] }, { main: [50, 53] },
  ],

  // ── Balance estático (seg) — inverso ─────────────────────────────────────
  balance: [
    { main: [120, 30] }, { main: [30, 25] }, { main: [25, 20] }, { main: [20, 15] },
    { main: [15, 12] }, { main: [12, 9] }, { main: [9, 7] }, { main: [7, 6] },
    { main: [6, 5] }, { main: [5, 4] }, { main: [4, 3] }, { main: [3, 2] },
    { main: [2, 1] }, { main: [1, 0] },
  ],

  // ── Hidratación cutánea (seg) ────────────────────────────────────────────
  hydration: [
    { main: [0, 1] }, { main: [1, 2] }, { main: [2, 4] }, { main: [4, 8] },
    { main: [8, 16] }, { main: [16, 32] }, { main: [32, 64] }, { main: [64, 74] },
    { main: [74, 84] }, { main: [84, 94] }, { main: [94, 104] }, { main: [104, 108] },
    { main: [108, 112] }, { main: [112, 120] },
  ],

  // ── Tensión arterial sistólica (mmHg) ────────────────────────────────────
  systolic: [
    { main: [100, 110] }, { main: [110, 120] },
    { main: [120, 130], low: [99.99, 95] }, { main: [130, 140], low: [95, 90] },
    { main: [140, 150], low: [90, 85] }, { main: [150, 160], low: [85, 80] },
    { main: [160, 170], low: [80, 75] }, { main: [170, 180], low: [75, 70] },
    { main: [180, 190], low: [70, 65] }, { main: [190, 200], low: [65, 60] },
    { main: [200, 210], low: [60, 55] }, { main: [210, 220], low: [55, 50] },
    { main: [220, 230], low: [50, 45] }, { main: [230, 240], low: [45, 40] },
  ],

  // ── Tensión arterial diastólica (mmHg) ───────────────────────────────────
  diastolic: [
    { main: [60, 65] }, { main: [65, 70] }, { main: [70, 75] }, { main: [75, 80] },
    { main: [80, 85] }, { main: [85, 90] },
    { main: [90, 95], low: [59.99, 57] }, { main: [95, 100], low: [57, 53] },
    { main: [100, 110], low: [53, 50] }, { main: [110, 120], low: [50, 47] },
    { main: [120, 130], low: [47, 44] }, { main: [130, 140], low: [44, 41] },
    { main: [140, 150], low: [41, 38] }, { main: [150, 160], low: [38, 35] },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// 2. ARNÉS DE PRUEBA
// ═══════════════════════════════════════════════════════════════════════════

/** Clave de la edad parcial que devuelve el motor para cada parámetro. */
type ClaveParcial =
  | 'fatAge' | 'bmiAge' | 'reflexesAge' | 'visualAge'
  | 'balanceAge' | 'hydrationAge' | 'systolicAge' | 'diastolicAge';

/**
 * Formulario base con todos los campos poblados en valores válidos.
 * Se usa como fondo neutro: cada prueba sobreescribe UN solo parámetro y lee
 * su edad parcial, de modo que los demás no interfieren.
 */
const FORM_BASE: FormValues = {
  fatPercentage: 12,
  bmi: 20,
  digitalReflexes: { high: 47, long: 47, width: 47 },
  visualAccommodation: 5,
  staticBalance: { high: 60, long: 60, width: 60 },
  skinHydration: 0.5,
  systolicPressure: 105,
  diastolicPressure: 62,
};

/** Construye un formulario con un único parámetro fijado al valor indicado. */
function formConValor(parametro: string, valor: number): FormValues {
  switch (parametro) {
    case 'bodyFatMale':
    case 'bodyFatMaleAthlete':
    case 'bodyFatFemale':
    case 'bodyFatFemaleAthlete':
      return { ...FORM_BASE, fatPercentage: valor };
    case 'bmi':
      return { ...FORM_BASE, bmi: valor };
    case 'reflexes':
      return { ...FORM_BASE, digitalReflexes: { high: valor, long: valor, width: valor } };
    case 'accommodation':
      return { ...FORM_BASE, visualAccommodation: valor };
    case 'balance':
      return { ...FORM_BASE, staticBalance: { high: valor, long: valor, width: valor } };
    case 'hydration':
      return { ...FORM_BASE, skinHydration: valor };
    case 'systolic':
      return { ...FORM_BASE, systolicPressure: valor };
    case 'diastolic':
      return { ...FORM_BASE, diastolicPressure: valor };
    default:
      throw new Error(`Parámetro desconocido: ${parametro}`);
  }
}

/** Género e indicador deportivo que corresponden a cada baremo de % grasa. */
const CONTEXTO: Record<string, { gender: string; isAthlete: boolean }> = {
  bodyFatMale: { gender: 'MASCULINO', isAthlete: false },
  bodyFatMaleAthlete: { gender: 'MASCULINO', isAthlete: true },
  bodyFatFemale: { gender: 'FEMENINO', isAthlete: false },
  bodyFatFemaleAthlete: { gender: 'FEMENINO', isAthlete: true },
};

const CLAVE: Record<string, ClaveParcial> = {
  bodyFatMale: 'fatAge',
  bodyFatMaleAthlete: 'fatAge',
  bodyFatFemale: 'fatAge',
  bodyFatFemaleAthlete: 'fatAge',
  bmi: 'bmiAge',
  reflexes: 'reflexesAge',
  accommodation: 'visualAge',
  balance: 'balanceAge',
  hydration: 'hydrationAge',
  systolic: 'systolicAge',
  diastolic: 'diastolicAge',
};

/**
 * Calcula la edad que el motor asigna a un valor de un parámetro concreto.
 * El género por defecto es MASCULINO no deportista, salvo que el parámetro
 * sea un baremo de % grasa con contexto propio.
 */
function edadDe(parametro: string, valor: number): number {
  const ctx = CONTEXTO[parametro] ?? { gender: 'MASCULINO', isAthlete: false };
  const resultado = calculateBiofisicaResults(
    [],
    formConValor(parametro, valor),
    40, // edad cronológica irrelevante para la edad parcial
    ctx.gender,
    ctx.isAthlete,
  );
  return resultado.partialAges[CLAVE[parametro]] as number;
}

/**
 * Devuelve dos puntos INTERIORES de una banda (25% y 75%).
 * Se evitan los extremos a propósito: en la tabla oficial el límite superior
 * de una banda coincide con el inferior de la siguiente, así que un extremo
 * es legítimamente ambiguo y no sirve como aserción.
 */
function puntosInteriores([a, b]: [number, number]): number[] {
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  const ancho = max - min;
  return [min + ancho * 0.25, min + ancho * 0.75];
}

/** Etiqueta legible de un septenio. */
const etiqueta = (i: number) => `${SEPTENIOS[i][0]}-${SEPTENIOS[i][1]}`;

// ═══════════════════════════════════════════════════════════════════════════
// 3. CERTIFICACIÓN CELDA POR CELDA (14 septenios × 8 parámetros)
// ═══════════════════════════════════════════════════════════════════════════

describe('Certificación de baremos oficiales — rango principal', () => {
  for (const [parametro, bandas] of Object.entries(TABLA_OFICIAL)) {
    describe(parametro, () => {
      bandas.forEach((banda, i) => {
        const [edadMin, edadMax] = SEPTENIOS[i];

        it(`${etiqueta(i)} · valores ${banda.main[0]}–${banda.main[1]} caen en el septenio`, () => {
          for (const valor of puntosInteriores(banda.main)) {
            const edad = edadDe(parametro, valor);
            expect(
              edad,
              `${parametro}=${valor} devolvió ${edad}, fuera de ${etiqueta(i)}`,
            ).toBeGreaterThanOrEqual(edadMin);
            expect(edad).toBeLessThanOrEqual(edadMax);
          }
        });
      });
    });
  }
});

describe('Certificación de baremos oficiales — doble umbral', () => {
  for (const [parametro, bandas] of Object.entries(TABLA_OFICIAL)) {
    const conDoble = bandas
      .map((banda, i) => ({ banda, i }))
      .filter(({ banda }) => banda.low !== undefined);

    if (conDoble.length === 0) continue;

    describe(parametro, () => {
      for (const { banda, i } of conDoble) {
        const [edadMin, edadMax] = SEPTENIOS[i];

        it(`${etiqueta(i)} · el rango bajo ${banda.low![0]}–${banda.low![1]} devuelve el mismo septenio`, () => {
          for (const valor of puntosInteriores(banda.low!)) {
            const edad = edadDe(parametro, valor);
            expect(
              edad,
              `${parametro}=${valor} (rango bajo) devolvió ${edad}, fuera de ${etiqueta(i)}`,
            ).toBeGreaterThanOrEqual(edadMin);
            expect(edad).toBeLessThanOrEqual(edadMax);
          }
        });
      }
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. VALORES DORADOS RATIFICADOS POR EL DUEÑO (§4.1 del Plan v2)
// ═══════════════════════════════════════════════════════════════════════════

describe('Valores dorados ratificados (§4.1)', () => {
  const casos: {
    nombre: string;
    parametro: string;
    banda: [number, number];
    septenio: number;
  }[] = [
    { nombre: '% grasa masculino 10–14 → 21-28', parametro: 'bodyFatMale', banda: [10, 14], septenio: 0 },
    { nombre: 'IMC 18–22 → 21-28', parametro: 'bmi', banda: [18, 22], septenio: 0 },
    { nombre: 'Reflejos digitales 35–30 → 35-42', parametro: 'reflexes', banda: [35, 30], septenio: 2 },
    { nombre: 'Balance estático 15–12 → 49-56', parametro: 'balance', banda: [15, 12], septenio: 4 },
    { nombre: 'Hidratación cutánea 32–64 → 63-70', parametro: 'hydration', banda: [32, 64], septenio: 6 },
    { nombre: 'Tensión sistólica 140–150 → 49-56', parametro: 'systolic', banda: [140, 150], septenio: 4 },
    { nombre: 'Tensión sistólica 90–85 (umbral bajo) → 49-56', parametro: 'systolic', banda: [90, 85], septenio: 4 },
    { nombre: '% grasa femenino 38–41 → 63-70', parametro: 'bodyFatFemale', banda: [38, 41], septenio: 6 },
    { nombre: '% grasa femenino 17.99–15 (umbral bajo) → 63-70', parametro: 'bodyFatFemale', banda: [17.99, 15], septenio: 6 },
    { nombre: 'Tensión diastólica 130–140 → 98-105', parametro: 'diastolic', banda: [130, 140], septenio: 11 },
    { nombre: 'Tensión diastólica 44–41 (umbral bajo) → 98-105', parametro: 'diastolic', banda: [44, 41], septenio: 11 },
  ];

  for (const { nombre, parametro, banda, septenio } of casos) {
    it(nombre, () => {
      const [edadMin, edadMax] = SEPTENIOS[septenio];
      for (const valor of puntosInteriores(banda)) {
        const edad = edadDe(parametro, valor);
        expect(edad).toBeGreaterThanOrEqual(edadMin);
        expect(edad).toBeLessThanOrEqual(edadMax);
      }
    });
  }

  it('los dobles umbrales devuelven exactamente el mismo septenio que su rango principal', () => {
    const pares: [string, [number, number], [number, number]][] = [
      ['systolic', [140, 150], [90, 85]],
      ['diastolic', [130, 140], [44, 41]],
      ['bodyFatFemale', [38, 41], [17.99, 15]],
    ];

    for (const [parametro, principal, bajo] of pares) {
      const edadPrincipal = edadDe(parametro, puntosInteriores(principal)[0]);
      const edadBaja = edadDe(parametro, puntosInteriores(bajo)[0]);
      const septenioDe = (edad: number) =>
        SEPTENIOS.findIndex(([min, max]) => edad >= min && edad <= max);

      expect(
        septenioDe(edadPrincipal),
        `${parametro}: principal→${edadPrincipal} vs bajo→${edadBaja}`,
      ).toBe(septenioDe(edadBaja));
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. EXTREMOS Y TOPE CLÍNICO (§1.5 — edad máxima 120)
// ═══════════════════════════════════════════════════════════════════════════

describe('Extremos y tope clínico', () => {
  const fueraDeRangoSuperior: [string, number][] = [
    ['bodyFatMale', 60],
    ['bmi', 70],
    ['accommodation', 120], // valor observado en consulta, muy por encima del máximo (53)
    ['hydration', 200],
    ['systolic', 260],
    ['diastolic', 200],
  ];

  for (const [parametro, valor] of fueraDeRangoSuperior) {
    it(`${parametro}=${valor} (sobre el máximo de la tabla) → 120 años`, () => {
      expect(edadDe(parametro, valor)).toBe(120);
    });
  }

  it('ningún parámetro puede superar los 120 años', () => {
    for (const [parametro, bandas] of Object.entries(TABLA_OFICIAL)) {
      for (const banda of bandas) {
        for (const valor of puntosInteriores(banda.main)) {
          expect(edadDe(parametro, valor)).toBeLessThanOrEqual(120);
        }
      }
    }
  });

  it('los parámetros inversos tratan el valor alto como el más joven', () => {
    // Reflejos y balance: a mayor valor, menor edad.
    expect(edadDe('reflexes', 48)).toBeLessThan(edadDe('reflexes', 1.5));
    expect(edadDe('balance', 100)).toBeLessThan(edadDe('balance', 1.5));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. PROMEDIO DE 8 PARÁMETROS (§1.1 — sin pulso en reposo)
// ═══════════════════════════════════════════════════════════════════════════

describe('Composición de la edad biofísica', () => {
  it('promedia exactamente los 8 baremos entre 8', () => {
    const resultado = calculateBiofisicaResults([], FORM_BASE, 40, 'MASCULINO', false);
    const parciales = Object.values(resultado.partialAges) as number[];

    expect(parciales).toHaveLength(8);

    const promedioEsperado = Math.round(
      parciales.reduce((suma, edad) => suma + edad, 0) / 8,
    );
    expect(resultado.biologicalAge).toBe(promedioEsperado);
  });

  it('el diferencial es edad biofísica menos edad cronológica', () => {
    const cronologica = 52;
    const resultado = calculateBiofisicaResults([], FORM_BASE, cronologica, 'MASCULINO', false);
    expect(resultado.differentialAge).toBe(resultado.biologicalAge - cronologica);
  });

  it('el motor no expone ningún parámetro de pulso en reposo (§1.1)', () => {
    const resultado = calculateBiofisicaResults([], FORM_BASE, 40, 'MASCULINO', false);
    const claves = Object.keys(resultado.partialAges);
    expect(claves.some((k) => /pulse|pulso/i.test(k))).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. CARACTERIZACIÓN DE AMBIGÜEDADES CONGELADAS (§1.4)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ⚠️ ESTOS TESTS NO DECLARAN LO QUE ES CLÍNICAMENTE CORRECTO.
 *
 * El rango secundario del IMC contiene una discontinuidad en el documento
 * fuente (salta de 15-14 a 13-12, sin cubrir 14-13). El código actual cerró
 * ese hueco desplazando los tramos siguientes. Esa decisión queda CONGELADA
 * a la espera de ratificación clínica (§1.4).
 *
 * Estos tests fijan el comportamiento ACTUAL para que cualquier cambio
 * accidental sea visible de inmediato. Cuando el dueño ratifique el criterio
 * definitivo, se actualizan y se mueven a la sección 3.
 */
describe('Caracterización — ambigüedades congeladas, pendientes de ratificación (§1.4)', () => {
  // [valor de IMC, edad que devuelve el motor HOY] — valores MEDIDOS contra el
  // código actual, no derivados de la tabla. Sirven de línea base de no regresión.
  const casosIMC: [number, number][] = [
    [17, 74],
    [15.5, 81],
    [14.5, 88],
    [13.5, 95],
    [12.5, 102],
    [11.5, 109],
    [10.5, 116],
    [9.5, 120], // por debajo del umbral inferior del código (10) → tope clínico
  ];

  for (const [valor, edadActual] of casosIMC) {
    it(`IMC=${valor} → ${edadActual} años (comportamiento actual, NO ratificado)`, () => {
      expect(edadDe('bmi', valor)).toBe(edadActual);
    });
  }
});
