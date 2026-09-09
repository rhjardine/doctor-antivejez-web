import { describe, it, expect } from 'vitest';
import {
  normalizar,
  calcularWer,
  distanciaEdicion,
  evaluarTermino,
  evaluarTranscripcion,
  UMBRAL_APROXIMADO,
} from './term-accuracy';
import { TERMINOS_CATALOGO } from './clinical-lexicon.generated';

describe('normalizar', () => {
  it('quita tildes, mayúsculas y puntuación', () => {
    expect(normalizar('Detoxificación Alcalina.')).toBe('detoxificacion alcalina');
    expect(normalizar('Vit C c/Zinc')).toBe('vit c c zinc');
    expect(normalizar('  Aloe   Vera  ')).toBe('aloe vera');
  });

  it('conserva los dígitos, que son parte del nombre del producto', () => {
    expect(normalizar('MegaGH4')).toBe('megagh4');
    expect(normalizar('Omega 3')).toBe('omega 3');
    expect(normalizar('Protector Solar MEL 13')).toBe('protector solar mel 13');
  });

  it('la cadena vacía se normaliza a vacío', () => {
    expect(normalizar('')).toBe('');
    expect(normalizar('   ')).toBe('');
    expect(normalizar('...')).toBe('');
  });
});

describe('distanciaEdicion', () => {
  it('es 0 para secuencias idénticas', () => {
    expect(distanciaEdicion(['a', 'b'], ['a', 'b'])).toBe(0);
  });

  it('cuenta sustitución, inserción y omisión como 1 cada una', () => {
    expect(distanciaEdicion(['a', 'b'], ['a', 'c'])).toBe(1);
    expect(distanciaEdicion(['a'], ['a', 'b'])).toBe(1);
    expect(distanciaEdicion(['a', 'b'], ['a'])).toBe(1);
  });

  it('contra una secuencia vacía es la longitud de la otra', () => {
    expect(distanciaEdicion([], ['a', 'b', 'c'])).toBe(3);
    expect(distanciaEdicion(['a', 'b'], [])).toBe(2);
  });
});

describe('calcularWer', () => {
  it('es 0 cuando la transcripción coincide salvo tildes y puntuación', () => {
    expect(calcularWer('Indicar Detoxificación Alcalina', 'indicar detoxificacion alcalina.')).toBe(0);
  });

  it('una palabra errada de cuatro da 0,25', () => {
    expect(calcularWer('tomar dos veces al dia', 'tomar tres veces al dia')).toBeCloseTo(1 / 5);
  });

  it('referencia vacía: 0 si la hipótesis también lo está, 1 si no', () => {
    expect(calcularWer('', '')).toBe(0);
    expect(calcularWer('', 'ruido')).toBe(1);
  });

  it('transcripción vacía de una referencia real es 1', () => {
    expect(calcularWer('tomar dos veces', '')).toBe(1);
  });
});

describe('evaluarTermino', () => {
  it('reconoce el término aunque cambie el caso y las tildes', () => {
    const h = evaluarTermino({ termino: 'Detoxificación Alcalina' }, 'le indico detoxificacion alcalina por diez dias');
    expect(h.estado).toBe('exacto');
    expect(h.similitud).toBe(1);
  });

  it('un término ausente se marca perdido, sin fragmento', () => {
    const h = evaluarTermino({ termino: 'Transfer Tri Factor' }, 'tomar agua mineral en ayunas');
    expect(h.estado).toBe('perdido');
    expect(h.encontrado).toBe('');
  });

  it('acepta como acierto una variante hablada declarada en alias', () => {
    const h = evaluarTermino(
      { termino: 'MegaGH4', alias: ['mega ge hache cuatro'] },
      'agregamos mega ge hache cuatro en ayunas'
    );
    expect(h.estado).toBe('alias');
  });

  it('un casi-acierto NO cuenta como acierto: se clasifica aproximado', () => {
    const h = evaluarTermino({ termino: 'StemCell Enhancer' }, 'indicar stemcell enhancerr todas las noches');
    expect(h.estado).toBe('aproximado');
    expect(h.similitud).toBeLessThan(1);
    expect(h.similitud).toBeGreaterThanOrEqual(UMBRAL_APROXIMADO);
  });

  it('un producto distinto del vademécum no se confunde con el esperado', () => {
    const h = evaluarTermino({ termino: 'Inmuno Estimulante' }, 'le pauto inmuno modulador dos veces por semana');
    expect(h.estado).not.toBe('exacto');
    expect(h.estado).not.toBe('alias');
  });

  it('sin hipótesis, todo término está perdido', () => {
    expect(evaluarTermino({ termino: 'Oligocell' }, '').estado).toBe('perdido');
  });
});

