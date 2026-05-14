// src/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import { ModuleKey } from '@/lib/permissions';
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
  FaChevronUp,
  FaCalendarAlt,
  FaPaperPlane
} from 'react-icons/fa';

type MenuItem = {
  name: string;
  icon: any;
  href: string;
  color: string;
  module: ModuleKey;
};

const menuItems: MenuItem[] = [
  { name: 'Dashboard', icon: FaHome, href: '/dashboard', color: 'text-primary', module: 'dashboard' },
  { name: 'Historias', icon: FaHistory, href: '/historias', color: 'text-blue-500', module: 'historias' },
  { name: 'Citas', icon: FaCalendarAlt, href: '/citas', color: 'text-teal-500', module: 'citas' },
  { name: 'Profesionales', icon: FaUserMd, href: '/profesionales', color: 'text-green-500', module: 'profesionales' },
  { name: 'Agente IA', icon: FaRobot, href: '/agente-ia', color: 'text-purple-500', module: 'agente_ia' },
  { name: 'Edad Biológica', icon: FaHeartbeat, href: '/edad-biologica', color: 'text-red-500', module: 'edad_biologica' },
  { name: 'Campañas', icon: FaPaperPlane, href: '/dashboard/campaigns', color: 'text-orange-500', module: 'campanas' },
  { name: 'Reportes', icon: FaChartBar, href: '/reportes', color: 'text-yellow-500', module: 'reportes' },
  { name: 'Ajustes', icon: FaCog, href: '/ajustes', color: 'text-gray-500', module: 'ajustes' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { can, session } = usePermissions();

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="w-64 bg-primary-dark flex flex-col fixed h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700 flex justify-center items-center">
        <Link href="/dashboard" passHref>
          <Image
            src="/images/Logoico.jpeg"
            alt="Doctor AntiVejez Logo"
            width={180}
            height={40}
            style={{ objectFit: 'contain' }}
            priority
          />
        </Link>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar-tabs">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const hasAccess = can(item.module);

            return (
              <li key={item.name} title={!hasAccess ? "Esta opción no está disponible. Contacte a un Administrador" : ""}>
                <Link
                  href={hasAccess ? item.href : "#"}
                  onClick={(e) => {
                    if (!hasAccess) {
                      e.preventDefault();
                      toast.error(`No tienes permisos para acceder a ${item.name}`);
                    }
                  }}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    !hasAccess 
                      ? 'opacity-40 cursor-not-allowed filter grayscale hover:bg-transparent' 
                      : isActive 
                        ? 'bg-white/10 border-l-4 border-primary'
                        : 'hover:bg-white/5'
                  }`}
                >
                  <Icon className={`text-xl ${isActive && hasAccess ? 'text-primary' : item.color}`} />
                  <span className={`font-medium ${isActive && hasAccess ? 'text-white' : 'text-gray-300'}`}>
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="border-t border-gray-700 p-4">
        <div
          className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
        >
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-white font-bold">{getInitials(session?.user?.name)}</span>
            </div>
            <div className="truncate">
              <p className="text-white font-medium text-sm truncate">{session?.user?.name || 'Usuario'}</p>
              <p className="text-green-400 text-xs flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-1 shrink-0"></span>
                <span className="truncate">{session?.user?.role || 'Autenticado'}</span>
              </p>
            </div>
          </div>
          {isUserMenuOpen ? (
            <FaChevronUp className="text-gray-400 shrink-0" />
          ) : (
            <FaChevronDown className="text-gray-400 shrink-0" />
          )}
        </div>

        {/* User Menu Dropdown */}
        {isUserMenuOpen && (
          <div className="mt-2 py-2 bg-gray-800 rounded-lg animate-in slide-in-from-bottom-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-2 text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <FaSignOutAlt />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}