/**
 * guide-summary.ts — Lógica de resumen de la Guía del Paciente (Hito G1)
 * ============================================================================
 *
 * Deriva, a partir de `selections`, un resumen legible de lo que el médico
 * lleva prescrito: qué ítems están seleccionados, en qué sección, y con qué
 * dosis/horario.
 *
 * Es lógica PURA y sin dependencias de React a propósito:
 *  - se puede testear sin montar componentes
 *  - evita el import circular con PatientGuide.tsx (que es quien exporta
 *    `homeopathicStructure` y `bachFlowersList`; se reciben por parámetro)
 *
 * NO participa en ningún cálculo clínico: solo lee `selections` y la formatea.
 */

import type {
  GuideCategory,
  Selections,
  StandardGuideItem,
  MetabolicActivatorItem,
} from '@/types/guide';

// ─── Tipos de salida ────────────────────────────────────────────────────────

export interface SummaryItem {
  /** ID del ítem — sirve de ancla para saltar a él en el formulario. */
  id: string;
  /** Nombre visible del producto o ítem. */
  name: string;
  /** Dosis/horario ya formateado. Cadena vacía si aún no se ha detallado. */
  detail: string;
}

export interface SummaryCategory {
  id: string;
  title: string;
  count: number;
  items: SummaryItem[];
}

export interface GuideSummary {
  categories: SummaryCategory[];
  /** Total de ítems seleccionados en toda la guía. */
  total: number;
}

/** Estructura anidada del Activador Metabólico, tal como la define PatientGuide. */
export type HomeopathicStructure = Record<
  string,
  string[] | Record<string, string[]>
>;

// ─── IDs especiales del Activador Metabólico ────────────────────────────────

export const BIOTERAPICO_ID = 'am_bioterapico';
const HOM_PREFIX = 'am_hom_';
const BACH_PREFIX = 'am_bach_';

/**
 * Reproduce EXACTAMENTE el esquema de IDs de `HomeopathySelector`.
 * Si aquel cambia, este debe cambiar con él — de ahí que exista un test que
 * los mantiene alineados.
 */
export function homeopathyItemId(
  name: string,
  category: string,
  subCategory?: string,
): string {
  const uniquePrefix = subCategory ? `${category}_${subCategory}` : category;
  return `${HOM_PREFIX}${uniquePrefix}_${name}`
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .toLowerCase();
}

/**
 * Construye el mapa ID → etiqueta legible ("Sistemas Orgánicos › Nervioso › Ansiedad")
 * recorriendo la misma estructura que pinta los checkboxes. No duplica nombres.
 */
export function buildHomeopathyLabelMap(
  structure: HomeopathicStructure,
): Record<string, string> {
  const map: Record<string, string> = {};

  for (const [category, subItems] of Object.entries(structure)) {
    if (Array.isArray(subItems)) {
      for (const name of subItems) {
        map[homeopathyItemId(name, category)] = `${category} › ${name}`;
      }
    } else {
      for (const [subCategory, items] of Object.entries(subItems)) {
        for (const name of items) {
          map[homeopathyItemId(name, category, subCategory)] =
            `${category} › ${subCategory} › ${name}`;
        }
      }
    }
  }

  return map;
}

// ─── Formateo de dosis ──────────────────────────────────────────────────────

/** Une fragmentos no vacíos con un separador, sin dejar separadores sueltos. */
const join = (parts: (string | undefined | null | false)[], sep = ' · '): string =>
  parts.filter((p): p is string => Boolean(p && String(p).trim())).join(sep);

/**
 * Convierte un ítem de `selections` en una línea legible de dosis/horario.
 *
 * `Selections` es una unión de seis formas distintas, así que se leen los
 * campos de forma tolerante: cada bloque aporta lo suyo si está presente y se
 * ignora en caso contrario. Un ítem seleccionado pero sin detallar devuelve ''.
 */
