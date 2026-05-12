import { Role } from "@prisma/client";

export type ModuleKey =
  | 'dashboard'
  | 'historias'
  | 'profesionales'
  | 'agente_ia'
  | 'reportes'
  | 'ajustes'
  | 'edad_biologica'
  | 'campanas';

export type UserRole = Role;

export const DEFAULT_PERMISSIONS: Record<UserRole, Record<ModuleKey, boolean>> = {
  ADMIN: {
    dashboard: true,
    historias: true,
    profesionales: true,
    agente_ia: true,
    reportes: true,
    ajustes: true,
    edad_biologica: true,
    campanas: true,
  },
  MEDICO: {
    dashboard: true,
    historias: true,
    profesionales: false,
    agente_ia: true,
    reportes: false,
    ajustes: true,
    edad_biologica: true,
    campanas: false,
  },
  COACH: {
    dashboard: true,
    historias: true,
    profesionales: false,
    agente_ia: true, // Coaches can use AI to help with adherence
    reportes: false,
    ajustes: true,
    edad_biologica: false,
    campanas: false,
  },
  ADMINISTRATIVO: {
    dashboard: true,
    historias: true, // Limited access could be enforced at API level, but full access here
    profesionales: false,
    agente_ia: false,
    reportes: true,
    ajustes: true,
    edad_biologica: false,
    campanas: true,
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
  const defaults = DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.MEDICO;
  
  if (!overrides || typeof overrides !== 'object') {
    return defaults;
  }

  // Fusionamos los permisos, dando prioridad a las sobreescrituras (overrides)
  return {
    ...defaults,
    ...(overrides as Partial<Record<ModuleKey, boolean>>),
  };
}
