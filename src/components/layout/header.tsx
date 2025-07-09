'use client';

import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Bell, LogOut, UserCircle } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

// Mapeo de rutas a títulos para mostrar en el header
const routeTitles: { [key: string]: string } = {
  '/dashboard': 'Consulta Global',
  '/historias': 'Gestión de Pacientes',
  '/profesionales': 'Gestión de Profesionales',
  '/agente-ia': 'Agente IA',
  '/edad-biologica': 'Análisis de Edad Biológica',
  '/reportes': 'Reportes y Estadísticas',
  '/ajustes': 'Configuración y Ajustes',
};

const getCurrentTitle = (pathname: string): string => {
  // Busca una coincidencia exacta primero
  if (routeTitles[pathname]) {
    return routeTitles[pathname];
  }
  // Si no, busca si la ruta comienza con alguna de las claves (para sub-rutas)
  const matchingRoute = Object.keys(routeTitles).find(route => pathname.startsWith(route + '/'));
  return matchingRoute ? routeTitles[matchingRoute] : 'Dashboard';
};


export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const title = getCurrentTitle(pathname);

  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString('es-VE', {
      dateStyle: 'full',
      timeStyle: 'short',
    });
  };

  return (
    <header className="bg-primary-dark text-white shadow-md z-10">
      <div className="flex items-center justify-between h-20 px-6 lg:px-8">
        {/* Sección Izquierda: Título de la página */}
        <div className="flex items-center gap-4">
            <Image
                src="/images/logo_icon.png" // Un icono más pequeño para el header
                alt="Doctor AntiVejez Icono"
                width={40}
                height={40}
            />
            <h1 className="text-xl font-semibold hidden md:block">{title}</h1>
        </div>

        {/* Sección Derecha: Info de Usuario y Acciones */}
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="font-semibold">Bienvenido(a) {session?.user?.name || 'Usuario'}</p>
            <p className="text-xs text-gray-300">Última conexión: {getCurrentDateTime()}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-full hover:bg-white/10 transition-colors">
              <Bell />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-primary-dark"></span>
            </button>
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="p-2 rounded-full hover:bg-white/10 transition-colors" title="Cerrar Sesión">
              <LogOut />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
