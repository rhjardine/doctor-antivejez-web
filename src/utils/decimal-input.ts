/**
 * decimal-input.ts — Parseo de decimales tolerante a la coma (hotfix P0)
 *
 * PROBLEMA QUE RESUELVE
 * Los campos clínicos usaban <input type="number">. Según el algoritmo de
 * saneamiento de valor del estándar HTML, si el texto introducido no es un
 * número de coma flotante válido, `element.value` devuelve CADENA VACÍA.
 *
 * La coma decimal —el separador estándar en Venezuela y España— NO es válida
 * para type="number". Al escribir «21,3» el navegador devolvía '', el
 * componente lo interpretaba como «campo vacío», borraba el estado y React
 * repintaba el input en blanco. Después, la validación exigía un number y
 * abortaba antes de llamar al servidor: sin cálculo y sin rastro en los logs.
 *
 * Este helper acepta ambos separadores y devuelve `undefined` solo cuando el
 * texto realmente no representa un número.
 */

/**
 * Convierte el texto de un campo decimal en número.
 *
 * Acepta «21.3» y «21,3». Si aparecen ambos separadores, se interpreta el
 * punto como separador de millares y la coma como decimal («1.234,5»).
 *
 * @returns el número, o `undefined` si el texto está vacío o no es numérico.
 */
export function parseDecimalInput(raw: string | null | undefined): number | undefined {
  if (raw === null || raw === undefined) return undefined;

  const trimmed = String(raw).trim();
  if (trimmed === '') return undefined;

  const tieneComa = trimmed.includes(',');
  const tienePunto = trimmed.includes('.');

  const normalizado =
    tieneComa && tienePunto
      ? trimmed.replace(/\./g, '').replace(',', '.') // 1.234,5 → 1234.5
      : trimmed.replace(',', '.');                    // 21,3    → 21.3

  const valor = Number(normalizado);
  return Number.isFinite(valor) ? valor : undefined;
}

/**
 * Texto inicial que debe mostrar un campo decimal para un valor del formulario.
 * Se usa al montar y al recibir un valor nuevo desde el estado del padre.
 */
export function formatDecimalInput(value: number | undefined | null): string {
  return value === undefined || value === null || Number.isNaN(value) ? '' : String(value);
}
