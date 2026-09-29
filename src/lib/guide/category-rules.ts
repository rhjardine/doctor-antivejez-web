// Reglas del titulo de una categoria de la Guia.
//
// Viven fuera de la Server Action a proposito: un modulo `'use server'` solo
// debe exportar funciones asincronas, y ademas asi las reglas se pueden probar
// sin base de datos ni sesion.

/** Prefijo de los ids de categoria creados por el medico. */
export const PREFIJO_CATEGORIA_PERSONALIZADA = 'cat_custom_';

export const LARGO_MINIMO_TITULO = 3;
export const LARGO_MAXIMO_TITULO = 60;

/** Colapsa espacios y recorta. No cambia mayusculas: el medico escribe como quiere leerlo. */
export function normalizarTituloCategoria(titulo: string): string {
  return (titulo ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Devuelve el problema con el titulo, o null si es valido.
 *
 * Se devuelve el mensaje ya redactado para el medico en lugar de un codigo:
 * hay un solo consumidor y la traduccion intermedia no aportaria nada.
 */
export function validarTituloCategoria(titulo: string): string | null {
  const limpio = normalizarTituloCategoria(titulo);

  if (limpio === '') return 'Escriba un nombre para la categoría.';
  if (limpio.length < LARGO_MINIMO_TITULO) {
    return `El nombre es demasiado corto (mínimo ${LARGO_MINIMO_TITULO} caracteres).`;
  }
  if (limpio.length > LARGO_MAXIMO_TITULO) {
    return `El nombre es demasiado largo (máximo ${LARGO_MAXIMO_TITULO} caracteres).`;
  }
  return null;
}

/**
 * Id que usa la Guia para una categoria creada por el medico.
 *
 * Lleva prefijo para poder distinguirla de las fijas del catalogo sin
 * consultar la base de datos. Importa en el serializador hacia la app del
 * paciente, que decide la categoria a partir de este id.
 */
export function idCategoriaPersonalizada(idBd: string): string {
  return `${PREFIJO_CATEGORIA_PERSONALIZADA}${idBd}`;
}

export function esCategoriaPersonalizada(categoriaId: string): boolean {
  return categoriaId.startsWith(PREFIJO_CATEGORIA_PERSONALIZADA);
}