export function formatSelectionDetail(selection: unknown): string {
  if (!selection || typeof selection !== 'object') return '';
  const s = selection as Record<string, any>;

  // — Fase de Remoción —
  const remocion = join([
    s.cucharadas && `${s.cucharadas} cucharada(s)`,
    s.horario && !Array.isArray(s.horario) && String(s.horario),
    s.semanas && `${s.semanas} semana(s)`,
    Array.isArray(s.alimentacionTipo) && s.alimentacionTipo.length > 0 &&
      s.alimentacionTipo.join(', '),
    s.tacita_qty && `${s.tacita_qty} tacita(s)`,
    s.tacita && String(s.tacita),
    s.frascos && `${s.frascos} frasco(s)`,
  ]);

  // — Fase de Revitalización —
  const revitalizacion = join([
    s.complejoB_cc && `Complejo B ${s.complejoB_cc} cc`,
    s.otroMedicamento &&
      `${s.otroMedicamento === 'Otro' ? s.otroMedicamento_custom || 'Otro' : s.otroMedicamento}${s.otro_cc ? ` ${s.otro_cc} cc` : ''}`,
    s.vecesXSemana && `${s.vecesXSemana} vez/semana`,
    s.totalDosis && `${s.totalDosis} dosis`,
  ]);

  // — Activador Metabólico —
  const metabolico = join([
    s.gotas && `${s.gotas} gotas`,
    s.vecesAlDia && `${s.vecesAlDia} vez/día`,
    Array.isArray(s.horario) && s.horario.length > 0 && s.horario.join(', '),
  ]);

  // — Nutracéuticos, Cosmecéuticos, Fórmulas Naturales —
  const estandar = join([
    join([s.qty, s.doseType], ' '),
    s.freq && String(s.freq),
    s.custom && String(s.custom),
    s.personalizacion && String(s.personalizacion),
  ]);

  // — Sueros, Terapias y BioNeural —
  const suero = join([s.dosis && String(s.dosis), s.frecuencia && String(s.frecuencia)]);

  return join([remocion, revitalizacion, metabolico, estandar, suero]);
}

// ─── Resumen completo ───────────────────────────────────────────────────────

const isSelected = (selections: Selections, id: string): boolean =>
  Boolean((selections?.[id] as any)?.selected);

/**
 * Recorre las categorías y devuelve, por cada una, los ítems seleccionados con
 * su dosis formateada, más el total global.
 *
 * El Activador Metabólico se trata aparte: sus selecciones no viven en
 * `category.items` (que contiene un único objeto contenedor), sino repartidas
 * entre `am_bioterapico`, los `am_hom_*` de la matriz homeopática y los
 * `am_bach_*` de las Flores de Bach.
 */
export function summarizeGuide(
  guideData: GuideCategory[],
  selections: Selections,
  catalogs: {
    homeopathicStructure: HomeopathicStructure;
    bachFlowersList: MetabolicActivatorItem[];
  },
): GuideSummary {
  const homeopathyLabels = buildHomeopathyLabelMap(catalogs.homeopathicStructure);
  const bachNames = Object.fromEntries(
    catalogs.bachFlowersList.map((f) => [f.id, f.name]),
  );

  const categories: SummaryCategory[] = guideData.map((category) => {
    const items: SummaryItem[] = [];

    if (category.type === 'METABOLIC') {
      if (isSelected(selections, BIOTERAPICO_ID)) {
        items.push({
          id: BIOTERAPICO_ID,
          name: 'Bioterápico + Bach',
          detail: formatSelectionDetail(selections[BIOTERAPICO_ID]),
        });
      }

      for (const id of Object.keys(selections ?? {})) {
        if (!isSelected(selections, id)) continue;
        if (id.startsWith(HOM_PREFIX)) {
          items.push({ id, name: homeopathyLabels[id] ?? id, detail: '' });
        } else if (id.startsWith(BACH_PREFIX)) {
          items.push({ id, name: bachNames[id] ?? id, detail: '' });
        }
      }
    } else {
      for (const item of category.items as StandardGuideItem[]) {
        if (!item?.id || !isSelected(selections, item.id)) continue;
        items.push({
          id: item.id,
          name: item.name,
          detail: formatSelectionDetail(selections[item.id]) || item.dose || '',
        });
      }
    }

    return { id: category.id, title: category.title, count: items.length, items };
  });

  return {
    categories,
    total: categories.reduce((sum, c) => sum + c.count, 0),
  };
}
