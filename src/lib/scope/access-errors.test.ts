import { describe, it, expect } from 'vitest';
import {
  mensajeDeErrorDeAcceso,
  MENSAJE_SIN_ACCESO,
  MENSAJE_SIN_SESION,
  MENSAJE_ID_INVALIDO,
  PREFIJOS_CONOCIDOS,
} from './access-errors';
import { AUTH_ERRORS } from '@/lib/auth-guards';

describe('mensajeDeErrorDeAcceso', () => {
  it('traduce cada código real de auth-guards', () => {
    expect(mensajeDeErrorDeAcceso(new Error(AUTH_ERRORS.UNAUTHORIZED))).toBe(MENSAJE_SIN_SESION);
    expect(mensajeDeErrorDeAcceso(new Error(AUTH_ERRORS.FORBIDDEN))).toBe(MENSAJE_SIN_ACCESO);
    expect(mensajeDeErrorDeAcceso(new Error(AUTH_ERRORS.NOT_FOUND))).toBe(MENSAJE_SIN_ACCESO);
    expect(mensajeDeErrorDeAcceso(new Error(AUTH_ERRORS.INVALID_ID))).toBe(MENSAJE_ID_INVALIDO);
  });

  it('cubre TODOS los códigos: si mañana se añade uno, esta prueba lo dice', () => {
    // Sin esto, un código nuevo devolvería null en silencio y el fallo de
    // permisos se presentaría al médico como una avería técnica.
    for (const codigo of Object.values(AUTH_ERRORS)) {
      expect(mensajeDeErrorDeAcceso(new Error(codigo))).not.toBeNull();
    }
  });

  it('los prefijos que traduce coinciden con los códigos declarados', () => {
    for (const prefijo of PREFIJOS_CONOCIDOS) {
      expect(mensajeDeErrorDeAcceso(new Error(`${prefijo}: lo que sea`))).not.toBeNull();
    }
  });

  it('«no es suyo» y «no existe» dan el MISMO texto', () => {
    // Distinguirlos le confirmaría a quien sondea que un identificador existe.
    expect(mensajeDeErrorDeAcceso(new Error(AUTH_ERRORS.FORBIDDEN)))
      .toBe(mensajeDeErrorDeAcceso(new Error(AUTH_ERRORS.NOT_FOUND)));
  });

  it('un error técnico devuelve null: quien llama lo trata como avería', () => {
    expect(mensajeDeErrorDeAcceso(new Error('connect ECONNREFUSED'))).toBeNull();
    expect(mensajeDeErrorDeAcceso(new Error('P2002 Unique constraint failed'))).toBeNull();
  });

  it('no se cuela el texto interno del error en el mensaje al médico', () => {
    // El detalle puede llevar nombres de columna o fragmentos de la consulta.
    const detalle = 'FORBIDDEN: Acceso denegado — patients.tenantId = clinica-x';
    expect(mensajeDeErrorDeAcceso(new Error(detalle))).toBe(MENSAJE_SIN_ACCESO);
    expect(mensajeDeErrorDeAcceso(new Error(detalle))).not.toContain('tenantId');
  });

  it('aguanta lo que no es un Error', () => {
    expect(mensajeDeErrorDeAcceso(null)).toBeNull();
    expect(mensajeDeErrorDeAcceso(undefined)).toBeNull();
    expect(mensajeDeErrorDeAcceso('FORBIDDEN: texto suelto')).toBe(MENSAJE_SIN_ACCESO);
  });
});
