// Alcance de consulta sobre pacientes, en un solo sitio.
//
// Por que existe: la regla de aislamiento estaba escrita correctamente en
// `patients.actions.ts` y NO se aplico en seis modulos mas de Server Actions.
// El resultado fue que `generateReport` devolvia la base de pacientes entera a
// quien la invocara, sin sesion.
//
// La leccion no es "hay que acordarse de filtrar": es que acordarse no escala.
// Este modulo hace imposible construir el filtro sin haber resuelto antes la
// sesion, porque la sesion es el argumento obligatorio.
//
// Logica pura: no lee la sesion ni toca la base. Asi se puede probar sin montar
// NextAuth, y quien la usa sigue siendo responsable de obtener la sesion con
// `requireSession()`.

/** Lo que se necesita de la sesion para decidir el alcance. */
export interface SesionParaAlcance {
  id: string;
  role?: string | null;
  tenantId?: string | null;
}

/** Filtro de Prisma sobre `Patient`. Siempre excluye los borrados logicamente. */
export interface AlcancePacientes {
  deletedAt: null;
  tenantId?: string;
  userId?: string;
}

/**
 * Construye el `where` de pacientes que corresponde a esta sesion.
 *
 * Tres casos, en el mismo orden que `patients.actions.ts`:
 *  - ADMIN: ve todo (hoy es superadmin global; acotarlo por clinica es Fase 3).
 *  - Profesional con tenant: ve los pacientes de su clinica.
 *  - Sin tenant: se aisla por `userId`. Es el fallback heredado, y es lo unico
 *    que mantiene separados a los profesionales actuales, porque `tenantId`
 *    todavia es NULL en todas las filas.
 *
 * `deletedAt: null` no es opcional en ninguna rama: un paciente borrado no
 * reaparece por la puerta de atras de un reporte.
 */
export function alcanceDePacientes(sesion: SesionParaAlcance): AlcancePacientes {
  if (sesion.role === 'ADMIN') {
    return { deletedAt: null };
  }
  if (sesion.tenantId) {
    return { deletedAt: null, tenantId: sesion.tenantId };
  }
  return { deletedAt: null, userId: sesion.id };
}

/**
 * Campos de `Patient` que pueden salir del servidor.
 *
 * Es una lista blanca a proposito. `prisma.patient.findMany` sin `select`
 * devuelve TODOS los escalares, y `Patient` incluye `passwordHash` — el bcrypt
 * con el que el paciente entra en su aplicacion movil. Eso se filtro de verdad
 * a traves de `generateReport`.
 *
 * Si algun dia hace falta un campo mas, se anade aqui de forma deliberada; el
 * olvido por omision deja de ser posible.
 */
export const CAMPOS_PACIENTE_SEGUROS = {
  id: true,
  firstName: true,
  lastName: true,
  identification: true,
  birthDate: true,
  gender: true,
  createdAt: true,
  userId: true,
  tenantId: true,
} as const;

/** Filtro de Prisma sobre `User` (profesionales). */
export interface AlcanceProfesionales {
  deletedAt: null;
  tenantId?: string;
  id?: string;
}

/**
 * Alcance sobre los profesionales, con la misma forma de tres casos.
 *
 * Sin esto, el reporte de rendimiento listaba la plantilla completa de la
 * plataforma: un profesional de una clinica veia los nombres y el volumen de
 * trabajo de los de otra.
 *
 * Sin tenant, un profesional solo se ve a si mismo. Es restrictivo a proposito:
 * mejor un reporte con una fila que uno con la plantilla ajena dentro.
 */
export function alcanceDeProfesionales(sesion: SesionParaAlcance): AlcanceProfesionales {
  if (sesion.role === 'ADMIN') {
    return { deletedAt: null };
  }
  if (sesion.tenantId) {
    return { deletedAt: null, tenantId: sesion.tenantId };
  }
  return { deletedAt: null, id: sesion.id };
}

/**
 * Campos de `User` que pueden salir del servidor.
 *
 * El mismo peligro que en `Patient`, con otro nombre: `User.password` es el
 * bcrypt con el que el profesional entra al sistema, y el reporte de rendimiento
 * lo devolvia porque usaba `include` sin `select`. Tampoco salen `email` ni
 * `permissions`.
 */
export const CAMPOS_PROFESIONAL_SEGUROS = {
  id: true,
  name: true,
  role: true,
  tenantId: true,
} as const;
