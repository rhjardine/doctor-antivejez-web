/**
 * protocol-status.ts — Estado de adherencia a los ítems de la guía (B1)
 *
 * Lógica pura, sin dependencias de Prisma ni de Next, para poder testearla
 * y para que el contrato con la PWA tenga un único punto de definición.
 */

/** Estados que la PWA envía y espera recibir. */
export const ESTADOS_VALIDOS = ['pending', 'completed'] as const;

export type EstadoItem = (typeof ESTADOS_VALIDOS)[number];

/** Estado de un ítem que el paciente nunca ha marcado. */
export const ESTADO_POR_DEFECTO: EstadoItem = 'pending';

/** Fila mínima de ProtocolItemStatus necesaria para resolver el estado. */
export interface RegistroEstado {
  itemId: string;
  status: string;
}

/**
 * Indexa los registros persistidos por `itemId` para consulta O(1).
 *
 * Descarta estados desconocidos en lugar de propagarlos: si un registro
 * quedara con un valor fuera de contrato (migración manual, escritura
 * directa), el ítem vuelve al valor por defecto en vez de romper la PWA.
 */
export function indexarEstados(registros: RegistroEstado[]): Map<string, EstadoItem> {
  const mapa = new Map<string, EstadoItem>();

  for (const registro of registros ?? []) {
    if (!registro?.itemId) continue;
    if (!ESTADOS_VALIDOS.includes(registro.status as EstadoItem)) continue;
    mapa.set(registro.itemId, registro.status as EstadoItem);
  }

  return mapa;
}

/** Resuelve el estado de un ítem, con el valor por defecto si no hay registro. */
export function estadoDeItem(
  estados: Map<string, EstadoItem>,
  itemId: string,
): EstadoItem {
  return estados.get(itemId) ?? ESTADO_POR_DEFECTO;
}

/**
 * Aplica los estados persistidos a los ítems serializados hacia la PWA.
 *
 * Antes de B1, `mobile-profile-v1` fijaba `status: 'pending'` en todos los
 * ítems, así que la adherencia del paciente se perdía al reentrar aunque el
 * PATCH hubiera guardado. Esta función es la otra mitad de la persistencia.
 */
export function aplicarEstados<T extends { id: string; status?: string }>(
  items: T[],
  estados: Map<string, EstadoItem>,
): T[] {
  return (items ?? []).map((item) => ({
    ...item,
    status: estadoDeItem(estados, item.id),
  }));
}
