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
