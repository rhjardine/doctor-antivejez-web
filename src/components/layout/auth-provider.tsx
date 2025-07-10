// src/components/layout/auth-provider.tsx
'use client';

import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import React from 'react';

// Actualizamos las props para que el componente pueda recibir la sesión
interface AuthProviderProps {
  children: React.ReactNode;
  session: Session | null;
}

export default function AuthProvider({ children, session }: AuthProviderProps) {
  // Pasamos la prop 'session' al SessionProvider de NextAuth
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
