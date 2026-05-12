import { User as PrismaUser } from '@prisma/client';
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: PrismaUser['role'];
      permissions: Record<string, boolean> | null;
    } & DefaultSession['user'];
  }

  interface User {
    role: PrismaUser['role'];
    permissions?: Record<string, boolean> | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: PrismaUser['role'];
    permissions?: Record<string, boolean> | null;
  }
}