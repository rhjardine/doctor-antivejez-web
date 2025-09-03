// src/lib/actions/notifications.actions.ts
'use server';

// Placeholder para futuras funcionalidades de notificaciones.
// La existencia de este archivo resuelve el error de build "Module not found".

export async function getNotificationsForUser(userId: string) {
  console.log(`Buscando notificaciones para el usuario: ${userId}`);
  // En el futuro, aquí iría la lógica de Prisma para obtener las notificaciones.
  return { success: true, notifications: [] };
}