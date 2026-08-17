/**
 * anonymize.test.ts — Regresión de S3 (saneado de contexto hacia prompts)
 *
 * Verifica que ningún identificador del paciente pueda alcanzar el system
 * prompt que se envía a un proveedor de IA externo.
 */

import { describe, expect, it } from 'vitest';
import { sanitizePatientContext, contienePosibleIdentificador } from './anonymize';

describe('sanitizePatientContext — S3', () => {
  it('elimina el nombre real del paciente', () => {
    const safe = sanitizePatientContext({ name: 'Carmen Santome', bioAge: 62 });

    expect(safe).not.toHaveProperty('name');
    expect(JSON.stringify(safe)).not.toContain('Carmen');
    expect(safe.bioAge).toBe(62);
  });

  it('elimina todos los identificadores directos', () => {
    const safe = sanitizePatientContext({
      name: 'Carmen Santome',
      firstName: 'Carmen',
      lastName: 'Santome',
      email: 'maiglesiass@gmail.com',
      phone: '+584242152423',
      identification: 'V-703832',
      address: 'Caracas',
      birthDate: '1931-04-12',
      patientId: 'cmssz8npj00141ur90ohl2t4r',
      bioAge: 62,
    });

    expect(Object.keys(safe)).toEqual(['bioAge']);
    const serializado = JSON.stringify(safe);
    for (const dato of [
      'Carmen', 'Santome', 'gmail', '58424', 'V-703832', 'Caracas', '1931', 'cmssz8',
    ]) {
      expect(serializado).not.toContain(dato);
    }
  });

  it('conserva únicamente los valores clínicos no identificables', () => {
    const safe = sanitizePatientContext({
      bioAge: 62,
      chronologicalAge: 95,
      bloodType: 'O+',
      gender: 'FEMENINO',
    });

    expect(safe).toEqual({
      bioAge: 62,
      chronologicalAge: 95,
      bloodType: 'O+',
      gender: 'FEMENINO',
    });
  });

  it('descarta claves desconocidas (lista de permitidos, no de prohibidos)', () => {
    const safe = sanitizePatientContext({
      bioAge: 40,
      campoNuevoQueNadiePreviO: 'dato sensible futuro',
    });

    expect(safe).toEqual({ bioAge: 40 });
  });

  it('ignora tipos no escalares para evitar inyección de objetos anidados', () => {
    const safe = sanitizePatientContext({
      bioAge: { toString: () => 'inyección' },
      bloodType: ['O+'],
    });

    expect(safe).toEqual({});
  });

  it('tolera entradas nulas o no-objeto', () => {
    expect(sanitizePatientContext(null)).toEqual({});
    expect(sanitizePatientContext(undefined)).toEqual({});
    expect(sanitizePatientContext('texto')).toEqual({});
    expect(sanitizePatientContext(42)).toEqual({});
  });

  it('el contexto saneado no dispara el detector de identificadores', () => {
    const safe = sanitizePatientContext({
      name: 'Carmen Santome',
      email: 'x@y.com',
      bioAge: 62,
      bloodType: 'O+',
    });

    expect(contienePosibleIdentificador(JSON.stringify(safe))).toBe(false);
  });

  it('el detector sí reconoce un contexto sin sanear', () => {
    const crudo = JSON.stringify({ name: 'Carmen Santome', bioAge: 62 });
    expect(contienePosibleIdentificador(crudo)).toBe(true);
  });
});
