import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  extraerTerminos,
  terminosParaPrompt,
  TERMINOS_SESGO_PRIORITARIO,
  RUTA_CATALOGO,
} from './lexicon-extractor';
import lexicoJson from './clinical-lexicon.generated.json';
import { TERMINOS_CATALOGO } from './clinical-lexicon.generated';

const ORIGEN = path.resolve(process.cwd(), RUTA_CATALOGO);

describe('léxico clínico generado', () => {
  it('está sincronizado con el catálogo de la Guía', () => {
    // Si este test falla, el catálogo cambió: regenerar con
    // `npm run voz:lexico` y revisar el diff.
    const esperado = extraerTerminos(readFileSync(ORIGEN, 'utf8'));
    expect(TERMINOS_CATALOGO).toEqual(esperado);
  });

  it('contiene los productos propios del vademécum, que son los que más fallan al dictar', () => {
    for (const termino of ['MegaGH4', 'StemCell Enhancer', 'Transfer Tri Factor', 'Telomeros', 'Oligocell']) {
      expect(TERMINOS_CATALOGO).toContain(termino);
    }
  });

  it('no contiene entradas vacías ni duplicadas', () => {
    expect(TERMINOS_CATALOGO.filter((t) => t.trim() === '')).toEqual([]);
    expect(new Set(TERMINOS_CATALOGO).size).toBe(TERMINOS_CATALOGO.length);
  });
});

describe('sesgo de vocabulario para Whisper', () => {
  it('el JSON está sincronizado con el TypeScript: mismo vademécum para medir y para sesgar', () => {
    // Si divergieran, el transcriptor se sesgaría hacia un vocabulario y el
    // medidor evaluaría contra otro. Las cifras de B1 dejarían de significar nada.
    expect(lexicoJson.terminos).toEqual([...TERMINOS_CATALOGO]);
  });

  it('el sesgo cabe en el presupuesto de initial_prompt', () => {
    const largo = lexicoJson.prompt.join(', ').length;
    expect(largo).toBeLessThanOrEqual(700);
  });

  it('incluye los nombres de producto que un modelo genérico falla', () => {
    for (const t of [
      'MegaGH4',
      'StemCell Enhancer',
      'Transfer Tri Factor',
      'Exosoma Serum',
      'Telomeros',
      'Oligocell',
    ]) {
      expect(lexicoJson.prompt).toContain(t);
    }
  });

  it('los prioritarios van primero, por delante del heurístico', () => {
    const cabeza = lexicoJson.prompt.slice(0, TERMINOS_SESGO_PRIORITARIO.length);
    expect([...cabeza].sort()).toEqual([...TERMINOS_SESGO_PRIORITARIO].sort());
  });

  it('todo término del sesgo existe en el catálogo: no se inventa vademécum', () => {
    const inventados = lexicoJson.prompt.filter((t) => !TERMINOS_CATALOGO.includes(t));
    expect(inventados).toEqual([]);
  });

  it('con presupuesto cero no devuelve nada, en vez de reventar', () => {
    expect(terminosParaPrompt(TERMINOS_CATALOGO, 0)).toEqual([]);
  });
});
