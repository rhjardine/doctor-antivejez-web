// Traduccion de los errores de los guards a mensajes para el medico.
//
// Los guards lanzan errores con codigo (`UNAUTHORIZED:`, `FORBIDDEN:`, ...).
// Las Server Actions que devuelven `{ success, error }` los atrapan en un
// `catch` generico, y sin esta pieza un fallo de autorizacion acababa
// presentandose como un fallo tecnico: «inténtelo de nuevo más tarde» manda a
// reintentar algo que no va a funcionar nunca.
//
// Que NO se hace aqui: distinguir «no existe» de «no es suyo». Ambos casos dan
// el mismo texto a proposito; separarlos le confirmaria a quien sondea que un
// identificador concreto existe en la base.

import { AUTH_ERRORS } from '@/lib/auth-guards';

/** El texto que ve el medico. Igual para prohibido y para no encontrado. */
export const MENSAJE_SIN_ACCESO =
  'No tiene acceso a este paciente, o el registro no existe.';

export const MENSAJE_SIN_SESION =
  'Su sesión ha caducado. Vuelva a iniciar sesión.';

export const MENSAJE_ID_INVALIDO = 'La solicitud no es válida.';

/**
 * Devuelve el mensaje que corresponde al error, o null si no es de acceso
 * —en cuyo caso quien llama debe seguir tratandolo como error tecnico.
 */
export function mensajeDeErrorDeAcceso(error: unknown): string | null {
  const mensaje = error instanceof Error ? error.message : String(error ?? '');

  if (mensaje.startsWith('UNAUTHORIZED')) return MENSAJE_SIN_SESION;
  if (mensaje.startsWith('FORBIDDEN') || mensaje.startsWith('NOT_FOUND')) {
    return MENSAJE_SIN_ACCESO;
  }
  if (mensaje.startsWith('INVALID_INPUT')) return MENSAJE_ID_INVALIDO;

  return null;
}

/**
 * Comprobacion de que los prefijos de arriba siguen coincidiendo con los codigos
 * reales de `auth-guards`. Si alguien renombra un codigo, esta lista deja de
 * cuadrar y la prueba lo dice; sin esto, `mensajeDeErrorDeAcceso` empezaria a
 * devolver null en silencio y los fallos de permisos volverian a presentarse
 * como averias tecnicas.
 */
export const PREFIJOS_CONOCIDOS = Object.values(AUTH_ERRORS).map(
  (codigo) => codigo.split(':')[0]
);
