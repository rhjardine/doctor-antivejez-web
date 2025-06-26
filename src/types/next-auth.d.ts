// src/types/next-auth.d.ts
import { User as PrismaUser } from '@prisma/client';
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: PrismaUser['role'];
    } & DefaultSession['user'];
  }

  interface User {
    role: PrismaUser['role'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: PrismaUser['role'];
  }
}