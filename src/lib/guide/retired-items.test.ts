import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  ITEMS_RETIRADOS,
  itemRetirado,
  esRetirado,
  retiradosSeleccionados,
} from './retired-items';

const FUENTE_CATALOGO = readFileSync(
  path.join(process.cwd(), 'src/components/patient-guide/PatientGuide.tsx'),
  'utf-8'
);

describe('items retirados del catálogo', () => {
  it('conserva los 37 ítems de Terapia BioNeural', () => {
    // Si alguien recorta esta tabla, las guías que los prescribieron dejan de
    // poder mostrarse. El número es la garantía más barata de que están todos.
    expect(Object.keys(ITEMS_RETIRADOS)).toHaveLength(37);
  });

  it('los nombres son los que estuvieron vigentes, no una reescritura', () => {
    // Una guía ya emitida debe seguir diciendo exactamente lo mismo.
    expect(itemRetirado('bn_1')?.nombre).toBe('Adrenales');
    expect(itemRetirado('bn_22')?.nombre).toBe('Próstata');
    expect(itemRetirado('bn_37')?.nombre).toBe('Psicoestabilizante');
  });

  it('cada ítem recuerda su categoría, para que la PWA lo siga archivando bien', () => {
    for (const item of Object.values(ITEMS_RETIRADOS)) {
      expect(item.categoriaId).toBe('cat_bioneural');
      expect(item.categoriaTitulo).toBe('Terapia BioNeural');
      expect(item.nombre.trim()).not.toBe('');
    }
  });

  it('la categoría ya NO está en el catálogo: no puede prescribirse de nuevo', () => {
    expect(FUENTE_CATALOGO).not.toContain("id: 'cat_bioneural'");
  });

  it('ningún bn_* sobrevive en el catálogo activo', () => {
    // Estar en los dos sitios sería peor que en ninguno: el médico podría
    // seguir prescribiéndolos creyendo que están retirados.
    for (const id of Object.keys(ITEMS_RETIRADOS)) {
      expect(FUENTE_CATALOGO).not.toContain(`id: '${id}'`);
    }
  });
});

describe('retiradosSeleccionados', () => {
  it('devuelve sólo lo que estaba marcado', () => {
    const encontrados = retiradosSeleccionados({
      bn_1: { selected: true, dosis: '10 gotas' },
      bn_2: { selected: false },
      np_1: { selected: true },
    });
    expect(encontrados.map((r) => r.id)).toEqual(['bn_1']);
  });

  it('una entrada sin marcar no se muestra aunque traiga datos sueltos', () => {
    // Puede quedar dosis escrita sin haber marcado la casilla; eso no se
    // prescribió y no debe aparecer en la guía impresa.
    expect(retiradosSeleccionados({ bn_5: { dosis: '5 ml' } })).toEqual([]);
  });

  it('ignora los ítems que siguen en el catálogo', () => {
    expect(retiradosSeleccionados({ np_1: { selected: true } })).toEqual([]);
  });

  it('no revienta con entradas ausentes o raras', () => {
    expect(retiradosSeleccionados(null)).toEqual([]);
    expect(retiradosSeleccionados(undefined)).toEqual([]);
    expect(retiradosSeleccionados({})).toEqual([]);
    expect(retiradosSeleccionados({ bn_1: null as unknown as object })).toEqual([]);
  });

  it('una guía nueva, sin nada retirado, no muestra el bloque', () => {
    expect(retiradosSeleccionados({ np_1: { selected: true }, ns_3: { selected: true } }))
      .toHaveLength(0);
  });
});

describe('esRetirado', () => {
  it('distingue retirado de vigente', () => {
    expect(esRetirado('bn_10')).toBe(true);
    expect(esRetirado('np_1')).toBe(false);
    expect(esRetirado('')).toBe(false);
  });
});
