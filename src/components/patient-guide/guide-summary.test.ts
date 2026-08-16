/**
 * guide-summary.test.ts — Tests del resumen de la Guía del Paciente (G1)
 *
 * Cubre la lógica que alimenta el panel "Guía en curso". No toca ningún
 * cálculo clínico: solo verifica que lo seleccionado se cuenta y se describe
 * correctamente.
 */

import { describe, expect, it } from 'vitest';

import type { GuideCategory, MetabolicActivatorItem, Selections } from '@/types/guide';
import {
  BIOTERAPICO_ID,
  buildHomeopathyLabelMap,
  formatSelectionDetail,
  homeopathyItemId,
  summarizeGuide,
} from './guide-summary';

// ─── Dobles de prueba ───────────────────────────────────────────────────────

const homeopathicStructure = {
  Evolución: ['Inflamación', 'Degeneración'],
  'Sistemas Orgánicos': {
    Nervioso: ['SN Central', 'Ansiedad'],
    Endocrino: ['Tiroides'],
  },
};

const bachFlowersList: MetabolicActivatorItem[] = [
  { id: 'am_bach_1', name: 'Agrimony' },
  { id: 'am_bach_39', name: 'Rescue Remedy' },
];

const guideData: GuideCategory[] = [
  {
    id: 'cat_remocion',
    title: 'Fase de Remoción',
    type: 'REMOCION',
    items: [
      { id: 'rem_1', name: 'Aceite de ricino', subType: 'aceite_ricino' },
      { id: 'rem_2', name: 'Leche de magnesia', subType: 'leche_magnesia' },
    ] as any,
  },
  {
    id: 'cat_activador',
    title: 'Activador Metabólico',
    type: 'METABOLIC',
    items: [{ id: 'cat_activador', homeopathy: [], bachFlowers: bachFlowersList }] as any,
  },
  {
    id: 'cat_nutra_primarios',
    title: 'Nutracéuticos Primarios',
    type: 'STANDARD',
    items: [
      { id: 'np_1', name: 'MegaGH4' },
      { id: 'np_2', name: 'StemCell Enhancer' },
    ],
  },
  {
    id: 'cat_formulas_naturales',
    title: 'Fórmulas Naturales',
    type: 'STANDARD',
    items: [{ id: 'fn_2', name: 'Aceite de Ozono', dose: 'Aplicar 2 veces/día' }],
  },
];

const catalogs = { homeopathicStructure, bachFlowersList };

// ─── Esquema de IDs ─────────────────────────────────────────────────────────

describe('homeopathyItemId', () => {
  it('reproduce el esquema de IDs de HomeopathySelector', () => {
    // Réplica literal de la línea de PatientGuide.tsx que genera el id:
    //   `am_hom_${uniquePrefix}_${name}`.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()
    const esperado = (name: string, category: string, subCategory?: string) => {
      const uniquePrefix = subCategory ? `${category}_${subCategory}` : category;
      return `am_hom_${uniquePrefix}_${name}`.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    };

    expect(homeopathyItemId('Inflamación', 'Evolución')).toBe(
      esperado('Inflamación', 'Evolución'),
    );
    expect(homeopathyItemId('Ansiedad', 'Sistemas Orgánicos', 'Nervioso')).toBe(
      esperado('Ansiedad', 'Sistemas Orgánicos', 'Nervioso'),
    );
  });

  it('normaliza acentos y espacios a guiones bajos', () => {
    expect(homeopathyItemId('SN Central', 'Sistemas Orgánicos', 'Nervioso')).toBe(
      'am_hom_sistemas_org_nicos_nervioso_sn_central',
    );
  });
});

describe('buildHomeopathyLabelMap', () => {
  it('etiqueta las ramas planas y las anidadas', () => {
    const map = buildHomeopathyLabelMap(homeopathicStructure);

    expect(map[homeopathyItemId('Inflamación', 'Evolución')]).toBe('Evolución › Inflamación');
    expect(map[homeopathyItemId('Ansiedad', 'Sistemas Orgánicos', 'Nervioso')]).toBe(
      'Sistemas Orgánicos › Nervioso › Ansiedad',
    );
  });

  it('cubre todas las hojas de la estructura', () => {
    // 2 de Evolución + 2 de Nervioso + 1 de Endocrino
    expect(Object.keys(buildHomeopathyLabelMap(homeopathicStructure))).toHaveLength(5);
  });
});

// ─── Formateo de dosis ──────────────────────────────────────────────────────

