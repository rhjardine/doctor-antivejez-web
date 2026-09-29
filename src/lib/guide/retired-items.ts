// Items retirados del catalogo de la Guia.
//
// Existe por una razon muy concreta: el JSON de una guia guardada NO contiene
// los nombres. `PatientGuide.selections` guarda solo `{selected, dosis, ...}`
// indexado por itemId, y el nombre se resuelve SIEMPRE contra el catalogo en
// tiempo de render.
//
// Consecuencia: borrar items del catalogo sin mas deja las guias historicas sin
// poder mostrarse ni imprimirse. El dato sigue en la base de datos, pero ya no
// se puede leer. Y hay algo peor: `serializeGuideToProtocol` resuelve el nombre
// con `itemNameMap[itemId] || itemId` y la categoria con un `|| 'cat_nutra_primarios'`,
// de modo que reguardar una guia antigua le mostraria al paciente "bn_7" como
// nombre de su terapia, archivado ademas bajo la categoria equivocada.
//
// Por eso retirar no es borrar. Los nombres se conservan aqui, en solo lectura:
// el medico deja de poder prescribirlos, y lo ya prescrito se sigue leyendo
// igual que siempre. No se toca ni una fila de la base de datos.

export interface ItemRetirado {
  id: string;
  nombre: string;
  /** Categoria a la que pertenecia, para que la PWA lo siga archivando bien. */
  categoriaId: string;
  categoriaTitulo: string;
}

/**
 * Terapia BioNeural, retirada a peticion del medico.
 *
 * Los nombres estan copiados literalmente del catalogo que estuvo vigente, no
 * reescritos: cualquier variacion cambiaria lo que se muestra en una guia ya
 * emitida.
 */
const NOMBRES_BIONEURAL: Readonly<Record<string, string>> = {
  bn_1: 'Adrenales',
  bn_2: 'Articular',
  bn_3: 'Cerebro',
  bn_4: 'Circulación Arterial',
  bn_5: 'Circulación Micro',
  bn_6: 'Circulación Venosa',
  bn_7: 'Corazón',
  bn_8: 'Disco',
  bn_9: 'Energética General',
  bn_10: 'Gastrointestinal',
  bn_11: 'Hígado',
  bn_12: 'Huesos',
  bn_13: 'Inmuno Estimulante',
  bn_14: 'Inmuno Modulador',
  bn_15: 'Linfático',
  bn_16: 'Médula Espinal',
  bn_17: 'Médula Ósea',
  bn_18: 'Mucosa',
  bn_19: 'Musculatura',
  bn_20: 'Páncreas',
  bn_21: 'Piel',
  bn_22: 'Próstata',
  bn_23: 'Reproductivo Femenino',
  bn_24: 'Reproductivo Masculino',
  bn_25: 'Respiratorio',
  bn_26: 'Riñón',
  bn_27: 'Sexual Femenina',
  bn_28: 'Sexual Masculina',
  bn_29: 'Tiroides',
  bn_30: 'Vacuna Antivejez',
  bn_31: 'Vejiga',
  bn_32: 'Vértigo',
  bn_33: 'Vías Biliares',
  bn_34: 'Visión',
  bn_35: 'Estreptococo',
  bn_36: 'Placenta Embrionaria',
  bn_37: 'Psicoestabilizante',
};

function construir(): Readonly<Record<string, ItemRetirado>> {
  const mapa: Record<string, ItemRetirado> = {};
  for (const [id, nombre] of Object.entries(NOMBRES_BIONEURAL)) {
    mapa[id] = {
      id,
      nombre,
      categoriaId: 'cat_bioneural',
      categoriaTitulo: 'Terapia BioNeural',
    };
  }
  return mapa;
}

export const ITEMS_RETIRADOS: Readonly<Record<string, ItemRetirado>> = construir();

export function itemRetirado(itemId: string): ItemRetirado | undefined {
  return ITEMS_RETIRADOS[itemId];
}

export function esRetirado(itemId: string): boolean {
  return itemId in ITEMS_RETIRADOS;
}

/**
 * Items retirados que esta guia tenia marcados.
 *
 * Se filtra por `selected` porque una guia puede arrastrar entradas con datos
 * sueltos y sin marcar; esas no se prescribieron y no deben mostrarse.
 */
export function retiradosSeleccionados(
  selections: Record<string, unknown> | null | undefined
): ItemRetirado[] {
  if (!selections || typeof selections !== 'object') return [];
  const encontrados: ItemRetirado[] = [];
  for (const [itemId, valor] of Object.entries(selections)) {
    if (!(valor as { selected?: boolean })?.selected) continue;
    const retirado = ITEMS_RETIRADOS[itemId];
    if (retirado) encontrados.push(retirado);
  }
  return encontrados;
}
