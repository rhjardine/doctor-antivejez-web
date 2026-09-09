// src/lib/db.ts
import { PrismaClient } from '@prisma/client';

/**
 * Construye la URL de conexión aplicando los parámetros de pool si están
 * configurados (A6 — preparación para multi-instancia).
 *
 * Prisma lee `connection_limit` y `pool_timeout` de la query string de la URL.
 * Hoy, con una sola instancia en Render, Prisma usa su valor por defecto
 * (núcleos × 2 + 1) y la línea base medida en producción es de 2–3 conexiones
 * activas — muy holgada para el plan basic_1gb.
 *
 * Al pasar a varias instancias el cálculo cambia: cada instancia abre su
 * propio pool, así que el total es `instancias × connection_limit` y debe
 * caber en el límite del plan de Postgres. Dejar esto configurable permite
 * ajustarlo por variable de entorno, sin desplegar código.
 *
 * IMPORTANTE: sin variables configuradas la URL se devuelve intacta, de modo
 * que el comportamiento en producción es exactamente el actual.
 */
function buildDatabaseUrl(): string | undefined {
  const base = process.env.DATABASE_URL;
  if (!base) return undefined;

  const connectionLimit = process.env.DATABASE_CONNECTION_LIMIT;
  const poolTimeout = process.env.DATABASE_POOL_TIMEOUT;

  // Sin parámetros de pool: no se toca la URL.
  if (!connectionLimit && !poolTimeout) return base;

  try {
    const url = new URL(base);
    if (connectionLimit) url.searchParams.set('connection_limit', connectionLimit);
    if (poolTimeout) url.searchParams.set('pool_timeout', poolTimeout);
    return url.toString();
  } catch {
    // Una DATABASE_URL no parseable no debe impedir el arranque: Prisma dará
    // un error más claro que el nuestro.
    console.warn('[db] DATABASE_URL no parseable; se usa sin parámetros de pool');
    return base;
  }
}

const prismaClientSingleton = () => {
  const url = buildDatabaseUrl();
  return url
    ? new PrismaClient({ datasources: { db: { url } } })
    : new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export { prisma };
export const db = prisma;


if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
