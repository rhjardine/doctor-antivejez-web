// Cobro de un credito dentro de una transaccion serializable.
//
// La atomicidad importa: el debito y la creacion del test tienen que ocurrir en
// la MISMA transaccion. Si el test falla despues de cobrar, el credito debe
// volver; si el cobro falla, el test no debe existir. Por eso esto no envuelve
// la transaccion entera —la deja abierta para que quien llama meta dentro su
// propia escritura— y el envoltorio con reintento va aparte.

import { Prisma, type TestType } from '@prisma/client';
import { prisma } from '@/lib/db';
import { conReintentoAnteChoque } from './with-retry';
import {
  type ActorDelCobro,
  quienPagaElCredito,
  requiereCredito,
  mensajeSinSaldo,
} from './credit-rules';

/**
 * Comprueba el saldo y descuenta un credito, dentro de la transaccion recibida.
 *
 * `tx` lleva el tipo de Prisma a proposito, no una interfaz propia mas laxa:
 * asi el `where` y el `data` de abajo se comprueban de verdad y un nombre de
 * columna mal escrito no pasa. Las pruebas montan un doble y lo convierten.
 *
 * No abre transaccion propia: debe correr dentro de la misma que crea el test.
 * Quien llama usa `enTransaccionDeCredito` para obtenerla con el aislamiento y
 * el reintento correctos.
 *
 * Lanza si no hay saldo. El `throw` dentro de una transaccion de Prisma hace
 * rollback, que es justo lo que se quiere: sin credito no hay test.
 */
export async function cobrarCredito(
  tx: Prisma.TransactionClient,
  actor: ActorDelCobro,
  testType: TestType,
  descripcion: string
): Promise<{ cobrado: boolean }> {
  if (!requiereCredito(actor)) {
    return { cobrado: false };
  }

  const pagador = quienPagaElCredito(actor);

  const agregado = await tx.creditTransaction.aggregate({
    where: { userId: pagador, testType },
    _sum: { amount: true },
  });
  // `_sum` puede venir ausente: Prisma lo declara opcional. Tratarlo como 0
  // sería leerlo como «sin saldo», así que se distingue de forma explícita.
  const saldo = agregado._sum?.amount ?? 0;

  if (saldo <= 0) {
    throw new Error(mensajeSinSaldo(testType, saldo));
  }

  await tx.creditTransaction.create({
    data: { userId: pagador, testType, amount: -1, description: descripcion },
  });

  return { cobrado: true };
}

/**
 * Abre una transaccion con el aislamiento correcto y reintenta si choca.
 *
 * `Serializable` es lo que impide el doble gasto. Sin el, el `SUM` del saldo se
 * ejecuta en Read Committed y no bloquea las filas que todavia no existen: dos
 * guardados simultaneos leen el mismo saldo, los dos pasan la comprobacion y
 * los dos insertan.
 *
 * El reintento es lo que impide que el arreglo se note como un error. Prisma NO
 * reintenta transacciones interactivas, aunque un comentario del codigo
 * anterior afirmara lo contrario.
 */
export async function enTransaccionDeCredito<T>(
  operacion: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return conReintentoAnteChoque(() =>
    prisma.$transaction(operacion, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    })
  );
}
