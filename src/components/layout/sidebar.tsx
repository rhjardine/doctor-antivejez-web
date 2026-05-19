'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  FaHome, FaHistory, FaUserMd, FaRobot, FaHeartbeat,
  FaChartBar, FaCog, FaSignOutAlt, FaChevronDown,
  FaChevronUp, FaCalendarAlt, FaPaperPlane, FaUsers,
  FaBell, FaLock,
} from 'react-icons/fa';
import { signOut, useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import type { ModuleKey } from '@/lib/permissions';

type MenuItem = {
  name: string;
  icon: React.ElementType;
  href: string;
  color: string;
  module: ModuleKey;
};

const ALL_MENU_ITEMS: MenuItem[] = [
  { name: 'Dashboard', icon: FaHome, href: '/dashboard', color: 'text-[#23bcef]', module: 'dashboard' },
  { name: 'Historias', icon: FaHistory, href: '/historias', color: 'text-blue-400', module: 'historias' },
  { name: 'Citas', icon: FaCalendarAlt, href: '/citas', color: 'text-teal-400', module: 'citas' },
  { name: 'Profesionales', icon: FaUserMd, href: '/profesionales', color: 'text-emerald-400', module: 'profesionales' },
  { name: 'Agente IA', icon: FaRobot, href: '/agente-ia', color: 'text-purple-400', module: 'agente_ia' },
  { name: 'Edad Biológica', icon: FaHeartbeat, href: '/edad-biologica', color: 'text-red-400', module: 'edad_biologica' },
  { name: 'Campañas', icon: FaPaperPlane, href: '/dashboard/campaigns', color: 'text-orange-400', module: 'campanas' },
  { name: 'Leads', icon: FaUsers, href: '/leads', color: 'text-yellow-400', module: 'leads' },
  { name: 'Notificaciones', icon: FaBell, href: '/notificaciones', color: 'text-cyan-400', module: 'notificaciones' },
  { name: 'Reportes', icon: FaChartBar, href: '/reportes', color: 'text-amber-400', module: 'reportes' },
  { name: 'Ajustes', icon: FaCog, href: '/ajustes', color: 'text-slate-400', module: 'ajustes' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { can } = usePermissions();

  // Comprobar si el usuario tiene el cambio de contraseña obligatorio activo
  const mustChangePassword = session?.user?.permissions?.forcePasswordChange === true;

  // Filtrar los módulos que el usuario tiene permitido visualizar
  const visibleItems = ALL_MENU_ITEMS.filter(item => can(item.module));

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="w-64 bg-[#0a0f24]/85 backdrop-blur-2xl flex flex-col fixed h-full z-20 border-r border-white/10 shadow-[4px_0_24px_rgba(0,0,0,0.5)] overflow-hidden">
      {/* 🔮 Efecto sutil de aura brillante en la esquina superior izquierda */}
      <div className="absolute top-[-50px] left-[-50px] w-48 h-48 rounded-full bg-[#23bcef]/10 blur-[80px] pointer-events-none" />

      {/* 🔮 Luz trasera adicional para ambientación cibernética/médica de vanguardia */}
      <div className="absolute bottom-[-100px] right-[-100px] w-64 h-64 rounded-full bg-blue-500/[0.04] blur-[100px] pointer-events-none" />

      {/* 🛡️ Header con contenedor de Glassmorphic para enmascarar el contraste del logotipo */}
      <div className="p-6 border-b border-white/5 relative z-10">
        <div className="relative group overflow-hidden bg-white/[0.02] backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04]">
          {/* Brillo dinámico trasero detrás del logotipo */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#23bcef]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          <Link href={mustChangePassword ? '#' : '/dashboard'} className={mustChangePassword ? 'cursor-not-allowed' : 'cursor-pointer'}>
            <div className="flex justify-center items-center relative z-10">
              <Image
                src="/images/Logoico.jpeg"
                alt="Doctor AntiVejez"
                width={170}
                height={38}
                style={{ objectFit: 'contain' }}
                className="transition-transform duration-300 group-hover:scale-102 rounded-lg"
                priority
              />
            </div>
          </Link>
        </div>
      </div>

      {/* 🧭 Navegación con efecto de lista Premium */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto relative z-10 custom-scrollbar">
        <ul className="space-y-1.5">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            // Si debe cambiar contraseña, todo está inhabilitado excepto "Ajustes"
            const isDisabledByForcePassword = mustChangePassword && item.module !== 'ajustes';

            if (isDisabledByForcePassword) {
              return (
                <li key={item.name} title="Debe cambiar su contraseña antes de acceder a esta sección.">
                  <div className="flex items-center space-x-3 px-4 py-2.5 rounded-xl opacity-30 cursor-not-allowed grayscale bg-transparent border-l-4 border-transparent text-slate-500">
                    <Icon className="text-lg" />
                    <span className="font-semibold text-xs uppercase tracking-tight">
                      {item.name}
                    </span>
                    <FaLock className="text-[10px] ml-auto text-red-400" />
                  </div>
                </li>
              );
            }

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-300 relative group overflow-hidden ${isActive
                      ? 'bg-gradient-to-r from-white/[0.06] to-white/[0.01] border-l-4 border-[#23bcef] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
                      : 'hover:bg-white/[0.03] border-l-4 border-transparent'
                    }`}
                >
                  {/* Destello de fondo al pasar el cursor (Hover Glow) */}
                  <span className="absolute inset-y-0 left-0 w-0 bg-[#23bcef]/5 group-hover:w-full transition-all duration-500 ease-out pointer-events-none" />

                  <Icon className={`text-lg transition-transform duration-300 group-hover:scale-110 relative z-10 ${isActive ? 'text-[#23bcef] drop-shadow-[0_0_8px_rgba(35,188,239,0.5)]' : item.color}`} />
                  <span className={`font-semibold text-xs uppercase tracking-tight relative z-10 ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white transition-colors duration-200'}`}>
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 👤 Menú de Perfil de Usuario con Estilo Cristalino */}
      <div className="border-t border-white/5 p-4 relative z-10 bg-white/[0.01] backdrop-blur-md">
        <div
          className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 cursor-pointer ${isUserMenuOpen
              ? 'bg-white/10 border-white/10 shadow-lg'
              : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10'
            }`}
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#23bcef] to-[#293b64] flex items-center justify-center border border-white/20 shadow-md">
              <span className="text-white font-black text-xs">
                {session?.user?.name ? session.user.name.substring(0, 2).toUpperCase() : 'US'}
              </span>
            </div>
            <div className="truncate max-w-[110px]">
              <p className="text-white font-black text-xs tracking-tight truncate">{session?.user?.name || 'Portal Clínico'}</p>
              <p className="text-[#23bcef] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 bg-[#23bcef] rounded-full inline-block animate-pulse" />
                {session?.user?.role || 'En línea'}
              </p>
            </div>
          </div>
          {isUserMenuOpen ? (
            <FaChevronUp className="text-slate-400 text-xs transition-transform duration-300" />
          ) : (
            <FaChevronDown className="text-slate-400 text-xs transition-transform duration-300" />
          )}
        </div>

        {/* Dropdown de opciones de sesión */}
        {isUserMenuOpen && (
          <div className="mt-2 py-1.5 bg-slate-950/90 border border-white/10 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-xs font-bold uppercase tracking-wide"
            >
              <FaSignOutAlt className="text-sm" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}