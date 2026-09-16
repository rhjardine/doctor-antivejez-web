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
  /**
   * Cierto cuando el texto NO procede del audio: es una simulacion.
   *
   * Viaja hasta la interfaz a proposito. Durante la primera prueba en produccion
   * el unico indicio de que el adaptador era 'echo' estaba dentro del propio
   * texto devuelto, y se leyo dos veces como un error del sistema. Un texto que
   * se explica a si mismo no basta: la pantalla tiene que decirlo aparte.
   */
  simulado?: boolean;
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
        simulado: true,
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

/**
 * Adaptador de Whisper AUTOALOJADO.
 *
 * Es el unico que transcribe de verdad sin que el audio salga de la
 * infraestructura propia, y por eso es el camino elegido: cierra la cuestion
 * del acuerdo de tratamiento de datos en vez de gestionarla.
 *
 * El servicio vive en services/whisper/ y se despliega aparte.
 */
export function crearProveedorWhisperLocal(
  baseUrl: string,
  token?: string
): TranscriptionProvider {
  const url = `${baseUrl.replace(/\/+$/, '')}/transcribe`;

  return {
    nombre: 'whisper-local',
    async transcribir(audio, tipoMime) {
      const inicio = Date.now();

      const cuerpo = new FormData();
      cuerpo.append(
        'audio',
        new Blob([new Uint8Array(audio)], { type: tipoMime }),
        'dictado.webm'
      );

      // Un dictado que tarda mas de un minuto ya no sirve en consulta: se corta
      // y se informa, en vez de dejar al medico mirando un boton girando.
      const corte = AbortSignal.timeout(60_000);

      const respuesta = await fetch(url, {
        method: 'POST',
        body: cuerpo,
        headers: token ? { 'X-Whisper-Token': token } : undefined,
        signal: corte,
      });

      if (!respuesta.ok) {
        throw new Error(`whisper-local respondio ${respuesta.status}`);
      }

      const datos = (await respuesta.json()) as { texto?: string; modelo?: string };

      return {
        texto: datos.texto ?? '',
        proveedor: `whisper-local:${datos.modelo ?? '?'}`,
        latenciaMs: Date.now() - inicio,
      };
    },
  };
}

/** Nombre de la variable que elige adaptador. */
export const VAR_PROVEEDOR = 'DICTADO_VOZ_PROVEEDOR';

/**
 * Valores admitidos, en su forma canonica.
 *
 * 'whisper' a secas NO esta aqui: sigue funcionando como alias de
 * 'whisper-openai', pero no se documenta ni se sugiere. Ver ALIAS_AMBIGUOS.
 */
export const PROVEEDORES_VALIDOS = ['echo', 'whisper-local', 'whisper-openai'] as const;

/**
 * Nombres heredados que se aceptan pero avisan.
 *
 * 'whisper' significaba OpenAI, y se confundio en produccion con el servicio
 * autoalojado, que se llama 'whisper-local'. El resultado fue que el audio
 * nunca salio del servicio web y el medico vio un texto de prueba dos veces.
 * El nombre ambiguo fue un error de diseno mio; se corrige renombrando el
 * canonico y dejando el viejo funcionando con un aviso, no rompiendolo.
 */
const ALIAS_AMBIGUOS: Record<string, string> = { whisper: 'whisper-openai' };

/**
 * Elige el adaptador segun el entorno.
 *
 * Cae a 'echo' cuando la configuracion esta incompleta, en vez de lanzar: un
 * fallo de configuracion debe degradar el dictado, no tumbar la Guia del
 * paciente. El valor por defecto tambien es 'echo' — hace falta pedir un
 * proveedor real de forma explicita para que se transcriba audio, y pedir
 * 'whisper-openai' de forma explicita para que salga hacia un tercero.
 */
export function seleccionarProveedor(
  entorno: Record<string, string | undefined> = process.env
): TranscriptionProvider {
  const pedido = (entorno[VAR_PROVEEDOR] ?? 'echo').trim().toLowerCase();

  const canonico = ALIAS_AMBIGUOS[pedido] ?? pedido;
  if (canonico !== pedido) {
    console.warn(
      `[dictado] ${VAR_PROVEEDOR}='${pedido}' es un nombre ambiguo y se interpreta ` +
      `como '${canonico}' (OpenAI, el audio SALE de la infraestructura propia). ` +
      `Para el servicio autoalojado el valor es 'whisper-local'.`
    );
  }

  if (canonico === 'whisper-local') {
    const baseUrl = entorno.WHISPER_URL;
    if (!baseUrl) {
      console.warn(
        `[dictado] ${VAR_PROVEEDOR}=whisper-local pero falta WHISPER_URL. ` +
        `Se usa el adaptador 'echo': no se transcribira audio real.`
      );
      return crearProveedorEco();
    }
    return crearProveedorWhisperLocal(baseUrl, entorno.WHISPER_TOKEN);
  }

  if (canonico === 'whisper-openai') {
    const apiKey = entorno.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn(
        `[dictado] ${VAR_PROVEEDOR}=${canonico} pero falta OPENAI_API_KEY. ` +
        `Se usa el adaptador 'echo': no se transcribira audio real.`
      );
      return crearProveedorEco();
    }
    return crearProveedorWhisper(apiKey);
  }

  // Un valor no reconocido caia a 'echo' en absoluto silencio. Una errata como
  // 'whisper_local' o 'Whisper Local' dejaba el dictado simulado sin que nada lo
  // dijera en los logs, que es justo como se pierde una tarde de diagnostico.
  if (canonico !== 'echo') {
    console.warn(
      `[dictado] ${VAR_PROVEEDOR}='${pedido}' no es un valor reconocido. ` +
      `Se usa el adaptador 'echo': no se transcribira audio real. ` +
      `Valores admitidos: ${PROVEEDORES_VALIDOS.join(', ')}.`
    );
  }

  return crearProveedorEco();
}
