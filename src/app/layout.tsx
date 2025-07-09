// src/app/(dashboard)/layout.tsx
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Toaster } from 'sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar a la izquierda */}
      <Sidebar />
      
      {/* Contenedor principal que incluye el Header y el contenido */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header en la parte superior */}
        <Header />
        
        {/* Área de contenido principal con scroll */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      
      {/* Componente para mostrar notificaciones (toasts) */}
      <Toaster richColors position="top-right" />
    </div>
  );
}
