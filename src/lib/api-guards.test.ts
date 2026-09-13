/**
 * api-guards.test.ts — Regresión del mapeo de errores de guard a HTTP
 *
 * Cubre el contrato que usan los endpoints blindados en la PISTA S: un fallo de
 * autenticación debe responder 401, uno de autorización 403, y en ningún caso
 * puede filtrarse el mensaje interno del guard al cliente.
 */

import { describe, expect, it } from 'vitest';
import { AUTH_ERRORS } from './auth-guards';
import { guardErrorResponse } from './api-guards';

const leerCuerpo = async (res: Response) => (await res.json()) as { error: string };

describe('guardErrorResponse', () => {
  it('UNAUTHORIZED → 401', async () => {
    const res = guardErrorResponse(new Error(AUTH_ERRORS.UNAUTHORIZED));
    expect(res.status).toBe(401);
    expect((await leerCuerpo(res)).error).toBe('No autenticado');
  });

  it('FORBIDDEN → 403', async () => {
    const res = guardErrorResponse(new Error(AUTH_ERRORS.FORBIDDEN));
    expect(res.status).toBe(403);
    expect((await leerCuerpo(res)).error).toBe('Acceso denegado');
  });

  it('NOT_FOUND → 404', async () => {
    const res = guardErrorResponse(new Error(AUTH_ERRORS.NOT_FOUND));
    expect(res.status).toBe(404);
  });

  it('INVALID_INPUT → 400', async () => {
    const res = guardErrorResponse(new Error(AUTH_ERRORS.INVALID_ID));
    expect(res.status).toBe(400);
  });

  it('un error inesperado no se trata como autenticado', async () => {
    const res = guardErrorResponse(new Error('fallo interno de base de datos'));
    expect(res.status).toBe(403);
  });

  it('nunca filtra el mensaje interno al cliente', async () => {
    const res = guardErrorResponse(
      new Error('FORBIDDEN: el paciente cmssz8npj pertenece al tenant clinica-x'),
    );
    const cuerpo = await leerCuerpo(res);

    expect(cuerpo.error).toBe('Acceso denegado');
    expect(JSON.stringify(cuerpo)).not.toContain('cmssz8npj');
    expect(JSON.stringify(cuerpo)).not.toContain('clinica-x');
  });

  it('propaga las cabeceras CORS que recibe', () => {
    const res = guardErrorResponse(new Error(AUTH_ERRORS.UNAUTHORIZED), {
      'Access-Control-Allow-Origin': 'https://doctorantivejez-patients.onrender.com',
    });

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://doctorantivejez-patients.onrender.com',
    );
  });
});
