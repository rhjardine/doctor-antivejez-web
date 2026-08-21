/**
 * decimal-input.test.ts — Regresión del hotfix P0 de coma decimal.
 *
 * El fallo reportado: al escribir un valor con coma («21,3»), el campo se
 * quedaba en blanco y el test biofísico no se calculaba.
 */

import { describe, expect, it } from 'vitest';
import { formatDecimalInput, parseDecimalInput } from './decimal-input';

describe('parseDecimalInput — el fallo reportado', () => {
  it('acepta la coma decimal (caso que dejaba el campo en blanco)', () => {
    expect(parseDecimalInput('21,3')).toBe(21.3);
    expect(parseDecimalInput('12,5')).toBe(12.5);
    expect(parseDecimalInput('0,5')).toBe(0.5);
  });

  it('sigue aceptando el punto decimal', () => {
    expect(parseDecimalInput('21.3')).toBe(21.3);
    expect(parseDecimalInput('120')).toBe(120);
  });

  it('interpreta punto como millares cuando conviven ambos separadores', () => {
    expect(parseDecimalInput('1.234,5')).toBe(1234.5);
  });
});

describe('parseDecimalInput — valores clínicos reales del baremo', () => {
  const casos: [string, number][] = [
    ['12', 12],       // % grasa
    ['21,3', 21.3],   // IMC
    ['9,5', 9.5],     // IMC bajo
    ['120', 120],     // TA sistólica
    ['62', 62],       // TA diastólica
    ['17,99', 17.99], // umbral doble del baremo
    ['99,99', 99.99],
  ];

  for (const [texto, esperado] of casos) {
    it(`«${texto}» → ${esperado}`, () => {
      expect(parseDecimalInput(texto)).toBe(esperado);
    });
  }
});

describe('parseDecimalInput — entradas no numéricas', () => {
  it('devuelve undefined para texto vacío', () => {
    expect(parseDecimalInput('')).toBeUndefined();
    expect(parseDecimalInput('   ')).toBeUndefined();
  });

  it('devuelve undefined para null o undefined', () => {
    expect(parseDecimalInput(null)).toBeUndefined();
    expect(parseDecimalInput(undefined)).toBeUndefined();
  });

  it('devuelve undefined para texto sin valor numérico', () => {
    expect(parseDecimalInput('abc')).toBeUndefined();
    expect(parseDecimalInput('-')).toBeUndefined();
    expect(parseDecimalInput('.')).toBeUndefined();
    expect(parseDecimalInput(',')).toBeUndefined();
    expect(parseDecimalInput('1,2,3')).toBeUndefined();
  });

  it('NUNCA devuelve NaN — el motor de cálculo no debe recibir NaN', () => {
    for (const entrada of ['abc', '-', '.', ',', '1,2,3', '', '   ', 'e', '1e']) {
      const r = parseDecimalInput(entrada);
      expect(r === undefined || Number.isFinite(r)).toBe(true);
    }
  });

  it('tolera estados intermedios de tecleo sin romperse', () => {
    // El componente conserva el texto crudo; aquí solo se comprueba que el
    // parseo no produce valores basura mientras el médico escribe.
    expect(parseDecimalInput('21')).toBe(21);
    expect(parseDecimalInput('21,')).toBe(21);
    expect(parseDecimalInput('21.')).toBe(21);
  });
});

describe('formatDecimalInput', () => {
  it('muestra vacío para valores ausentes', () => {
    expect(formatDecimalInput(undefined)).toBe('');
    expect(formatDecimalInput(null)).toBe('');
    expect(formatDecimalInput(NaN)).toBe('');
  });

  it('muestra el número tal cual', () => {
    expect(formatDecimalInput(21.3)).toBe('21.3');
    expect(formatDecimalInput(120)).toBe('120');
    expect(formatDecimalInput(0)).toBe('0');
  });

  it('ida y vuelta: lo formateado se vuelve a parsear igual', () => {
    for (const v of [12, 21.3, 0.5, 120, 17.99]) {
      expect(parseDecimalInput(formatDecimalInput(v))).toBe(v);
    }
  });
});
