/**
 * api-guards.ts — Traducción de errores de guard a respuestas HTTP
 *
 * Los guards de `auth-guards.ts` lanzan errores con códigos semánticos
 * (UNAUTHORIZED, FORBIDDEN, NOT_FOUND, INVALID_INPUT). Este helper los convierte
 * en la respuesta HTTP correcta, para que cada route handler no repita el mismo
 * try/catch ni invente sus propios códigos de estado.
 */

import { NextResponse } from 'next/server';

/**
 * Convierte un error de guard en su respuesta HTTP.
 *
 * Nunca propaga el mensaje interno al cliente: devuelve textos genéricos para
 * no filtrar si un recurso existe o a quién pertenece.
 */
export function guardErrorResponse(
  error: unknown,
  headers: Record<string, string> = {},
): NextResponse {
  const message = error instanceof Error ? error.message : '';

  if (message.startsWith('UNAUTHORIZED')) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401, headers });
  }
  if (message.startsWith('NOT_FOUND')) {
    return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404, headers });
  }
  if (message.startsWith('INVALID_INPUT')) {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400, headers });
  }
  return NextResponse.json({ error: 'Acceso denegado' }, { status: 403, headers });
}
