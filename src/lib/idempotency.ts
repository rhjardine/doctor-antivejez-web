import { db } from "@/lib/db";

/**
 * Maneja peticiones idempotentes.
 * Si se proporciona una clave, verifica si ya existe una respuesta procesada.
 * Si existe, devuelve la respuesta en caché.
 * Si no existe, ejecuta la petición y guarda el resultado antes de devolverlo.
 *
 * @param key Clave única de idempotencia (por ejemplo, un UUID v4)
 * @param executeRequest Función asíncrona que contiene la lógica de negocio real
 * @returns La respuesta de la petición (cacheada o recién calculada)
 */
export async function handleIdempotentRequest<T>(
  key: string | null | undefined,
  executeRequest: () => Promise<T>
): Promise<T> {
  if (!key) {
    // Si no hay clave proporcionada, ejecutamos la petición normalmente sin caché.
    return await executeRequest();
  }

  // 1. Verificar si la clave ya fue procesada (Fail-Fast)
  const existingRequest = await db.idempotencyKey.findUnique({
    where: { key },
  });

  if (existingRequest) {
    // 2. Retornar respuesta cacheada para que el cliente la procese como exitosa
    console.log(`[Idempotency] Devolviendo respuesta cacheada para key: ${key}`);
    return existingRequest.response as T;
  }

  // 3. Ejecutar la lógica de negocio
  const response = await executeRequest();

  // 4. Guardar la respuesta original
  try {
    await db.idempotencyKey.create({
      data: {
        key,
        response: response as any, // Cast a any para JSON compatible con Prisma
      },
    });
  } catch (error) {
    // Si ocurre un error de concurrencia P2002 (violación de unicidad), significa que
    // otra petición con la misma llave se procesó al mismo tiempo y la insertó.
    // En este caso, ya ejecutamos executeRequest, lo cual podría haber creado duplicados si
    // la lógica de executeRequest no previene duplicados concurrentes en la DB. 
    // Idealmente, se debe manejar un lock o transacción distribuida, pero a este nivel, 
    // la mitigación principal es el `findUnique` inicial.
    console.error(`[Idempotency] Error al intentar guardar la clave ${key}:`, error);
  }

  return response;
}
