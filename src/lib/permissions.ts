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