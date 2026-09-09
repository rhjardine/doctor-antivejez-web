import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { extraerTerminos, RUTA_CATALOGO } from './lexicon-extractor';
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
