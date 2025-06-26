// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/layout/auth-provider'; // Importa el provider

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Doctor AntiVejez - Sistema de Gestión Médica',
  description: 'Sistema integral para la gestión de pacientes y análisis biofísicos antienvejecimiento',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* Envuelve a los children con el AuthProvider */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}