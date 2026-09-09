// Medición de precisión de transcripción orientada a terminología clínica.
//
// Por qué no basta el WER global: en un dictado de 60 palabras, fallar
// "Transfer Tri Factor" y acertar el resto da un WER ~5% —aparentemente
// excelente— mientras el dato clínico que importa quedó mal. La métrica que
// decide es cuántos términos del vademécum se recuperan íntegros.
//
// Un casi-acierto NO cuenta como acierto: "Mega GH cuatro" en lugar de
// "MegaGH4" es un nombre de producto distinto. Se reporta aparte para que el
// médico vea CÓMO falla el proveedor, no para inflar la nota.

/** Término del vademécum, con las variantes habladas que el equipo acepte como equivalentes. */
export interface TerminoClinico {
  termino: string;
  /** Variantes que se consideran acierto (p. ej. "mega ge hache cuatro"). Decisión humana, no del algoritmo. */
  alias?: readonly string[];
}

export type EstadoTermino = 'exacto' | 'alias' | 'aproximado' | 'perdido';

export interface HallazgoTermino {
  termino: string;
  estado: EstadoTermino;
  /** Fragmento de la hipótesis que más se acercó (vacío si no hubo nada cercano). */
  encontrado: string;
  /** Similitud 0..1 del mejor fragmento. 1 = idéntico tras normalizar. */
  similitud: number;
}

export interface ResultadoEvaluacion {
  /** WER clásico sobre todas las palabras. Contexto, no criterio de decisión. */
  werGlobal: number;
  hallazgos: HallazgoTermino[];
  /** Términos esperados presentes en la referencia. */
  totalTerminos: number;
  /** Recuperados literalmente. */
  exactos: number;
  /** Recuperados vía alias aceptado. */
  porAlias: number;
  /** Reconocibles pero mal escritos: fallo, contabilizado aparte para diagnóstico. */
  aproximados: number;
  perdidos: number;
  /** (exactos + porAlias) / totalTerminos. La cifra que decide el proveedor. */
  recallClinico: number;
}

/** Umbral de similitud a partir del cual un fragmento se considera "aproximado" (reconocible pero errado). */
export const UMBRAL_APROXIMADO = 0.75;

/** Minúsculas, sin tildes, sin puntuación, espacios colapsados. Conserva dígitos. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizar(texto: string): string[] {
  const n = normalizar(texto);
  return n === '' ? [] : n.split(' ');
}

/** Distancia de edición entre dos secuencias (palabras o caracteres). */
export function distanciaEdicion<T>(a: readonly T[], b: readonly T[]): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let previa = Array.from({ length: b.length + 1 }, (_, i) => i);
  let actual = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    actual[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const coste = a[i - 1] === b[j - 1] ? 0 : 1;
      actual[j] = Math.min(actual[j - 1] + 1, previa[j] + 1, previa[j - 1] + coste);
    }
    [previa, actual] = [actual, previa];
  }
  return previa[b.length];
}

/**
 * Word Error Rate clásico: (sustituciones + inserciones + omisiones) / palabras de referencia.
 * Una referencia vacía con hipótesis vacía es 0; con hipótesis no vacía es 1.
 */
export function calcularWer(referencia: string, hipotesis: string): number {
  const ref = tokenizar(referencia);
  const hip = tokenizar(hipotesis);
  if (ref.length === 0) return hip.length === 0 ? 0 : 1;
  return distanciaEdicion(ref, hip) / ref.length;
}

/** Similitud 0..1 basada en distancia de edición por caracteres. */
function similitudCaracteres(a: string, b: string): number {
  if (a === b) return 1;
  const max = Math.max(a.length, b.length);
  if (max === 0) return 1;
  return 1 - distanciaEdicion(a.split(''), b.split('')) / max;
}

interface MejorCoincidencia {
  fragmento: string;
  similitud: number;
}

/**
 * Busca en la hipótesis la ventana de palabras más parecida a `objetivo`.
 * Explora ventanas de longitud ±1 respecto al objetivo para tolerar que el
 * proveedor una o parta palabras ("MegaGH4" ↔ "mega gh 4").
 */
function mejorVentana(tokensHipotesis: readonly string[], objetivo: string): MejorCoincidencia {
  const objetivoNorm = normalizar(objetivo);
  const largoObjetivo = objetivoNorm === '' ? 0 : objetivoNorm.split(' ').length;
  if (largoObjetivo === 0 || tokensHipotesis.length === 0) {
    return { fragmento: '', similitud: 0 };
  }

  let mejor: MejorCoincidencia = { fragmento: '', similitud: 0 };
  const minimo = Math.max(1, largoObjetivo - 1);
  const maximo = largoObjetivo + 1;

  for (let largo = minimo; largo <= maximo; largo++) {
    for (let i = 0; i + largo <= tokensHipotesis.length; i++) {
      const fragmento = tokensHipotesis.slice(i, i + largo).join(' ');
      const similitud = similitudCaracteres(objetivoNorm, fragmento);
      if (similitud > mejor.similitud) mejor = { fragmento, similitud };
      if (mejor.similitud === 1) return mejor;
    }
  }
  return mejor;
}

/** Clasifica un único término contra la hipótesis. */
export function evaluarTermino(
  entrada: TerminoClinico,
  hipotesis: string
): HallazgoTermino {
  const tokens = tokenizar(hipotesis);

  const exacta = mejorVentana(tokens, entrada.termino);
  if (exacta.similitud === 1) {
    return { termino: entrada.termino, estado: 'exacto', encontrado: exacta.fragmento, similitud: 1 };
  }

  for (const alias of entrada.alias ?? []) {
    const porAlias = mejorVentana(tokens, alias);
    if (porAlias.similitud === 1) {
      return { termino: entrada.termino, estado: 'alias', encontrado: porAlias.fragmento, similitud: 1 };
    }
  }

  const estado: EstadoTermino = exacta.similitud >= UMBRAL_APROXIMADO ? 'aproximado' : 'perdido';
  return {
    termino: entrada.termino,
    estado,
    encontrado: estado === 'aproximado' ? exacta.fragmento : '',
    similitud: exacta.similitud,
  };
}

/**
 * Evalúa una transcripción contra su referencia.
 *
 * @param esperados Términos del vademécum que el dictado contiene. Es la lista
 *   que el médico declara al grabar, no una detección automática: si el
 *   algoritmo dedujera qué términos "debía" haber, mediría su propia inferencia.
 */
export function evaluarTranscripcion(
  referencia: string,
  hipotesis: string,
  esperados: readonly TerminoClinico[]
): ResultadoEvaluacion {
  const hallazgos = esperados.map((e) => evaluarTermino(e, hipotesis));

  const cuenta = (estado: EstadoTermino) => hallazgos.filter((h) => h.estado === estado).length;
  const exactos = cuenta('exacto');
  const porAlias = cuenta('alias');
  const total = hallazgos.length;

  return {
    werGlobal: calcularWer(referencia, hipotesis),
    hallazgos,
    totalTerminos: total,
    exactos,
    porAlias,
    aproximados: cuenta('aproximado'),
    perdidos: cuenta('perdido'),
    recallClinico: total === 0 ? 1 : (exactos + porAlias) / total,
  };
}
