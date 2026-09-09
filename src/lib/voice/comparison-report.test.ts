import { describe, it, expect } from 'vitest';
import {
  compararProveedores,
  evaluarProveedor,
  proveedoresDe,
  formatearTablaComparativa,
  formatearTerminosProblematicos,
  type ManifiestoEvaluacion,
} from './comparison-report';

const manifiesto: ManifiestoEvaluacion = {
  dictados: [
    {
      id: 'd01',
      referencia: 'Indicar MegaGH4 y Plasma Marino en ayunas',
      terminosEsperados: [{ termino: 'MegaGH4' }, { termino: 'Plasma Marino' }],
      duracionSegundos: 30,
      transcripciones: {
        perfecto: { texto: 'indicar megagh4 y plasma marino en ayunas', latenciaMs: 1000, costeUsd: 0.003 },
        parcial: { texto: 'indicar mega gh 4 y plasma marino en ayunas', latenciaMs: 3000, costeUsd: 0.001 },
      },
    },
    {
      id: 'd02',
      referencia: 'Agregar Transfer Tri Factor dos veces por semana',
      terminosEsperados: [{ termino: 'Transfer Tri Factor' }],
      duracionSegundos: 30,
      transcripciones: {
        perfecto: { texto: 'agregar transfer tri factor dos veces por semana', latenciaMs: 1200, costeUsd: 0.003 },
        parcial: { texto: 'agregar transferencia de factores dos veces por semana', latenciaMs: 2000, costeUsd: 0.001 },
      },
    },
  ],
};

describe('proveedoresDe', () => {
  it('recoge todos los proveedores del manifiesto, ordenados', () => {
    expect(proveedoresDe(manifiesto)).toEqual(['parcial', 'perfecto']);
  });

  it('un manifiesto vacío no tiene proveedores', () => {
    expect(proveedoresDe({ dictados: [] })).toEqual([]);
  });
});

describe('evaluarProveedor', () => {
  it('un proveedor que recupera todo tiene recall 1 y WER 0', () => {
    const r = evaluarProveedor(manifiesto, 'perfecto');
    expect(r.dictadosEvaluados).toBe(2);
    expect(r.recallClinico).toBe(1);
    expect(r.werGlobal).toBe(0);
    expect(r.exactos).toBe(3);
    expect(r.terminosProblematicos).toEqual([]);
  });

  it('los términos fallidos quedan listados, que es el dato accionable', () => {
    const r = evaluarProveedor(manifiesto, 'parcial');
    expect(r.recallClinico).toBeCloseTo(1 / 3);
    const fallidos = r.terminosProblematicos.map((t) => t.termino).sort();
    expect(fallidos).toEqual(['MegaGH4', 'Transfer Tri Factor']);
  });

  it('coste por minuto se calcula solo sobre los dictados con coste declarado', () => {
    // perfecto: 0,006 USD en 60 s → 0,006 USD/min
    expect(evaluarProveedor(manifiesto, 'perfecto').costeUsdPorMinuto).toBeCloseTo(0.006);
  });

  it('la latencia usa mediana, no media', () => {
    const conAtipico: ManifiestoEvaluacion = {
      dictados: [
        { ...manifiesto.dictados[0], transcripciones: { p: { texto: '', latenciaMs: 1000 } } },
        { ...manifiesto.dictados[1], transcripciones: { p: { texto: '', latenciaMs: 2000 } } },
        { ...manifiesto.dictados[1], id: 'd03', transcripciones: { p: { texto: '', latenciaMs: 60000 } } },
      ],
    };
    expect(evaluarProveedor(conAtipico, 'p').latenciaMedianaMs).toBe(2000);
  });

  it('un dictado que el proveedor no procesó se excluye, no se puntúa como cero', () => {
    const parcialmenteCubierto: ManifiestoEvaluacion = {
      dictados: [
        manifiesto.dictados[0],
        { ...manifiesto.dictados[1], transcripciones: {} },
      ],
    };
    const r = evaluarProveedor(parcialmenteCubierto, 'perfecto');
    expect(r.dictadosEvaluados).toBe(1);
    expect(r.recallClinico).toBe(1);
  });

  it('un proveedor ausente del manifiesto no rompe: cero dictados evaluados', () => {
    const r = evaluarProveedor(manifiesto, 'inexistente');
    expect(r.dictadosEvaluados).toBe(0);
    expect(r.latenciaMedianaMs).toBeUndefined();
    expect(r.costeUsdPorMinuto).toBeUndefined();
  });
});

describe('compararProveedores', () => {
  it('ordena por recall clínico descendente', () => {
    const r = compararProveedores(manifiesto);
    expect(r.map((x) => x.proveedor)).toEqual(['perfecto', 'parcial']);
    expect(r[0].recallClinico).toBeGreaterThan(r[1].recallClinico);
  });

  it('el más barato y rápido no gana si pierde términos clínicos', () => {
    const [ganador, otro] = compararProveedores(manifiesto);
    expect(ganador.proveedor).toBe('perfecto');
    expect(otro.costeUsdPorMinuto!).toBeLessThan(ganador.costeUsdPorMinuto!);
  });
});

describe('formato del informe', () => {
  it('la tabla incluye cabecera y una fila por proveedor', () => {
    const tabla = formatearTablaComparativa(compararProveedores(manifiesto));
    const lineas = tabla.split('\n');
    expect(lineas).toHaveLength(4);
    expect(lineas[0]).toContain('Recall clínico');
    expect(lineas[2]).toContain('perfecto');
    expect(lineas[2]).toContain('100.0%');
  });

  it('los términos problemáticos se listan por proveedor', () => {
    const texto = formatearTerminosProblematicos(compararProveedores(manifiesto));
    expect(texto).toContain('### perfecto');
    expect(texto).toContain('Sin términos fallidos');
    expect(texto).toContain('`Transfer Tri Factor`');
  });
});
