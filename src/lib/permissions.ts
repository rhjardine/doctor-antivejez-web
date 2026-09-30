import { Role } from "@prisma/client";

/**
 * Definición de todos los módulos del sistema.
 * Debe coincidir con las rutas protegidas en el middleware y el sidebar.
 */
export type ModuleKey =
  | 'dashboard'
  | 'historias'
  | 'citas'
  | 'profesionales'
  | 'agente_ia'
  | 'edad_biologica'
  | 'campanas'
  | 'reportes'
  | 'ajustes'
  | 'leads'
  | 'notificaciones';

export type UserRole = Role;

/**
 * Módulos que son de acceso exclusivo para el Administrador.
 * No pueden ser delegados a otros roles mediante el panel de permisos.
 */
export const ADMIN_ONLY_MODULES: ModuleKey[] = ['profesionales', 'ajustes'];

/**
 * Permisos base por defecto según el rol del usuario.
 */
export const DEFAULT_PERMISSIONS: Record<UserRole, Record<ModuleKey, boolean>> = {
  ADMIN: {
    dashboard: true,
    historias: true,
    citas: true,
    profesionales: true,
    agente_ia: true,
    edad_biologica: true,
    campanas: true,
    reportes: true,
    ajustes: true,
    leads: true,
    notificaciones: true,
  },
  MEDICO: {
    dashboard: true,
    historias: true,
    citas: true,
    profesionales: false,
    agente_ia: true,
    edad_biologica: true,
    campanas: false,
    reportes: false,
    ajustes: false,
    leads: false,
    notificaciones: false,
  },
  COACH: {
    dashboard: true,
    historias: true,
    citas: true,
    profesionales: false,
    agente_ia: true,
    edad_biologica: false,
    campanas: false,
    reportes: false,
    ajustes: false,
    leads: false,
    notificaciones: false,
  },
  ADMINISTRATIVO: {
    dashboard: true,
    historias: true,
    citas: true,
    profesionales: false,
    agente_ia: false,
    reportes: true,
    ajustes: false,
    edad_biologica: false,
    campanas: true,
    leads: true,
    notificaciones: true,
  },
};

/**
 * Resuelve los permisos finales de un usuario combinando su rol base
 * con cualquier sobreescritura específica guardada en la base de datos.
 */
export function resolvePermissions(
  role: UserRole,
  overrides?: Record<string, boolean> | null
): Record<ModuleKey, boolean> {
  // Aseguramos que el rol exista en nuestra configuración, sino usamos MEDICO como fallback
  const defaults = DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.MEDICO;

  if (!overrides || typeof overrides !== 'object') {
    return defaults;
  }

  // Fusionamos los permisos, dando prioridad a las sobreescrituras (overrides)
  // pero manteniendo la estructura de ModuleKey
  const merged = { ...defaults };

  Object.keys(overrides).forEach((key) => {
    if (key in merged) {
      merged[key as ModuleKey] = overrides[key];
    }
  });

  return merged;
}

/**
 * Utilidad para validar si un módulo es elegible para ser gestionado en el panel.
 */
export function canGrantModule(module: ModuleKey): boolean {
  return !ADMIN_ONLY_MODULES.includes(module);
}

/** Lo que se necesita de la sesión para decidir un permiso. */
export interface SesionParaPermiso {
  role?: string | null;
  permissions?: Record<string, boolean> | null;
}

/**
 * ¿Puede esta sesión usar este módulo?
 *
 * Existe porque el Módulo de Reportes tenía el rol escrito a mano en el cliente
 * —`if (session.user.role !== 'MEDICO')`— y esa condición contradecía a la
 * matriz de permisos de este mismo archivo, que da `reportes` a ADMIN y a
 * ADMINISTRATIVO y se lo niega a MEDICO. Es decir: los dos únicos roles que
 * llegaban a la pantalla eran justo los que el botón rechazaba, y el único que
 * el botón aceptaba no podía llegar. Nadie podía generar un reporte.
 *
 * Un rol ausente o desconocido cae en el caso más restrictivo, no en el más
 * amplio: `resolvePermissions` ya usa MEDICO como reserva.
 */
export function puedeUsarModulo(
  sesion: SesionParaPermiso | null | undefined,
  modulo: ModuleKey
): boolean {
  if (!sesion?.role) return false;

  const permisos = resolvePermissions(sesion.role as UserRole, sesion.permissions);
  return permisos[modulo] === true;
}