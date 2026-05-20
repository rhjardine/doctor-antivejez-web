import { User as PrismaUser } from '@prisma/client';
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: PrismaUser['role'];
      permissions: Record<string, boolean> | null;
      /** ID de la clínica/organización a la que pertenece el profesional.
       *  null → usuario sin tenant asignado (legacy fallback: aislar por userId). */
      tenantId?: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    role: PrismaUser['role'];
    permissions?: Record<string, boolean> | null;
    tenantId?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: PrismaUser['role'];
    permissions?: Record<string, boolean> | null;
    tenantId?: string | null;
  }
}