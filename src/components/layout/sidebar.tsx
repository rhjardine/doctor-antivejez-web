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

const menuItems = [
  { 
    name: 'Dashboard', 
    icon: FaHome, 
    href: '/dashboard',
    color: 'text-primary'
  },
  { 
    name: 'Historias', 
    icon: FaHistory, 
    href: '/historias',
    color: 'text-blue-500'
  },
  { 
    name: 'Profesionales', 
    icon: FaUserMd, 
    href: '/profesionales',
    color: 'text-green-500'
  },
  { 
    name: 'Agente IA', 
    icon: FaRobot, 
    href: '/agente-ia',
    color: 'text-purple-500'
  },
  { 
    name: 'Edad Biológica', 
    icon: FaHeartbeat, 
    href: '/edad-biologica',
    color: 'text-red-500'
  },
  { 
    name: 'Reportes', 
    icon: FaChartBar, 
    href: '/reportes',
    color: 'text-yellow-500'
  },
  { 
    name: 'Ajustes', 
    icon: FaCog, 
    href: '/ajustes',
    color: 'text-gray-500'
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    // Aquí iría la lógica de logout
    router.push('/login');
  };

  return (
    <div className="w-64 bg-primary-light flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700 flex justify-center items-center">
        <Link href="/dashboard" passHref>
          <Image
            src="/images/logo.png"
            alt="Doctor AntiVejez Logo"
            width={180} // Adjust width as needed, maintaining aspect ratio
            height={40} // Start with a height like 40-50px
            priority // Preload logo as it's likely LCP or important
          />
        </Link>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-white/10 border-l-4 border-primary'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <Icon className={`text-xl ${isActive ? 'text-primary' : item.color}`} />
                  <span className={`font-medium ${isActive ? 'text-white' : 'text-gray-300'}`}>
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
          className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 cursor-pointer"
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-bold">DA</span>
            </div>
            <div>
              <p className="text-white font-medium text-sm">Dr. Admin</p>
              <p className="text-green-400 text-xs flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
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

        {/* User Menu Dropdown */}
        {isUserMenuOpen && (
          <div className="mt-2 py-2 bg-gray-800 rounded-lg">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-2 text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
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
