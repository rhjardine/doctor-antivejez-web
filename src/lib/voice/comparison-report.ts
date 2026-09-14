// Agregación de la evaluación comparativa de proveedores de transcripción (B1).
//
// No llama a ningún proveedor: recibe transcripciones ya obtenidas y las puntúa.
// Esa separación es deliberada — la grabación y el envío al proveedor ocurren
// fuera, bajo control humano y con el consentimiento correspondiente; aquí solo
// se mide. Así la evaluación es reproducible y auditable sin claves ni red.

import { evaluarTranscripcion, type TerminoClinico, type ResultadoEvaluacion } from './term-accuracy';

export interface TranscripcionProveedor {
  texto: string;
  /** Latencia extremo a extremo del proveedor, en milisegundos. */
  latenciaMs?: number;
  /** Coste facturado por este dictado, en USD. */
  costeUsd?: number;
}

export interface Dictado {
  id: string;
  /** Transcripción humana de referencia (verdad de campo). */
  referencia: string;
  /** Términos del vademécum que el médico declara haber dictado. */
  terminosEsperados: TerminoClinico[];
  duracionSegundos: number;
  /** Clave = nombre del proveedor. */
  transcripciones: Record<string, TranscripcionProveedor>;
}

export interface ManifiestoEvaluacion {
  dictados: Dictado[];
}

export interface ResumenProveedor {
  proveedor: string;
  dictadosEvaluados: number;
  /** Métrica que decide: términos clínicos recuperados / términos dictados, sobre todo el corpus. */
  recallClinico: number;
  /** WER global promedio ponderado por palabras de referencia. Contexto. */
  werGlobal: number;
  exactos: number;
  porAlias: number;
  aproximados: number;
  perdidos: number;
  /** Mediana de latencia; mediana y no media porque un timeout aislado no debe dominar. */
  latenciaMedianaMs?: number;
  costeUsdPorMinuto?: number;
  /** Términos perdidos o deformados, del más frecuente al menos. El dato accionable. */
  terminosProblematicos: { termino: string; fallos: number }[];
}

function mediana(valores: number[]): number | undefined {
  if (valores.length === 0) return undefined;
  const ord = [...valores].sort((a, b) => a - b);
  const medio = Math.floor(ord.length / 2);
  return ord.length % 2 === 1 ? ord[medio] : (ord[medio - 1] + ord[medio]) / 2;
}

/** Nombres de proveedor presentes en el manifiesto, en orden estable. */
export function proveedoresDe(manifiesto: ManifiestoEvaluacion): string[] {
  const vistos = new Set<string>();
  for (const d of manifiesto.dictados) {
    for (const p of Object.keys(d.transcripciones)) vistos.add(p);
  }
  return Array.from(vistos).sort();
}

export function evaluarProveedor(
  manifiesto: ManifiestoEvaluacion,
  proveedor: string
): ResumenProveedor {
  const latencias: number[] = [];
  let costeTotal = 0;
  let segundosConCoste = 0;
  let palabrasReferencia = 0;
  let erroresPonderados = 0;
  const acumulado = { exactos: 0, porAlias: 0, aproximados: 0, perdidos: 0, total: 0 };
  const fallosPorTermino = new Map<string, number>();
  let dictadosEvaluados = 0;

  for (const d of manifiesto.dictados) {
    const t = d.transcripciones[proveedor];
    // Un dictado que el proveedor no procesó no se puntúa como cero: se excluye
    // y se refleja en dictadosEvaluados. Inventar un cero falsearía la comparación.
    if (!t) continue;
    dictadosEvaluados++;

    const r: ResultadoEvaluacion = evaluarTranscripcion(d.referencia, t.texto, d.terminosEsperados);

    const palabras = d.referencia.trim() === '' ? 0 : d.referencia.trim().split(/\s+/).length;
    palabrasReferencia += palabras;
    erroresPonderados += r.werGlobal * palabras;

    acumulado.exactos += r.exactos;
    acumulado.porAlias += r.porAlias;
    acumulado.aproximados += r.aproximados;
    acumulado.perdidos += r.perdidos;
    acumulado.total += r.totalTerminos;

    for (const h of r.hallazgos) {
      if (h.estado === 'aproximado' || h.estado === 'perdido') {
        fallosPorTermino.set(h.termino, (fallosPorTermino.get(h.termino) ?? 0) + 1);
      }
    }

    if (typeof t.latenciaMs === 'number') latencias.push(t.latenciaMs);
    if (typeof t.costeUsd === 'number') {
      costeTotal += t.costeUsd;
      segundosConCoste += d.duracionSegundos;
    }
  }

  return {
    proveedor,
    dictadosEvaluados,
    recallClinico: acumulado.total === 0 ? 1 : (acumulado.exactos + acumulado.porAlias) / acumulado.total,
    werGlobal: palabrasReferencia === 0 ? 0 : erroresPonderados / palabrasReferencia,
    exactos: acumulado.exactos,
    porAlias: acumulado.porAlias,
    aproximados: acumulado.aproximados,
    perdidos: acumulado.perdidos,
    latenciaMedianaMs: mediana(latencias),
    costeUsdPorMinuto: segundosConCoste === 0 ? undefined : (costeTotal / segundosConCoste) * 60,
    terminosProblematicos: Array.from(fallosPorTermino.entries())
      .map(([termino, fallos]) => ({ termino, fallos }))
      .sort((a, b) => b.fallos - a.fallos || a.termino.localeCompare(b.termino, 'es')),
  };
}

/** Evalúa todos los proveedores, ordenados por recall clínico descendente. */
export function compararProveedores(manifiesto: ManifiestoEvaluacion): ResumenProveedor[] {
  return proveedoresDe(manifiesto)
    .map((p) => evaluarProveedor(manifiesto, p))
    .sort((a, b) => b.recallClinico - a.recallClinico || a.proveedor.localeCompare(b.proveedor));
}

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

/** Tabla Markdown lista para pegar en el informe de decisión. */
export function formatearTablaComparativa(resumenes: ResumenProveedor[]): string {
  const cabecera =
    '| Proveedor | Recall clínico | WER global | Exactos | Alias | Aprox. | Perdidos | Latencia mediana | USD/min |\n' +
    '|---|---|---|---|---|---|---|---|---|';
  const filas = resumenes.map((r) =>
    [
      r.proveedor,
      pct(r.recallClinico),
      pct(r.werGlobal),
      r.exactos,
      r.porAlias,
      r.aproximados,
      r.perdidos,
      r.latenciaMedianaMs === undefined ? '—' : `${Math.round(r.latenciaMedianaMs)} ms`,
      r.costeUsdPorMinuto === undefined ? '—' : `$${r.costeUsdPorMinuto.toFixed(4)}`,
    ].join(' | ')
  );
  return [cabecera, ...filas.map((f) => `| ${f} |`)].join('\n');
}

/** Términos que cada proveedor no logra recuperar. Lo que se corrige con alias o se descarta. */
export function formatearTerminosProblematicos(resumenes: ResumenProveedor[], tope = 10): string {
  return resumenes
    .map((r) => {
      const lista = r.terminosProblematicos.slice(0, tope);
      if (lista.length === 0) return `### ${r.proveedor}\n\nSin términos fallidos.`;
      return (
        `### ${r.proveedor}\n\n` +
        lista.map((t) => `- \`${t.termino}\` — ${t.fallos} fallo(s)`).join('\n')
      );
    })
    .join('\n\n');
}
