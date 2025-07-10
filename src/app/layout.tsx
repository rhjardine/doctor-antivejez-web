// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/layout/auth-provider';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Doctor AntiVejez - Sistema de Gestión Médica',
  description: 'Sistema integral para la gestión de pacientes y análisis biofísicos antienvejecimiento',
};

// Convertimos el layout en una función asíncrona para poder obtener la sesión
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Obtenemos la sesión en el lado del servidor
  const session = await getServerSession(authOptions);

  return (
    <html lang="es">
      <body className={inter.className}>
        {/* Pasamos la sesión obtenida como prop al AuthProvider */}
        <AuthProvider session={session}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
