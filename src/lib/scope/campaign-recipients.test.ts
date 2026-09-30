import { describe, it, expect } from 'vitest';
import {
  idsPedidos,
  idsFueraDeAlcance,
  destinatariosDesdePacientes,
  MAXIMO_DESTINATARIOS,
  type PacienteDestinatario,
} from './campaign-recipients';

const paciente = (extra: Partial<PacienteDestinatario> = {}): PacienteDestinatario => ({
  id: 'p1',
  firstName: 'Ana',
  lastName: 'Pérez',
  email: 'ana@ejemplo.test',
  phone: '+58000000000',
  ...extra,
});

describe('idsPedidos', () => {
  it('del cliente sólo se acepta el identificador', () => {
    // El resto de lo que venga —name, email, phone— se ignora por completo:
    // era exactamente lo que permitía elegir a qué número se enviaba el SMS.
    const pedidos = idsPedidos([
      { id: 'p1', name: 'Quien sea', email: 'atacante@ejemplo.test', phone: '+99999999999' } as never,
    ]);
    expect(pedidos).toEqual(['p1']);
  });

  it('descarta repetidos: un contacto duplicado no se contacta dos veces', () => {
    expect(idsPedidos([{ id: 'p1' }, { id: 'p1' }, { id: 'p2' }])).toEqual(['p1', 'p2']);
  });

  it('descarta lo que no es un identificador', () => {
    expect(idsPedidos([{ id: '' }, { id: '   ' }, { id: 42 }, { id: null }, {}])).toEqual([]);
  });

  it('recorta espacios alrededor del identificador', () => {
    expect(idsPedidos([{ id: '  p1  ' }])).toEqual(['p1']);
  });

  it('no revienta con entradas que no son listas', () => {
    expect(idsPedidos(null)).toEqual([]);
    expect(idsPedidos(undefined)).toEqual([]);
    expect(idsPedidos('p1' as never)).toEqual([]);
  });

  it('pone un tope al número de destinatarios de una sola petición', () => {
    const muchos = Array.from({ length: MAXIMO_DESTINATARIOS + 500 }, (_, i) => ({ id: `p${i}` }));
    expect(idsPedidos(muchos)).toHaveLength(MAXIMO_DESTINATARIOS);
  });
});

describe('idsFueraDeAlcance', () => {
  it('detecta los pacientes que la petición nombraba y no son del profesional', () => {
    const encontrados = [paciente({ id: 'mio' })];
    expect(idsFueraDeAlcance(['mio', 'ajeno'], encontrados)).toEqual(['ajeno']);
  });

  it('no hay nada fuera de alcance cuando todos aparecieron', () => {
    const encontrados = [paciente({ id: 'a' }), paciente({ id: 'b' })];
    expect(idsFueraDeAlcance(['a', 'b'], encontrados)).toEqual([]);
  });

  it('si la consulta no devolvió nada, todo está fuera de alcance', () => {
    // El caso de un identificador inventado: no debe pasar por "sin novedad".
    expect(idsFueraDeAlcance(['x', 'y'], [])).toEqual(['x', 'y']);
  });
});

describe('destinatariosDesdePacientes', () => {
  it('el destino sale de la base, no de lo que mandó el cliente', () => {
    const [d] = destinatariosDesdePacientes([paciente()]);
    expect(d.email).toBe('ana@ejemplo.test');
    expect(d.phone).toBe('+58000000000');
    expect(d.name).toBe('Ana Pérez');
  });

  it('descarta a quien no tiene ni correo ni teléfono', () => {
    const sinContacto = paciente({ id: 'p9', email: '', phone: '   ' });
    expect(destinatariosDesdePacientes([sinContacto])).toEqual([]);
  });

  it('conserva a quien tiene sólo uno de los dos', () => {
    const soloCorreo = paciente({ id: 'p2', phone: '' });
    const soloTelefono = paciente({ id: 'p3', email: '' });
    expect(destinatariosDesdePacientes([soloCorreo, soloTelefono])).toHaveLength(2);
  });
});