describe('evaluarTranscripcion', () => {
  const esperados = [
    { termino: 'MegaGH4' },
    { termino: 'Transfer Tri Factor' },
    { termino: 'Plasma Marino' },
  ];

  it('recall clínico 1 cuando se recuperan todos los términos', () => {
    const r = evaluarTranscripcion(
      'Indicar MegaGH4 y Transfer Tri Factor, más Plasma Marino en ayunas',
      'indicar megagh4 y transfer tri factor mas plasma marino en ayunas',
      esperados
    );
    expect(r.recallClinico).toBe(1);
    expect(r.exactos).toBe(3);
    expect(r.perdidos).toBe(0);
    expect(r.werGlobal).toBe(0);
  });

  it('el WER global puede ser bajo mientras el recall clínico se hunde: por eso se mide aparte', () => {
    const r = evaluarTranscripcion(
      'Indicar MegaGH4 y Transfer Tri Factor, más Plasma Marino en ayunas',
      'indicar megagh4 y transferencia de factores mas plasma marino en ayunas',
      esperados
    );
    expect(r.werGlobal).toBeLessThan(0.35);
    expect(r.recallClinico).toBeCloseTo(2 / 3);
    expect(r.hallazgos.find((h) => h.termino === 'Transfer Tri Factor')!.estado).not.toBe('exacto');
  });

  it('los aproximados no suman al recall, pero quedan visibles para diagnóstico', () => {
    const r = evaluarTranscripcion(
      'Indicar StemCell Enhancer',
      'indicar stemcell enhancerr',
      [{ termino: 'StemCell Enhancer' }]
    );
    expect(r.aproximados).toBe(1);
    expect(r.exactos).toBe(0);
    expect(r.recallClinico).toBe(0);
  });

  it('los cuatro estados suman siempre el total de términos', () => {
    const r = evaluarTranscripcion(
      'MegaGH4 Transfer Tri Factor Plasma Marino',
      'megagh4 transferencia stemcell enhancerr',
      esperados
    );
    expect(r.exactos + r.porAlias + r.aproximados + r.perdidos).toBe(r.totalTerminos);
    expect(r.totalTerminos).toBe(3);
  });

  it('sin términos esperados el recall es 1 por convención (nada que perder)', () => {
    const r = evaluarTranscripcion('hola', 'hola', []);
    expect(r.recallClinico).toBe(1);
    expect(r.totalTerminos).toBe(0);
  });
});

describe('léxico contra el catálogo real', () => {
  it('cada término del vademécum se reconoce a sí mismo', () => {
    const fallos = TERMINOS_CATALOGO.filter(
      (t) => evaluarTermino({ termino: t }, `se indica ${t} al paciente`).estado !== 'exacto'
    );
    expect(fallos).toEqual([]);
  });

  it('ningún término del catálogo se confunde con otro por casualidad', () => {
    // Cada término se busca en una frase que contiene a OTRO término distinto.
    // Si el emparejamiento devolviera "exacto", el medidor estaría inflando.
    const otro = (i: number) => TERMINOS_CATALOGO[(i + 1) % TERMINOS_CATALOGO.length];
    const falsosPositivos = TERMINOS_CATALOGO.filter((t, i) => {
      const frase = `se indica ${otro(i)} al paciente`;
      return t !== otro(i) && evaluarTermino({ termino: t }, frase).estado === 'exacto';
    });
    expect(falsosPositivos).toEqual([]);
  });
});
