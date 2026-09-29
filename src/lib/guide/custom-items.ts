// Productos que el medico anade a mano en la Guia.
//
// El fallo que esto corrige: `handleAddNewItem` metia el producto nuevo en
// `guideData`, que es estado de React y vive solo en memoria. Lo unico que se
// persiste de una guia es `selections`, asi que al recargar volvian las marcas
// pero NO los nombres, y el producto desaparecia de la pantalla como si nunca
// se hubiera escrito. El medico podia llevar meses anadiendo productos creyendo
// que quedaban guardados.
//
// La solucion no necesita migracion: el nombre viaja dentro de la propia
// entrada de `selections`, que ya es una columna Json. Al cargar una guia se
// reconstruyen los productos a partir de ahi.
//
// Se guarda tambien la categoria en lugar de deducirla del id. El id tiene la
// forma `new_<categoria>_<marca de tiempo>`, y se podria parsear, pero entonces
// renombrar una categoria romperia guias ya guardadas en silencio. Un dato
// explicito no se estropea al refactorizar.

/** Prefijo de los identificadores generados al anadir un producto a mano. */
export const PREFIJO_PERSONALIZADO = 'new_';

/** Campos que viajan dentro de la entrada de selections de un producto personalizado. */
export interface MarcaItemPersonalizado {
  nombrePersonalizado?: string;
  categoriaPersonalizada?: string;
}

export interface ItemPersonalizado {
  id: string;
  nombre: string;
  categoriaId: string;
}

/** Construye la entrada que se siembra en selections al crear el producto. */
export function marcaDeItemPersonalizado(
  nombre: string,
  categoriaId: string
): MarcaItemPersonalizado {
  return { nombrePersonalizado: nombre, categoriaPersonalizada: categoriaId };
}

/**
 * Recupera de una guia guardada los productos que el medico habia anadido.
 *
 * Solo devuelve los que traen nombre: una entrada `new_...` sin nombre viene de
 * una guia anterior a esta correccion y no hay forma de saber como se llamaba.
 * Inventarlo seria peor que omitirlo.
 */
export function extraerItemsPersonalizados(
  selections: Record<string, unknown> | null | undefined
): ItemPersonalizado[] {
  if (!selections || typeof selections !== 'object') return [];

  const encontrados: ItemPersonalizado[] = [];
  for (const [id, valor] of Object.entries(selections)) {
    if (!id.startsWith(PREFIJO_PERSONALIZADO)) continue;

    const marca = valor as MarcaItemPersonalizado | null;
    const nombre = marca?.nombrePersonalizado?.trim();
    const categoriaId = marca?.categoriaPersonalizada?.trim();
    if (!nombre || !categoriaId) continue;

    encontrados.push({ id, nombre, categoriaId });
  }
  return encontrados;
}

/**
 * Identificadores `new_...` que se guardaron sin nombre.
 *
 * Son guias anteriores a esta correccion: la marca quedo, el nombre se perdio.
 * Se exponen para poder avisar al medico en lugar de que el item se esfume sin
 * mas, que es justo lo que venia pasando.
 */
export function personalizadosSinNombre(
  selections: Record<string, unknown> | null | undefined
): string[] {
  if (!selections || typeof selections !== 'object') return [];

  const huerfanos: string[] = [];
  for (const [id, valor] of Object.entries(selections)) {
    if (!id.startsWith(PREFIJO_PERSONALIZADO)) continue;
    if (!(valor as { selected?: boolean })?.selected) continue;

    const marca = valor as MarcaItemPersonalizado | null;
    if (!marca?.nombrePersonalizado?.trim()) huerfanos.push(id);
  }
  return huerfanos;
}
