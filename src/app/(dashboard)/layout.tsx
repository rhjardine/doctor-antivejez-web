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
    <div className="flex h-screen bg-background-main font-sans">
      {/* Sidebar a la izquierda */}
      <div className="z-20">
        <Sidebar />
      </div>
      
      {/* Contenedor principal que se expande */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header en la parte superior */}
        <Header />
        
        {/* Área de contenido principal con el borde superior izquierdo redondeado */}
        <main className="flex-1 overflow-y-auto bg-background-main p-6 lg:p-8 rounded-tl-3xl">
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
