// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import AuthProvider from '@/components/layout/auth-provider'; // 👈 1. Importar el AuthProvider
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Doctor AntiVejez',
  description: 'Sistema de Gestión Médica Antienvejecimiento',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* ▼▼▼ 2. Envolver el contenido con AuthProvider ▼▼▼ */}
        <AuthProvider>
          {children}
          <Toaster richColors position="top-right" />
        </AuthProvider>
        {/* ▲▲▲ Fin del wrapper ▲▲▲ */}
      </body>
    </html>
  );
}