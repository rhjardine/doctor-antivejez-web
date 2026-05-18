'use client';

import React, { useState } from 'react';
import { ShieldCheck, User, Lock, Save, Eye, EyeOff, Users, ArrowRight, Cpu, HeartPulse } from 'lucide-react';
import { toast } from 'sonner';
import { updateAdminPassword } from '@/lib/actions/auth.actions';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function AjustesPage() {
  const { data: session } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!minLength) return "La contraseña debe tener al menos 8 caracteres.";
    if (!hasUpperCase) return "La contraseña debe tener al menos una letra mayúscula.";
    if (!hasNumber) return "La contraseña debe tener al menos un número.";

    return null;
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validatePassword(newPassword);
    if (error) {
      toast.error(error);
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateAdminPassword(newPassword);

      if (result.success) {
        toast.success("Seguridad actualizada. Ya puede solicitar al equipo técnico retirar el bypass.");
        setNewPassword('');
      } else {
        toast.error(result.error || "Error al actualizar la contraseña.");
      }
    } catch (err) {
      toast.error("Error de conexión al actualizar las credenciales.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-black text-[#293b64] tracking-tight">Configuración del Sistema</h1>
        <p className="text-slate-500 font-medium">Gestione su perfil profesional y las políticas de la red médica.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* COLUMNA IZQUIERDA: Perfil y Seguridad */}
        <div className="md:col-span-2 space-y-8">

          {/* Tarjeta de Seguridad */}
          <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-[#293b64] p-6 text-white flex items-center gap-3">
              <Lock size={20} className="text-[#23bcef]" />
              <h2 className="text-sm font-black uppercase tracking-widest">Seguridad de la Cuenta</h2>
            </div>

            <form onSubmit={handlePasswordUpdate} className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nueva Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-lg font-bold text-[#293b64] outline-none focus:border-[#23bcef] transition-all"
                      placeholder="Mínimo 8 caracteres, 1 Mayúscula, 1 Número"
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 top-5 text-slate-300 hover:text-[#23bcef]"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !newPassword}
                className="bg-[#23bcef] text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-cyan-100 hover:bg-[#1da8d8] transition-all flex items-center gap-2 uppercase text-xs tracking-widest disabled:opacity-50"
              >
                {isLoading ? "Procesando..." : <><Save size={18} /> Actualizar Credenciales</>}
              </button>
            </form>
          </section>

          {/* Tarjeta de Información Profesional */}
          <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-cyan-50 rounded-2xl flex items-center justify-center text-[#23bcef] font-black text-2xl">
                {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : <User size={32} />}
              </div>
              <div>
                <h3 className="font-black text-[#293b64] text-lg uppercase tracking-tighter">
                  {session?.user?.name || 'Usuario'}
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase">
                  {session?.user?.role || 'Rol no definido'}
                </p>
                <p className="text-[10px] text-slate-300 mt-1">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <button className="text-slate-300 hover:text-[#293b64] font-black text-[10px] uppercase tracking-widest border-2 border-slate-50 px-4 py-2 rounded-xl transition-all">
              Editar Datos
            </button>
          </section>
        </div>

        {/* COLUMNA DERECHA: Hub de Administración */}
        <div className="space-y-4">

          {/* Tarjeta Principal: Gestión de Profesionales */}
          <Link href="/profesionales" className="block group">
            <div className="bg-[#293b64] rounded-[2rem] p-6 text-white shadow-lg hover:shadow-xl hover:bg-[#1e2d52] transition-all duration-300 cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-[#23bcef]/20 rounded-2xl flex items-center justify-center">
                  <Users size={24} className="text-[#23bcef]" />
                </div>
                <ArrowRight size={18} className="text-slate-400 group-hover:text-[#23bcef] group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-black text-base uppercase tracking-tight mb-1">
                Gestión de Profesionales
              </h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Administra las cuentas, accesos y cuotas de los médicos y coaches del sistema.
              </p>
              <div className="mt-4 pt-4 border-t border-white/10">
                <span className="text-[10px] font-black text-[#23bcef] uppercase tracking-widest">
                  Ir al módulo →
                </span>
              </div>
            </div>
          </Link>

          {/* Tarjeta: Edad Biológica */}
          <Link href="/edad-biologica" className="block group">
            <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-[#23bcef]/30 transition-all duration-300 cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center">
                  <HeartPulse size={20} className="text-[#23bcef]" />
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-[#23bcef] group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-black text-[12px] text-[#293b64] uppercase tracking-tight mb-1">
                Análisis de Edad Biológica
              </h3>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Herramientas de cálculo y referencia clínica.
              </p>
            </div>
          </Link>

          {/* Estado del Sistema */}
          <div className="bg-[#f8fafc] rounded-[2rem] border border-slate-200 p-6 space-y-4">
            <h3 className="text-[10px] font-black text-[#293b64] uppercase tracking-[0.2em]">Estado del Sistema</h3>

            <div className="flex items-center gap-3">
              <Cpu size={15} className="text-slate-400" />
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-700 uppercase">Infraestructura</p>
                <p className="text-[9px] text-slate-400">PostgreSQL + Next.js App Router</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 text-emerald-600">
                <ShieldCheck size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Servidor Virginia Live</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-1 ml-6">
                Aislamiento de datos PHI activo · Zero-Trust Scoping
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

