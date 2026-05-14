import { useSession } from "next-auth/react";
import { resolvePermissions, ModuleKey } from "@/lib/permissions";

export function usePermissions() {
  const { data: session, status } = useSession();

  const can = (module: ModuleKey): boolean => {
    if (!session?.user) return false;
    
    // El Administrador siempre tiene acceso total
    if (session.user.role === 'ADMIN') return true;

    // Resolvemos los permisos usando los roles por defecto y los overrides guardados en DB
    const permissions = resolvePermissions(
      session.user.role as any,
      session.user.permissions as any
    );
    
    return !!permissions[module];
  };

  return { can, session, status };
}
