'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  FaHome, 
  FaHistory, 
  FaUserMd, 
  FaRobot, 
  FaHeartbeat, 
  FaChartBar, 
  FaCog,
} from 'react-icons/fa';

const menuItems = [
  { name: 'Dashboard', icon: FaHome, href: '/dashboard' },
  { name: 'Historias', icon: FaHistory, href: '/historias' },
  { name: 'Profesionales', icon: FaUserMd, href: '/profesionales' },
  { name: 'Agente IA', icon: FaRobot, href: '/agente-ia' },
  { name: 'Edad Biológica', icon: FaHeartbeat, href: '/edad-biologica' },
  { name: 'Reportes', icon: FaChartBar, href: '/reportes' },
  { name: 'Ajustes', icon: FaCog, href: '/ajustes' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-20 lg:w-64 bg-primary-navy flex flex-col transition-all duration-300">
      {/* Logo Principal */}
      <div className="flex items-center justify-center h-20 border-b border-white/10">
        <Link href="/dashboard" passHref>
            <Image
              src="/images/logo.png"
              alt="Doctor AntiVejez Logo"
              width={160}
              height={35}
              priority
              className="hidden lg:block"
            />
             <Image
              src="/images/logo_icon.png"
              alt="Doctor AntiVejez Icono"
              width={40}
              height={40}
              priority
              className="block lg:hidden"
            />
        </Link>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-2 lg:px-4 py-6">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  title={item.name}
                  className={`flex items-center h-12 rounded-lg transition-colors relative ${
                    isActive
                      ? 'bg-background-main text-primary-dark font-semibold'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="w-16 flex items-center justify-center">
                     <Icon className="text-2xl" />
                  </div>
                  <span className="hidden lg:block pr-4">
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
