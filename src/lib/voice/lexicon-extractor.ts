// Extracción del vademécum desde el catálogo de la Guía del Paciente.
//
// El léxico no se escribe a mano: se deriva de la única fuente que el médico ya
// usa. Módulo puro y sin efectos — el script de generación es quien escribe.

/** Ruta del catálogo, única fuente de verdad del vademécum. */
export const RUTA_CATALOGO = 'src/components/patient-guide/PatientGuide.tsx';

/**
 * Devuelve los términos del vademécum presentes en el código del catálogo,
 * deduplicados y ordenados alfabéticamente en español.
 */
export function extraerTerminos(fuente: string): string[] {
  const nombres = Array.from(fuente.matchAll(/\bname:\s*'((?:[^'\\]|\\.)*)'/g)).map((m) =>
    m[1].replace(/\\'/g, "'")
  );

  const terminos = new Set<string>();
  for (const nombre of nombres) {
    // 'MegaGH4 (Fórmula Antienvejecimiento)' → el término clínico es 'MegaGH4';
    // el paréntesis es descripción para el paciente, no algo que el médico dicte.
    const base = nombre.split(' (')[0].trim();
    // Las frases largas del catálogo son instrucciones ("Cambiar o cubrir
    // amalgamas por resina fotocurable"), no términos de vademécum.
    if (base.length < 2 || base.split(/\s+/).length > 5) continue;
    terminos.add(base);
  }
  return Array.from(terminos).sort((a, b) => a.localeCompare(b, 'es'));
}

/**
 * Términos de mayor valor para sesgar el decodificador de Whisper.
 *
 * `initial_prompt` tiene un presupuesto de ~224 tokens: los 162 términos no
 * caben. Se priorizan los nombres propios de producto, que es donde un modelo
 * genérico falla siempre; las palabras del castellano corriente ("Colágeno",
 * "Magnesio") las acierta sin ayuda y gastarían presupuesto en balde.
 */
/**
 * Términos que van al sesgo SIEMPRE, por delante de cualquier heurístico.
 *
 * Esta lista es el punto de realimentación de la evaluación B1: cuando la
 * medición revele que el transcriptor pierde un término de forma sistemática,
 * se añade aquí. Empieza con dos que el heurístico no detecta —no llevan
 * dígitos ni mayúscula interna— y que aun así un modelo genérico erra:
 * "Telomeros" lo escribe "telómeros" y "Oligocell" lo parte en "oligo cell".
 *
 * Sólo se incluyen si existen en el catálogo: esta lista no inventa vademécum.
 */
export const TERMINOS_SESGO_PRIORITARIO: readonly string[] = [
  'Telomeros',
  'Oligocell',
];

export function terminosParaPrompt(
  terminos: readonly string[],
  presupuestoCaracteres = 700
): string[] {
  // Un término "difícil" lleva dígitos, mayúscula interna o una palabra inglesa
  // del vademécum: MegaGH4, StemCell Enhancer, Transfer Tri Factor, MEL 13.
  const dificil = (t: string) =>
    /[0-9]/.test(t) ||
    /[a-z][A-Z]/.test(t) ||
    /(Enhancer|Factor|Serum|Booster|Spray|Cell|Stem|Shot|Mask|Body|Foot|Oils|Remedy)/.test(t);

  // Tres niveles, en orden: prioritarios medidos → difíciles por forma → resto.
  // Dentro de cada nivel se conserva el orden de entrada, para que el resultado
  // sea estable y el diff del archivo generado sea legible.
  const nivel = (t: string) => {
    if (TERMINOS_SESGO_PRIORITARIO.includes(t)) return 0;
    return dificil(t) ? 1 : 2;
  };

  const ordenados = terminos
    .map((t, i) => ({ t, i, n: nivel(t) }))
    .sort((a, b) => a.n - b.n || a.i - b.i)
    .map((x) => x.t);

  const elegidos: string[] = [];
  let usado = 0;
  for (const t of ordenados) {
    const coste = t.length + 2; // el término más ", "
    if (usado + coste > presupuestoCaracteres) break;
    elegidos.push(t);
    usado += coste;
  }
  return elegidos;
}

/** Serializa el léxico al contenido del archivo generado. */
export function renderizarModulo(terminos: readonly string[]): string {
  const cabecera = `// ARCHIVO GENERADO — no editar a mano.
// Fuente: ${RUTA_CATALOGO}
// Regenerar: npm run voz:lexico
// Sincronía verificada en src/lib/voice/clinical-lexicon.test.ts (falla si diverge).

/** Términos del vademécum tal como aparecen en el catálogo de la Guía. */
export const TERMINOS_CATALOGO: readonly string[] = [
`;
  return `${cabecera}${terminos.map((t) => `  ${JSON.stringify(t)},`).join('\n')}\n];\n`;
}
