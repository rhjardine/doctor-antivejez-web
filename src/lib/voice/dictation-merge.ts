// Como se incorpora el texto dictado a un campo que ya tiene contenido.
//
// Logica pura, sin React ni red, para que la decision mas delicada de la
// funcion —si el dictado pisa o no lo que el medico ya habia escrito— sea
// verificable en una prueba y no dependa de leer un componente.

export type ModoDictado = 'anexar' | 'reemplazar';

/** Limpia la transcripcion sin alterar lo que se dijo: solo espacios sobrantes. */
export function normalizarDictado(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim();
}

/**
 * Combina el texto existente con el dictado.
 *
 * 'anexar' es el modo por defecto y el unico seguro: nunca destruye lo escrito.
 * 'reemplazar' existe porque a veces el medico quiere rehacer la observacion
 * entera, pero es una eleccion explicita suya en la propuesta, no del sistema.
 */
export function combinarDictado(
  existente: string,
  dictado: string,
  modo: ModoDictado = 'anexar'
): string {
  const limpio = normalizarDictado(dictado);
  if (limpio === '') return existente;
  if (modo === 'reemplazar') return limpio;

  const base = existente.trimEnd();
  if (base === '') return limpio;

  // Se separa con un espacio, salvo que lo anterior terminara en salto de linea:
  // ahi el medico ya marco una separacion de parrafo y se respeta.
  const separador = /\n\s*$/.test(existente) ? '\n' : ' ';
  return `${base}${separador}${limpio}`;
}

/**
 * Texto que veria el campo si se aceptara la propuesta. Es lo que se muestra en
 * la vista previa, de modo que el medico decide sobre el resultado final y no
 * sobre un fragmento suelto.
 */
export function previsualizarDictado(
  existente: string,
  dictado: string,
  modo: ModoDictado = 'anexar'
): string {
  return combinarDictado(existente, dictado, modo);
}
