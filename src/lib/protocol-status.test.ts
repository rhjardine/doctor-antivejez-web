/**
 * protocol-status.test.ts — Regresión de B1 (persistencia de adherencia)
 *
 * Cubre la lógica que decide qué estado ve el paciente al reentrar. El fallo
 * que B1 corrige era precisamente que ese estado se perdía siempre.
 */

import { describe, expect, it } from 'vitest';
import {
  ESTADOS_VALIDOS,
  ESTADO_POR_DEFECTO,
  aplicarEstados,
  estadoDeItem,
  indexarEstados,
} from './protocol-status';

describe('contrato de estados', () => {
  it('solo admite los dos valores que usa la PWA', () => {
    expect(ESTADOS_VALIDOS).toEqual(['pending', 'completed']);
  });

  it('un ítem nunca marcado está pendiente', () => {
    expect(ESTADO_POR_DEFECTO).toBe('pending');
  });
});

describe('indexarEstados', () => {
  it('indexa los registros por itemId', () => {
    const mapa = indexarEstados([
      { itemId: 'rem_1', status: 'completed' },
      { itemId: 'np_2', status: 'pending' },
    ]);

    expect(mapa.get('rem_1')).toBe('completed');
    expect(mapa.get('np_2')).toBe('pending');
    expect(mapa.size).toBe(2);
  });

  it('descarta estados fuera de contrato en vez de propagarlos', () => {
    const mapa = indexarEstados([
      { itemId: 'rem_1', status: 'completed' },
      { itemId: 'rem_2', status: 'ESTADO_RARO' },
      { itemId: 'rem_3', status: '' },
    ]);

    expect(mapa.get('rem_1')).toBe('completed');
    expect(mapa.has('rem_2')).toBe(false);
    expect(mapa.has('rem_3')).toBe(false);
  });

  it('ignora registros sin itemId', () => {
    const mapa = indexarEstados([
      { itemId: '', status: 'completed' },
      { itemId: 'np_1', status: 'completed' },
    ]);

    expect(mapa.size).toBe(1);
  });

  it('tolera una lista vacía o ausente', () => {
    expect(indexarEstados([]).size).toBe(0);
    expect(indexarEstados(undefined as any).size).toBe(0);
  });
});

describe('estadoDeItem', () => {
  it('devuelve el estado persistido cuando existe', () => {
    const mapa = indexarEstados([{ itemId: 'rem_1', status: 'completed' }]);
    expect(estadoDeItem(mapa, 'rem_1')).toBe('completed');
  });

  it('cae a pending para un ítem sin registro', () => {
    expect(estadoDeItem(new Map(), 'jamas_marcado')).toBe('pending');
  });
});

describe('aplicarEstados — la otra mitad de la persistencia', () => {
  const items = [
    { id: 'rem_1', itemName: 'Aceite de ricino', status: 'pending' },
    { id: 'np_2', itemName: 'StemCell Enhancer', status: 'pending' },
    { id: 'nc_7', itemName: 'Omega 3', status: 'pending' },
  ];

  it('reemplaza el pending hardcodeado por el estado real', () => {
    const estados = indexarEstados([
      { itemId: 'rem_1', status: 'completed' },
      { itemId: 'nc_7', status: 'completed' },
    ]);

    const resultado = aplicarEstados(items, estados);

    expect(resultado.map((i) => i.status)).toEqual(['completed', 'pending', 'completed']);
  });

  it('preserva el resto de campos del ítem', () => {
    const estados = indexarEstados([{ itemId: 'rem_1', status: 'completed' }]);
    const resultado = aplicarEstados(items, estados);

    expect(resultado[0]).toEqual({
      id: 'rem_1',
      itemName: 'Aceite de ricino',
      status: 'completed',
    });
  });

  it('sin ningún registro, todo queda pendiente (comportamiento previo a B1)', () => {
    const resultado = aplicarEstados(items, new Map());
    expect(resultado.every((i) => i.status === 'pending')).toBe(true);
  });

  it('un estado de otro paciente no se filtra a estos ítems', () => {
    // indexarEstados recibe siempre registros ya filtrados por patientId en la
    // consulta; este test fija que la función no inventa coincidencias.
    const estados = indexarEstados([{ itemId: 'item_de_otro', status: 'completed' }]);
    const resultado = aplicarEstados(items, estados);

    expect(resultado.every((i) => i.status === 'pending')).toBe(true);
  });

  it('no muta el array de entrada', () => {
    const estados = indexarEstados([{ itemId: 'rem_1', status: 'completed' }]);
    aplicarEstados(items, estados);

    expect(items[0].status).toBe('pending');
  });

  it('tolera una lista de ítems vacía', () => {
    expect(aplicarEstados([], new Map())).toEqual([]);
  });
});
