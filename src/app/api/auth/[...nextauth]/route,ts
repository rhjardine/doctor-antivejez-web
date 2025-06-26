// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

import type { User as NextAuthUser } from 'next-auth';
import type { AdapterUser } from 'next-auth/adapters';

// Extend User and AdapterUser to include 'role'
declare module 'next-auth' {
  interface User {
    id: string;
    name: string;
    email: string;
    role: 'MEDICO' | 'ADMINISTRATIVO' | 'PACIENTE';
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: 'MEDICO' | 'ADMINISTRATIVO' | 'PACIENTE';
    };
  }
}

declare module 'next-auth/adapters' {
  interface AdapterUser {
    role: 'MEDICO' | 'ADMINISTRATIVO' | 'PACIENTE';
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password);

        if (!passwordMatch) {
          return null;
        }

        // Retorna el objeto de usuario sin la contraseña
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'MEDICO' | 'ADMINISTRATIVO' | 'PACIENTE';
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };