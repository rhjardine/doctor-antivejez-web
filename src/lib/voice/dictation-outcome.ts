// Que hacer con lo que devuelve la Server Action del dictado.
//
// Existe por un fallo concreto y observado en produccion. El boton hacia esto:
//
//     const respuesta = await transcribirDictado(patientId, formData);
//     if (!respuesta.ok || !respuesta.texto) { ... }
//
// Y daba por hecho que una Server Action siempre devuelve su objeto. No siempre:
// si la peticion POST no llega a ejecutarse —algo intermedio (un proxy, una VPN,
// una extension del navegador, un cortafuegos corporativo) responde 403 al envio—
// el cliente de Next entrega `undefined`, y esa linea revienta con
// "Cannot read properties of undefined (reading 'ok')".
//
// Ese mensaje no le dice nada a un medico, y tampoco a quien diagnostica: parece
// un fallo del dictado cuando en realidad el dictado ni siquiera llego al
// servidor. La logica vive aqui, separada del componente, para poder probarla:
// no hay jsdom en esta suite y un componente no seria verificable.

/** Forma minima de lo que devuelve `transcribirDictado`, declarada de forma
 *  estructural para no importar nada desde un modulo `'use server'`. */
export interface RespuestaDictado {
  ok: boolean;
  texto?: string;
  proveedor?: string;
  simulado?: boolean;
  error?: string;
}

export type ResultadoDictado =
  | { tipo: 'texto'; texto: string; simulado: boolean }
  | { tipo: 'error'; mensaje: string; sinRespuesta: boolean };

/** Lo que se muestra cuando la accion no llego a responder. Nombra las causas
 *  reales y comprobables, en vez de culpar al dictado. */
export const MENSAJE_SIN_RESPUESTA =
  'El envío del dictado no llegó al servidor. Suele deberse a una VPN, ' +
  'un proxy o una extensión del navegador que bloquea el envío de audio. ' +
  'Pruebe sin VPN o en una ventana de incógnito.';

export const MENSAJE_GENERICO = 'No se pudo transcribir el dictado.';

/**
 * Traduce la respuesta cruda a lo que la interfaz debe hacer.
 *
 * `undefined` y `null` no son lo mismo que `{ok:false}`: el primero significa
 * que la accion no se ejecuto, el segundo que se ejecuto y rechazo. Se
 * distinguen porque llevan a diagnosticos distintos.
 */
export function interpretarRespuesta(
  respuesta: RespuestaDictado | undefined | null
): ResultadoDictado {
  if (respuesta == null || typeof respuesta !== 'object') {
    return { tipo: 'error', mensaje: MENSAJE_SIN_RESPUESTA, sinRespuesta: true };
  }

  if (!respuesta.ok) {
    return {
      tipo: 'error',
      mensaje: respuesta.error ?? MENSAJE_GENERICO,
      sinRespuesta: false,
    };
  }

  // `ok` sin texto es una incoherencia del servidor, no un exito vacio:
  // aceptarla dejaria al medico ante una propuesta en blanco sin explicacion.
  const texto = respuesta.texto ?? '';
  if (texto.trim() === '') {
    return {
      tipo: 'error',
      mensaje: respuesta.error ?? 'La transcripción llegó vacía. Intente de nuevo.',
      sinRespuesta: false,
    };
  }

  return { tipo: 'texto', texto, simulado: respuesta.simulado === true };
}
