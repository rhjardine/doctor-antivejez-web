'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
  FaHome, 
  FaHistory, 
  FaUserMd, 
  FaRobot, 
  FaHeartbeat, 
  FaChartBar, 
  FaCog, 
  FaSignOutAlt,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';

// Se mantiene la misma estructura de menú
const menuItems = [
  { name: 'Dashboard', icon: FaHome, href: '/dashboard' },
  { name: 'Historias', icon: FaHistory, href: '/historias' },
  { name: 'Profesionales', icon: FaUserMd, href: '/profesionales' },
  { name: 'Agente IA', icon: FaRobot, href: '/agente-ia' },
  { name: 'Edad Biológica', icon: FaHeartbeat, href: '/edad-biologica' },
  { name: 'Reportes', icon: FaChartBar, href: '/reportes' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    // Aquí iría la lógica de logout, por ejemplo, signOut() de next-auth
    router.push('/login');
  };

  return (
    // Contenedor principal del sidebar con el nuevo color de fondo corporativo
    <div className="w-64 bg-primary-dark flex flex-col h-screen fixed">
      {/* Logo */}
      <div className="p-4 flex justify-center items-center h-20 border-b border-white/10">
        <Link href="/dashboard" passHref>
          <Image
            src="/images/logo.png"
            alt="Doctor AntiVejez Logo"
            width={160}
            height={35}
            priority
          />
        </Link>
      </div>

      {/* Navegación Principal */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            // El estado activo ahora se resalta con un fondo más claro y un borde
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                    isActive
                      ? 'bg-white/10 text-white border-l-4 border-primary'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="text-lg w-6 text-center" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Menú inferior de Ajustes y Perfil */}
      <div className="px-3 py-4 border-t border-white/10">
         {/* Link de Ajustes */}
        <Link
            href="/ajustes"
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
            pathname.startsWith('/ajustes')
                ? 'bg-white/10 text-white'
                : 'text-gray-300 hover:bg-white/5 hover:text-white'
            }`}
        >
            <FaCog className="text-lg w-6 text-center" />
            <span>Ajustes</span>
        </Link>
        
        {/* Perfil de Usuario */}
        <div 
          className="flex items-center justify-between p-3 mt-2 rounded-lg hover:bg-white/5 cursor-pointer"
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-bold">DA</span>
            </div>
            <div>
              <p className="text-white font-medium text-sm">Dr. Admin</p>
              <p className="text-green-400 text-xs flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5"></span>
                En línea
              </p>
            </div>
          </div>
          {isUserMenuOpen ? (
            <FaChevronUp className="text-gray-400" />
          ) : (
            <FaChevronDown className="text-gray-400" />
          )}
        </div>

        {/* Menú desplegable de Salir */}
        {isUserMenuOpen && (
          <div className="mt-2 bg-gray-900/50 rounded-lg">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-2.5 text-gray-300 hover:bg-white/5 hover:text-white transition-colors rounded-lg"
            >
              <FaSignOutAlt />
              <span>Salir</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
