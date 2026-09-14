// Proveedores de transcripcion, detras de una interfaz.
//
// Dos motivos para la indireccion, y ninguno es abstraccion por gusto:
//
// 1. B1 todavia no eligio proveedor. Cambiarlo debe ser cambiar un adaptador,
//    no reescribir la Server Action.
// 2. El adaptador 'echo' permite probar y demostrar el prototipo completo sin
//    que salga un solo byte de audio hacia un tercero. Mientras no haya BAA/DPA
//    firmado, es el unico adaptador que puede usarse con un dictado real.

export interface ResultadoTranscripcion {
  texto: string;
  /** Nombre del adaptador que produjo el texto. Se registra, nunca se infiere. */
  proveedor: string;
  latenciaMs: number;
}

export interface TranscriptionProvider {
  nombre: string;
  /** El audio llega ya como bytes: la conversion desde FormData ocurre una sola vez, en la Server Action. */
  transcribir(audio: Uint8Array, tipoMime: string): Promise<ResultadoTranscripcion>;
}

/** Modelo de Whisper usado por el adaptador de OpenAI. */
export const MODELO_WHISPER = 'whisper-1';

/**
 * Adaptador de desarrollo: no transcribe nada y lo dice.
 *
 * Devuelve un texto fijo reconocible para que nadie confunda una prueba con una
 * transcripcion real. No hay red, no hay clave, no sale PHI.
 */
export function crearProveedorEco(): TranscriptionProvider {
  return {
    nombre: 'echo',
    async transcribir(audio, tipoMime) {
      return {
        texto:
          `[DICTADO DE PRUEBA - no se transcribio audio real] ` +
          `${audio.byteLength} bytes recibidos (${tipoMime}).`,
        proveedor: 'echo',
        latenciaMs: 0,
      };
    },
  };
}

/**
 * Adaptador de OpenAI Whisper.
 *
 * El cliente se construye DENTRO de la funcion, nunca al importar el modulo.
 * `src/lib/openai.ts` hace `throw` en la carga si falta OPENAI_API_KEY: importarlo
 * aqui significaria que un despliegue sin esa clave rompe la aplicacion entera
 * en lugar de deshabilitar solo el dictado.
 */
export function crearProveedorWhisper(apiKey: string): TranscriptionProvider {
  return {
    nombre: MODELO_WHISPER,
    async transcribir(audio, tipoMime) {
      const inicio = Date.now();
      const { default: OpenAI } = await import('openai');
      const cliente = new OpenAI({ apiKey });

      const archivo = new File([new Uint8Array(audio)], 'dictado.webm', { type: tipoMime });

      const respuesta = await cliente.audio.transcriptions.create({
        file: archivo,
        model: MODELO_WHISPER,
        // El vademecum es terminologia propia; sin pista de idioma, Whisper a
        // veces interpreta los nombres en ingles como cambio de idioma.
        language: 'es',
      });

      return {
        texto: respuesta.text ?? '',
        proveedor: MODELO_WHISPER,
        latenciaMs: Date.now() - inicio,
      };
    },
  };
}

/** Nombre de la variable que elige adaptador. */
export const VAR_PROVEEDOR = 'DICTADO_VOZ_PROVEEDOR';

/**
 * Elige el adaptador segun el entorno.
 *
 * Cae a 'echo' cuando se pide Whisper sin clave, en vez de lanzar: un fallo de
 * configuracion debe degradar el dictado, no tumbar la Guia del paciente.
 * El valor por defecto tambien es 'echo' — hacia falta pedir Whisper de forma
 * explicita para que el audio salga a un tercero.
 */
export function seleccionarProveedor(
  entorno: Record<string, string | undefined> = process.env
): TranscriptionProvider {
  const solicitado = (entorno[VAR_PROVEEDOR] ?? 'echo').trim().toLowerCase();

  if (solicitado === 'whisper') {
    const apiKey = entorno.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn(
        `[dictado] ${VAR_PROVEEDOR}=whisper pero falta OPENAI_API_KEY. ` +
        `Se usa el adaptador 'echo': no se transcribira audio real.`
      );
      return crearProveedorEco();
    }
    return crearProveedorWhisper(apiKey);
  }

  return crearProveedorEco();
}
