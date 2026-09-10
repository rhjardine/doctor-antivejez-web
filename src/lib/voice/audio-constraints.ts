// Limites del audio de dictado.
//
// Viven fuera de voice.actions.ts a proposito: un archivo 'use server' solo
// deberia exportar funciones asincronas, porque cada export se convierte en un
// punto de entrada invocable desde el cliente. Una constante ahi funciona hoy y
// es una trampa manana.

/** Tamano maximo de un dictado. 60 s en Opus rondan los 120 KB; 5 MB es holgado. */
export const MAX_BYTES_DICTADO = 5 * 1024 * 1024;

/** Formatos que produce MediaRecorder en los navegadores que usa la consulta. */
export const MIME_ACEPTADOS = [
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
] as const;

/** Compara ignorando los parametros de codec ("audio/webm;codecs=opus"). */
export function mimeAceptado(tipo: string): boolean {
  const base = tipo.split(';')[0].trim().toLowerCase();
  return (MIME_ACEPTADOS as readonly string[]).includes(base);
}
