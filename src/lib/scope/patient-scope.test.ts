import { describe, it, expect } from 'vitest';
import {
  alcanceDePacientes,
  alcanceDeProfesionales,
  CAMPOS_PACIENTE_SEGUROS,
  CAMPOS_PROFESIONAL_SEGUROS,
} from './patient-scope';

describe('alcanceDePacientes', () => {
  it('ADMIN ve todo, pero nunca los borrados', () => {
    expect(alcanceDePacientes({ id: 'u1', role: 'ADMIN', tenantId: null }))
      .toEqual({ deletedAt: null });
  });

  it('un profesional con clínica ve la suya', () => {
    expect(alcanceDePacientes({ id: 'u2', role: 'MEDICO', tenantId: 'clinica-a' }))
      .toEqual({ deletedAt: null, tenantId: 'clinica-a' });
  });

  it('sin clínica se aísla por usuario: es el fallback heredado', () => {
    // Hoy `tenantId` es NULL en todas las filas, así que esta rama es la única
    // que mantiene separados a los profesionales actuales.
    expect(alcanceDePacientes({ id: 'u3', role: 'COACH', tenantId: null }))
      .toEqual({ deletedAt: null, userId: 'u3' });
  });

  it('un COACH de otra clínica no alcanza la clínica ajena', () => {
    const a = alcanceDePacientes({ id: 'u4', role: 'COACH', tenantId: 'clinica-a' });
    const b = alcanceDePacientes({ id: 'u5', role: 'COACH', tenantId: 'clinica-b' });
    expect(a).not.toEqual(b);
    expect(a.tenantId).toBe('clinica-a');
  });

  it('deletedAt: null está en TODAS las ramas, sin excepción', () => {
    // Un paciente borrado no debe reaparecer por la puerta de atrás de un reporte.
    const casos = [
      { id: 'u1', role: 'ADMIN', tenantId: 'x' },
      { id: 'u2', role: 'MEDICO', tenantId: 'x' },
      { id: 'u3', role: 'COACH', tenantId: null },
      { id: 'u4', role: undefined, tenantId: undefined },
    ];
    for (const sesion of casos) {
      expect(alcanceDePacientes(sesion).deletedAt).toBeNull();
    }
  });

  it('un rol desconocido cae en el caso más restrictivo, no en el más amplio', () => {
    // Si mañana aparece un rol nuevo, el fallo debe ser hacia el lado seguro.
    expect(alcanceDePacientes({ id: 'u9', role: 'ROL_NUEVO', tenantId: null }))
      .toEqual({ deletedAt: null, userId: 'u9' });
  });

  it('una cadena vacía como tenantId no abre la clínica entera', () => {
    // '' es falsy: debe caer al aislamiento por usuario, no producir tenantId: ''.
    expect(alcanceDePacientes({ id: 'u10', role: 'MEDICO', tenantId: '' }))
      .toEqual({ deletedAt: null, userId: 'u10' });
  });
});

describe('CAMPOS_PACIENTE_SEGUROS', () => {
  it('NO incluye passwordHash: es el bcrypt de la app del paciente', () => {
    // `findMany` sin `select` devuelve todos los escalares, y así se filtró a
    // través de generateReport. La lista blanca lo hace imposible por omisión.
    expect(Object.keys(CAMPOS_PACIENTE_SEGUROS)).not.toContain('passwordHash');
  });

  it('no incluye datos de contacto ni notas clínicas', () => {
    const prohibidos = ['password', 'passwordHash', 'email', 'phone', 'address', 'observations'];
    for (const campo of prohibidos) {
      expect(Object.keys(CAMPOS_PACIENTE_SEGUROS)).not.toContain(campo);
    }
  });

  it('sí trae lo necesario para identificar al paciente en un listado', () => {
    for (const campo of ['id', 'firstName', 'lastName', 'createdAt']) {
      expect(CAMPOS_PACIENTE_SEGUROS).toHaveProperty(campo, true);
    }
  });

  it('todos los campos están en true: un false silencioso no filtraría nada', () => {
    expect(Object.values(CAMPOS_PACIENTE_SEGUROS).every(v => v === true)).toBe(true);
  });
});

describe('alcanceDeProfesionales', () => {
  it('ADMIN ve la plantilla completa, menos los borrados', () => {
    expect(alcanceDeProfesionales({ id: 'u1', role: 'ADMIN', tenantId: 'x' }))
      .toEqual({ deletedAt: null });
  });

  it('con clínica ve a los de su clínica', () => {
    expect(alcanceDeProfesionales({ id: 'u2', role: 'MEDICO', tenantId: 'clinica-a' }))
      .toEqual({ deletedAt: null, tenantId: 'clinica-a' });
  });

  it('sin clínica un profesional sólo se ve a sí mismo', () => {
    // Restrictivo a propósito: mejor un reporte con una fila que uno con la
    // plantilla ajena dentro. Es lo que hacía antes el reporte de rendimiento.
    expect(alcanceDeProfesionales({ id: 'u3', role: 'MEDICO', tenantId: null }))
      .toEqual({ deletedAt: null, id: 'u3' });
  });

  it('nunca devuelve un filtro vacío para un no-ADMIN', () => {
    // Un `where` sin nada dentro es exactamente el fallo original: lista todo.
    for (const rol of ['MEDICO', 'COACH', 'ADMINISTRATIVO', 'ROL_NUEVO', undefined]) {
      const filtro = alcanceDeProfesionales({ id: 'u4', role: rol, tenantId: null });
      expect(Object.keys(filtro).length).toBeGreaterThan(1);
    }
  });
});

describe('CAMPOS_PROFESIONAL_SEGUROS', () => {
  it('NO incluye password: es el bcrypt con el que entra el profesional', () => {
    // El reporte de rendimiento usaba `include` sin `select`, así que devolvía
    // todos los escalares de User. Es la misma fuga que en Patient.
    expect(Object.keys(CAMPOS_PROFESIONAL_SEGUROS)).not.toContain('password');
  });

  it('no incluye email ni permisos', () => {
    for (const campo of ['email', 'permissions', 'emailVerified']) {
      expect(Object.keys(CAMPOS_PROFESIONAL_SEGUROS)).not.toContain(campo);
    }
  });

  it('sí trae lo necesario para nombrar al profesional en una tabla', () => {
    for (const campo of ['id', 'name']) {
      expect(CAMPOS_PROFESIONAL_SEGUROS).toHaveProperty(campo, true);
    }
  });
});
