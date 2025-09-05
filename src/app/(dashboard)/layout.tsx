import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      {/* ===== INICIO DE LA CORRECCIÓN ===== */}
      {/* Se añade la clase ml-64 a este div.
          'ml-64' significa 'margin-left' de '16rem' (256px), que es
          exactamente el ancho ('w-64') de nuestro componente Sidebar.
          Esto empuja todo el contenido principal hacia la derecha,
          dejando el espacio perfecto para la barra lateral fija. */}
      <div className="ml-64 flex-1 flex flex-col overflow-hidden">
      {/* ===== FIN DE LA CORRECCIÓN ===== */}
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}