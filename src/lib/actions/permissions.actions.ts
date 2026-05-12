'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ModuleKey } from "@/lib/permissions";

/**
 * Actualiza el permiso de un módulo específico para un usuario.
 * Solo accesible por ADMIN.
 */
export async function updateUserModulePermission(targetUserId: string, module: ModuleKey, enabled: boolean) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: "No autorizado. Se requiere rol de Administrador." };
    }

    const adminId = session.user.id;

    // Obtener permisos actuales
    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      select: { permissions: true }
    });

    if (!targetUser) {
      return { success: false, error: "Usuario no encontrado." };
    }

    const currentPermissions = (targetUser.permissions as Record<string, boolean>) || {};
    const oldValue = currentPermissions[module] ?? null;

    const newPermissions = {
      ...currentPermissions,
      [module]: enabled
    };

    // Usamos una transacción para asegurar la atomicidad de la actualización y el log
    await db.$transaction([
      db.user.update({
        where: { id: targetUserId },
        data: { permissions: newPermissions }
      }),
      db.userPermissionLog.create({
        data: {
          userId: targetUserId,
          changedBy: adminId,
          module: module,
          oldValue: oldValue,
          newValue: enabled
        }
      })
    ]);

    return { success: true };
  } catch (error) {
    console.error("[PermissionsAction] Error updating module permission:", error);
    return { success: false, error: "Error interno del servidor." };
  }
}

/**
 * Actualiza la cuota de tests disponibles de un usuario.
 * Solo accesible por ADMIN.
 */
export async function updateUserTestQuota(targetUserId: string, newQuota: number) {
  try {
    if (newQuota < 0) {
      return { success: false, error: "La cuota no puede ser negativa." };
    }

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: "No autorizado. Se requiere rol de Administrador." };
    }

    const adminId = session.user.id;

    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      select: { availableTests: true }
    });

    if (!targetUser) {
      return { success: false, error: "Usuario no encontrado." };
    }

    const oldValueInt = targetUser.availableTests;

    await db.$transaction([
      db.user.update({
        where: { id: targetUserId },
        data: { availableTests: newQuota }
      }),
      db.userPermissionLog.create({
        data: {
          userId: targetUserId,
          changedBy: adminId,
          module: "TEST_QUOTA",
          oldValueInt: oldValueInt,
          newValueInt: newQuota
        }
      })
    ]);

    return { success: true };
  } catch (error) {
    console.error("[PermissionsAction] Error updating test quota:", error);
    return { success: false, error: "Error interno del servidor." };
  }
}

/**
 * Consume 1 test de la cuota del usuario.
 * Esta función puede ser llamada por la PWA o por las acciones de backend cuando un médico/coach hace un test.
 */
export async function consumeTest(userId: string) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { availableTests: true }
    });

    if (!user) {
      throw new Error("Usuario no encontrado.");
    }

    if (user.availableTests <= 0) {
      throw new Error("Cuota de tests agotada. Contacte al administrador.");
    }

    await db.user.update({
      where: { id: userId },
      data: {
        availableTests: {
          decrement: 1
        }
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("[PermissionsAction] Error consuming test:", error);
    return { success: false, error: error.message || "Error al consumir el test." };
  }
}
