// Kill switch del dictado por voz.
//
// Apagado por defecto, y esto es deliberado: mergear B2 no debe encender nada
// en produccion. El dictado se activa cuando el medico lo decide, no cuando el
// codigo llega a main.
//
// Ademas de la conveniencia operativa, hay una puerta legal: el audio de un
// dictado clinico es PHI aunque no se pronuncie el nombre del paciente. El flag
// no se enciende con proveedor externo hasta que exista BAA/DPA firmado.

/** Nombre de la variable de entorno del servidor. */
export const VAR_FLAG_SERVIDOR = 'DICTADO_VOZ_ENABLED';

/** Nombre de la variable expuesta al cliente, para que la UI no muestre lo que el servidor rechazaria. */
export const VAR_FLAG_CLIENTE = 'NEXT_PUBLIC_DICTADO_VOZ_ENABLED';

/**
 * Interpreta el valor de un flag. Solo 'true' y '1' encienden.
 * Cualquier otra cosa —incluidas 'yes', 'on' o basura— deja el dictado apagado:
 * ante la duda, la funcion que envia audio a un tercero se queda quieta.
 */
export function flagEncendido(valor: string | undefined | null): boolean {
  if (!valor) return false;
  const normalizado = valor.trim().toLowerCase();
  return normalizado === 'true' || normalizado === '1';
}

/** Estado del dictado en el servidor. Es la unica comprobacion con autoridad. */
export function dictadoHabilitadoEnServidor(
  entorno: Record<string, string | undefined> = process.env
): boolean {
  return flagEncendido(entorno[VAR_FLAG_SERVIDOR]);
}

/**
 * Estado del dictado segun el cliente. Solo decide si se pinta el boton.
 * Nunca es una autorizacion: la Server Action vuelve a comprobar el flag del
 * servidor, porque una variable NEXT_PUBLIC_* viaja al navegador y ahi cualquiera
 * puede cambiarla.
 *
 * La variable se lee como acceso literal a proceso.env y no por indice. Next
 * sustituye `process.env.NEXT_PUBLIC_X` en tiempo de compilacion solo cuando
 * aparece escrita asi; con `process.env[variable]` no hay sustitucion y en el
 * navegador saldria siempre `undefined`, dejando el boton invisible aunque el
 * flag estuviera encendido.
 */
export function dictadoHabilitadoEnCliente(): boolean {
  return flagEncendido(process.env.NEXT_PUBLIC_DICTADO_VOZ_ENABLED);
}
