// Deteccion de transcripciones degeneradas.
//
// Whisper, como todo decodificador autorregresivo, puede entrar en bucle y
// emitir la misma secuencia una y otra vez. Ocurrio en produccion: el medico
// dicto dos minutos y recibio
//
//     "Adrenales, Aceite de ricino, Adrenales, Antiviral c-Limon,
//      Aceite de ricino, Adrenales, Antiviral c-Limon, ..."
//
// repetido hasta el final. No era su voz: el modelo continuaba la lista de
// terminos del vademecum que se le pasa como initial_prompt.
//
// Las causas concretas se corrigieron en services/whisper/app.py. Esta
// comprobacion es la segunda linea: un modelo siempre puede tropezar, y
// entregarle a un medico una pared de nombres de producto repetidos COMO SI
// fueran sus palabras es peor que decirle que hubo un fallo. Ademas es
// independiente del proveedor, asi que protege tambien si algun dia se cambia.
//
// Se equivoca hacia el lado seguro: los umbrales estan puestos para no marcar
// nunca un dictado clinico real, aunque eso deje pasar algun bucle leve.

/** Por debajo de esta longitud no se juzga: un texto corto repite de forma legitima. */
export const MINIMO_PALABRAS = 40;

/** Fraccion de palabras distintas. El habla humana rara vez baja de 0,30. */
export const UMBRAL_VARIEDAD = 0.18;

/**
 * Cuota del trigrama mas frecuente sobre el total de trigramas.
 *
 * Calibrado, no elegido a ojo: un bucle de periodo P repetido muchas veces da
 * una cuota de aproximadamente 1/P, asi que 0,15 solo habria cazado bucles de
 * seis palabras o menos. Con 0,08 se alcanzan los de hasta doce palabras,
 * mientras un dictado real largo deja cuotas por debajo de 0,03.
 */
export const UMBRAL_TRIGRAMA = 0.08;

/** Veces que ha de aparecer ese trigrama para tenerlo en cuenta. */
export const MINIMO_REPETICIONES = 8;

export interface DiagnosticoTranscripcion {
  degenerada: boolean;
  /** Palabras distintas / palabras totales. 1 = ninguna repeticion. */
  variedad: number;
  /** Cuota del trigrama dominante. 0 cuando el texto es demasiado corto. */
  cuotaTrigrama: number;
  palabras: number;
}

function tokenizar(texto: string): string[] {
  const limpio = texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return limpio === '' ? [] : limpio.split(' ');
}

/**
 * Analiza el texto sin decidir nada por su cuenta.
 *
 * Se devuelven las metricas ademas del veredicto para que el registro pueda
 * explicar POR QUE se rechazo sin escribir el contenido, que es PHI.
 */
export function diagnosticarTranscripcion(texto: string): DiagnosticoTranscripcion {
  const palabras = tokenizar(texto);
  const total = palabras.length;

  if (total < MINIMO_PALABRAS) {
    return { degenerada: false, variedad: 1, cuotaTrigrama: 0, palabras: total };
  }

  const variedad = new Set(palabras).size / total;

  // Trigramas: un bucle de frases cortas puede mantener una variedad de
  // palabras enganosamente alta mientras repite la misma secuencia.
  const conteo = new Map<string, number>();
  for (let i = 0; i + 3 <= total; i++) {
    const tri = `${palabras[i]} ${palabras[i + 1]} ${palabras[i + 2]}`;
    conteo.set(tri, (conteo.get(tri) ?? 0) + 1);
  }
  const totalTrigramas = total - 2;

  let maximo = 0;
  conteo.forEach((veces) => {
    if (veces > maximo) maximo = veces;
  });
  const cuotaTrigrama = totalTrigramas > 0 ? maximo / totalTrigramas : 0;

  const degenerada =
    variedad < UMBRAL_VARIEDAD ||
    (maximo >= MINIMO_REPETICIONES && cuotaTrigrama >= UMBRAL_TRIGRAMA);

  return { degenerada, variedad, cuotaTrigrama, palabras: total };
}

/** Atajo para quien solo necesita el veredicto. */
export function esDegenerada(texto: string): boolean {
  return diagnosticarTranscripcion(texto).degenerada;
}

/** Lo que se le dice al medico. No le culpa a el ni al dictado: describe el fallo. */
export const MENSAJE_DEGENERADA =
  'La transcripción salió repetida en bucle y se descartó: no reflejaba lo dictado. ' +
  'Vuelva a intentarlo; si se repite, avise para revisar el modelo de transcripción.';
