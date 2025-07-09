// src/components/layout/auth-provider.tsx
'use client';

import { Session } from 'next-auth'; // Importar el tipo Session
import { SessionProvider } from 'next-auth/react';
import React from 'react';

// Actualizar las props para que acepten la sesión
interface AuthProviderProps {
  children: React.ReactNode;
  session: Session | null;
}

export default function AuthProvider({ children, session }: AuthProviderProps) {
  // Pasar la prop 'session' al SessionProvider
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
