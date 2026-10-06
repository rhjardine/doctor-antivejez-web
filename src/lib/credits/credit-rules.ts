// Reglas de cobro de creditos, en un solo sitio y como logica pura.
//
// Por que existe: habia CINCO lugares cobrando creditos, con DOS
// implementaciones distintas del mismo cobro, y ninguna correcta del todo.
//
//   biophysics / biochemistry / orthomolecular / genetics
//       `$transaction` sin `isolationLevel`, o sea Read Committed. Un `SUM` no
//       bloquea filas que todavia no existen, asi que dos guardados simultaneos
//       leen el mismo saldo, ambos pasan la comprobacion y ambos insertan.
//       Doble gasto, reproducible con dos clics rapidos.
//
//   professionals.actions::consumeTestCredit
//       Si declara Serializable, pero su comentario afirma que «Prisma hara
//       retry automatico». No lo hace: Prisma no reintenta transacciones
//       interactivas ante un error de serializacion. El segundo guardado
//       simplemente falla y el profesional ve un error tecnico.
//
// Y las cuatro primeras cobraban a quien NO correspondia (ver abajo).
//
// Logica pura, sin Prisma ni sesion: se prueba sin base de datos, y quien la
// usa sigue siendo responsable de resolver la sesion antes.

/** Lo que se necesita de la sesion para decidir el cobro. */
export interface ActorDelCobro {
  id: string;
  role?: string | null;
}

/**
 * Quien paga el credito.
 *
 * Es el profesional que ACTUA, no el dueño del paciente.
 *
 * El codigo anterior hacia `const doctorId = patient.user.id` y debitaba ahi,
 * mientras que el test se guardaba con `doctorId: session.user.id`. Es decir:
 * el registro decia «lo hice yo» y el credito salia del saldo de otro. Con
 * varios profesionales en una misma clinica, uno podia vaciar el saldo de un
 * colega sin enterarse ninguno de los dos.
 */
export function quienPagaElCredito(actor: ActorDelCobro): string {
  return actor.id;
}

/**
 * Si esta operacion consume credito.
 *
 * La exencion mira el rol de QUIEN ACTUA. Antes miraba el rol del DUEÑO del
 * paciente, de modo que los pacientes cuyo dueño es el administrador salian
 * gratis para cualquiera que los abriera.
 *
 * CUIDADO AL CAMBIAR ESTO. Hoy, en produccion, el medico principal es ADMIN y
 * es el dueño de los 4154 pacientes heredados: con la regla antigua su consumo
 * es cero, y con esta tambien, porque sigue siendo ADMIN. Esa coincidencia es
 * lo que hace que este arreglo no le cambie nada. Si alguien quita la exencion
 * de ADMIN sin comprobar antes su saldo, dejara de poder guardar tests.
 */
export function requiereCredito(actor: ActorDelCobro): boolean {
  return actor.role !== 'ADMIN';
}

/** Cuantas veces se reintenta una transaccion que choco con otra. */
export const REINTENTOS_MAXIMOS = 3;

/**
 * Codigos con los que PostgreSQL y Prisma avisan de un choque de serializacion.
 *
 * - P2034 es el codigo de Prisma para «transaction failed due to a write
 *   conflict or a deadlock».
 * - 40001 es `serialization_failure` de PostgreSQL, y 40P01 `deadlock_detected`.
 *   Aparecen cuando el error llega sin envolver.
 */
const CODIGOS_DE_CHOQUE = ['P2034', '40001', '40P01'];

/**
 * Si conviene reintentar este error.
 *
 * Un choque de serializacion NO es un fallo: es el aislamiento haciendo
 * exactamente su trabajo. La transaccion perdedora debe repetirse, y entonces
 * leera el saldo ya actualizado. Sin reintento, el aislamiento convierte un
 * doble gasto silencioso en un error visible —mejor, pero todavia malo.
 */
export function esChoqueDeSerializacion(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const codigo = (error as { code?: unknown }).code;
  if (typeof codigo === 'string' && CODIGOS_DE_CHOQUE.includes(codigo)) {
    return true;
  }

  // Algunos errores llegan con el codigo dentro del mensaje en lugar de en
  // `code`, segun por donde pasen. Se mira tambien ahi antes de rendirse.
  const mensaje = (error as { message?: unknown }).message;
  if (typeof mensaje === 'string') {
    return CODIGOS_DE_CHOQUE.some((c) => mensaje.includes(c));
  }

  return false;
}

/**
 * Espera antes del siguiente intento, en milisegundos.
 *
 * Crece con el intento y lleva algo de azar: si dos transacciones reintentaran
 * exactamente a la vez, volverian a chocar entre ellas indefinidamente.
 */
export function esperaDeReintento(intento: number, azar: number = Math.random()): number {
  const base = 25 * Math.pow(2, Math.max(0, intento - 1));
  return Math.round(base + azar * base);
}

/** El mensaje que ve el profesional cuando no hay saldo. */
export function mensajeSinSaldo(tipoTest: string, saldo: number): string {
  return `Créditos insuficientes para ${tipoTest}. Saldo: ${saldo}. Contacte al administrador.`;
}