describe('formatSelectionDetail', () => {
  it('formatea la Fase de Remoción', () => {
    expect(
      formatSelectionDetail({
        selected: true,
        cucharadas: 4,
        horario: 'al acostarse (1 sola vez)',
      }),
    ).toBe('4 cucharada(s) · al acostarse (1 sola vez)');
  });

  it('formatea la detoxificación con sus tipos de alimentación', () => {
    expect(
      formatSelectionDetail({
        selected: true,
        semanas: 2,
        alimentacionTipo: ['Metabólica', 'Renal'],
      }),
    ).toBe('2 semana(s) · Metabólica, Renal');
  });

  it('formatea la Fase de Revitalización', () => {
    expect(
      formatSelectionDetail({
        selected: true,
        complejoB_cc: '2',
        otroMedicamento: 'Procaína',
        otro_cc: '1',
        vecesXSemana: 3,
        totalDosis: 12,
      }),
    ).toBe('Complejo B 2 cc · Procaína 1 cc · 3 vez/semana · 12 dosis');
  });

  it('resuelve el medicamento "Otro" con su texto libre', () => {
    expect(
      formatSelectionDetail({
        selected: true,
        otroMedicamento: 'Otro',
        otroMedicamento_custom: 'Bioquel Zinc',
      }),
    ).toBe('Bioquel Zinc');
  });

  it('formatea el Activador Metabólico con horarios múltiples', () => {
    expect(
      formatSelectionDetail({
        selected: true,
        gotas: 10,
        vecesAlDia: 3,
        horario: ['30 min antes del Desayuno', '30 min antes de la Cena'],
      }),
    ).toBe(
      '10 gotas · 3 vez/día · 30 min antes del Desayuno, 30 min antes de la Cena',
    );
  });

  it('formatea un nutracéutico estándar', () => {
    expect(
      formatSelectionDetail({
        selected: true,
        qty: '2',
        doseType: 'Capsulas',
        freq: '30 minutos antes de',
      }),
    ).toBe('2 Capsulas · 30 minutos antes de');
  });

  it('formatea sueros y terapias', () => {
    expect(
      formatSelectionDetail({ selected: true, dosis: '10 cc', frecuencia: 'Semanal' }),
    ).toBe('10 cc · Semanal');
  });

  it('devuelve cadena vacía cuando el ítem está marcado pero sin detallar', () => {
    expect(formatSelectionDetail({ selected: true })).toBe('');
  });

  it('tolera entradas nulas o no-objeto', () => {
    expect(formatSelectionDetail(null)).toBe('');
    expect(formatSelectionDetail(undefined)).toBe('');
    expect(formatSelectionDetail('texto')).toBe('');
  });
});

// ─── Resumen completo ───────────────────────────────────────────────────────

describe('summarizeGuide', () => {
  it('devuelve todas las secciones en cero cuando no hay nada seleccionado', () => {
    const resumen = summarizeGuide(guideData, {}, catalogs);

    expect(resumen.total).toBe(0);
    expect(resumen.categories).toHaveLength(4);
    expect(resumen.categories.every((c) => c.count === 0)).toBe(true);
  });

  it('cuenta solo los ítems con selected true', () => {
    const selections: Selections = {
      rem_1: { selected: true, cucharadas: 4 } as any,
      rem_2: { selected: false } as any,
      np_1: { selected: true } as any,
    };

    const resumen = summarizeGuide(guideData, selections, catalogs);

    expect(resumen.total).toBe(2);
    expect(resumen.categories.find((c) => c.id === 'cat_remocion')?.count).toBe(1);
    expect(resumen.categories.find((c) => c.id === 'cat_nutra_primarios')?.count).toBe(1);
  });

  it('recoge las tres fuentes del Activador Metabólico', () => {
    const idAnsiedad = homeopathyItemId('Ansiedad', 'Sistemas Orgánicos', 'Nervioso');
    const selections: Selections = {
      [BIOTERAPICO_ID]: { selected: true, gotas: 10 } as any,
      [idAnsiedad]: { selected: true } as any,
      am_bach_39: { selected: true } as any,
    };

    const activador = summarizeGuide(guideData, selections, catalogs).categories.find(
      (c) => c.id === 'cat_activador',
    );

    expect(activador?.count).toBe(3);

    const nombres = activador?.items.map((i) => i.name) ?? [];
    expect(nombres).toContain('Bioterápico + Bach');
    expect(nombres).toContain('Sistemas Orgánicos › Nervioso › Ansiedad');
    expect(nombres).toContain('Rescue Remedy');
  });

  it('no atribuye las selecciones del activador a otras secciones', () => {
    const selections: Selections = { am_bach_1: { selected: true } as any };
    const resumen = summarizeGuide(guideData, selections, catalogs);

    expect(resumen.total).toBe(1);
    expect(resumen.categories.find((c) => c.id === 'cat_activador')?.count).toBe(1);
    expect(resumen.categories.find((c) => c.id === 'cat_remocion')?.count).toBe(0);
  });

  it('usa la dosis por defecto del catálogo cuando el médico no detalla', () => {
    const selections: Selections = { fn_2: { selected: true } as any };
    const item = summarizeGuide(guideData, selections, catalogs).categories.find(
      (c) => c.id === 'cat_formulas_naturales',
    )?.items[0];

    expect(item?.detail).toBe('Aplicar 2 veces/día');
  });

  it('la dosis escrita por el médico prevalece sobre la del catálogo', () => {
    const selections: Selections = { fn_2: { selected: true, dosis: '3 veces/día' } as any };
    const item = summarizeGuide(guideData, selections, catalogs).categories.find(
      (c) => c.id === 'cat_formulas_naturales',
    )?.items[0];

    expect(item?.detail).toBe('3 veces/día');
  });

  it('el total es la suma de los contadores de cada sección', () => {
    const selections: Selections = {
      rem_1: { selected: true } as any,
      rem_2: { selected: true } as any,
      np_1: { selected: true } as any,
      np_2: { selected: true } as any,
      am_bach_1: { selected: true } as any,
    };

    const resumen = summarizeGuide(guideData, selections, catalogs);
    const suma = resumen.categories.reduce((acc, c) => acc + c.count, 0);

    expect(resumen.total).toBe(5);
    expect(resumen.total).toBe(suma);
  });

  it('ignora ítems seleccionados que ya no existen en el catálogo', () => {
    const selections: Selections = { producto_borrado: { selected: true } as any };
    expect(summarizeGuide(guideData, selections, catalogs).total).toBe(0);
  });
});
