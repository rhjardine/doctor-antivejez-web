// Reintento de una operacion que puede chocar con otra concurrente.
//
// Separado de Prisma a proposito: recibe la operacion como funcion, asi que se
// prueba la politica de reintento sin base de datos, con una funcion que falla
// las veces que se le indique.
//
// Por que hace falta: `professionals.actions.ts` declara Serializable y su
// comentario afirma que «Prisma hara retry automatico». No es cierto. Prisma no
// reintenta transacciones interactivas ante un error de serializacion; el
// segundo guardado simplemente falla. El aislamiento por si solo convierte un
// doble gasto silencioso en un error visible: mejor, pero todavia malo.

import {
  REINTENTOS_MAXIMOS,
  esChoqueDeSerializacion,
  esperaDeReintento,
} from './credit-rules';

export interface OpcionesDeReintento {
  intentos?: number;
  /** Inyectable para que las pruebas no esperen de verdad. */
  dormir?: (ms: number) => Promise<void>;
  /** Inyectable para que la espera sea determinista en las pruebas. */
  azar?: () => number;
}

const dormirDeVerdad = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Ejecuta `operacion`, repitiendola si choca con otra transaccion.
 *
 * Solo se reintenta un choque de serializacion. Cualquier otro error sube tal
 * cual y de inmediato: reintentar «creditos insuficientes» tres veces seria
 * absurdo, y reintentar un fallo a medio camino podria duplicar un test.
 *
 * Que la operacion sea idempotente es responsabilidad de quien la escribe: aqui
 * se reintenta la transaccion ENTERA, que incluye volver a leer el saldo, de
 * modo que el segundo intento decide sobre el saldo ya actualizado.
 */
export async function conReintentoAnteChoque<T>(
  operacion: () => Promise<T>,
  opciones: OpcionesDeReintento = {}
): Promise<T> {
  const intentos = opciones.intentos ?? REINTENTOS_MAXIMOS;
  const dormir = opciones.dormir ?? dormirDeVerdad;
  const azar = opciones.azar ?? Math.random;

  let ultimoError: unknown;

  for (let intento = 1; intento <= intentos; intento++) {
    try {
      return await operacion();
    } catch (error) {
      ultimoError = error;

      if (!esChoqueDeSerializacion(error)) throw error;

      // En el ultimo intento no se duerme: no hay nada despues que esperar.
      if (intento < intentos) {
        console.warn(
          `[CREDITOS] Choque de serializacion; reintento ${intento} de ${intentos - 1}.`
        );
        await dormir(esperaDeReintento(intento, azar()));
      }
    }
  }

  console.error(
    `[CREDITOS] Agotados los ${intentos} intentos por choques de serializacion.`
  );
  throw ultimoError;
}
