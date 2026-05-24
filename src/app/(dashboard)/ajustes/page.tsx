'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Lock, Save, Eye, EyeOff, Users, ArrowRight, Cpu, HeartPulse, ShieldAlert, ClipboardList, Coins } from 'lucide-react';
import { toast } from 'sonner';
import { updateMyPassword } from '@/lib/actions/auth.actions';
import { useSession } from 'next-auth/react';
import { getAdminAuditLogs, getAdminCreditHistory } from '@/lib/actions/permissions.actions';
import Link from 'next/link';

export default function AjustesPage() {
  const { data: session } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [creditHistory, setCreditHistory] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    if (!isAdmin) return;

    const loadAuditData = async () => {
      setLogsLoading(true);
      try {
        const [logsRes, creditRes] = await Promise.all([
          getAdminAuditLogs(),
          getAdminCreditHistory()
        ]);

        if (logsRes.success && logsRes.data) {
          setAuditLogs(logsRes.data);
        } else if (logsRes.error) {
          toast.error(logsRes.error);
        }

        if (creditRes.success && creditRes.data) {
          setCreditHistory(creditRes.data);
        } else if (creditRes.error) {
          toast.error(creditRes.error);
        }
      } catch (err) {
        console.error("Error loading audit logs:", err);
        toast.error("Fallo al cargar registros de auditoría.");
      } finally {
        setLogsLoading(false);
      }
    };

    loadAuditData();
  }, [isAdmin]);

  const mustChangePassword = (session?.user as any)?.permissions?.forcePasswordChange === true;

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
      const result = await updateMyPassword(newPassword);

      if (result.success) {
        toast.success("Seguridad actualizada. Ya puede continuar su trabajo en el sistema.");
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

            {mustChangePassword && (
              <div className="mx-8 mt-8 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
                <ShieldAlert className="text-rose-500 shrink-0 mt-0.5" size={24} />
                <p className="text-rose-700 text-sm font-medium">
                  <strong>ACCIÓN REQUERIDA:</strong> Por políticas de seguridad, debe cambiar la contraseña temporal asignada por el administrador antes de poder acceder al sistema.
                </p>
              </div>
            )}

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

      {/* SECCIÓN DE AUDITORÍA (SÓLO ADMIN) */}
      {isAdmin && (
        <div className="space-y-8 pt-8 border-t border-slate-100">
          <header className="flex items-center gap-3">
            <ShieldCheck size={28} className="text-[#293b64]" />
            <div>
              <h2 className="text-2xl font-black text-[#293b64] tracking-tight">Consola de Auditoría HIPAA</h2>
              <p className="text-slate-500 font-medium text-sm">Registro histórico de control de accesos, permisos y transacciones de créditos.</p>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-8">
            {/* TABLA DE PERMISOS */}
            <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-[#293b64] p-6 text-white flex items-center gap-3">
                <ClipboardList size={20} className="text-[#23bcef]" />
                <h3 className="text-sm font-black uppercase tracking-widest">Bitácora de Auditoría Clínica (Permisos)</h3>
              </div>

              <div className="p-8">
                {logsLoading ? (
                  <div className="text-center py-6 text-slate-500 font-medium">Cargando bitácora de auditoría...</div>
                ) : auditLogs.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 font-medium">No hay registros de auditoría de permisos disponibles.</div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-[#0c122c]/5">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                          <th className="px-6 py-4">Fecha</th>
                          <th className="px-6 py-4">Administrador</th>
                          <th className="px-6 py-4">Usuario Afectado</th>
                          <th className="px-6 py-4">Módulo</th>
                          <th className="px-6 py-4">Valor Anterior</th>
                          <th className="px-6 py-4">Valor Nuevo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
                        {auditLogs.map((log) => {
                          const isQuota = log.module === "TEST_QUOTA";
                          let oldDisplay = "-";
                          let newDisplay = "-";
                          let oldColorClass = "text-slate-600";
                          let newColorClass = "text-slate-600";

                          if (isQuota) {
                            oldDisplay = log.oldValueInt !== null ? log.oldValueInt.toString() : "-";
                            newDisplay = log.newValueInt !== null ? log.newValueInt.toString() : "-";
                            const diff = (log.newValueInt ?? 0) - (log.oldValueInt ?? 0);
                            newColorClass = diff > 0 ? "text-emerald-600 font-black" : diff < 0 ? "text-rose-600 font-black" : "text-slate-600";
                          } else {
                            oldDisplay = log.oldValue === true ? "Habilitado" : log.oldValue === false ? "Deshabilitado" : "-";
                            newDisplay = log.newValue === true ? "Habilitado" : log.newValue === false ? "Deshabilitado" : "-";
                            oldColorClass = log.oldValue === true ? "text-emerald-600" : log.oldValue === false ? "text-rose-600" : "text-slate-400";
                            newColorClass = log.newValue === true ? "text-emerald-600 font-black" : log.newValue === false ? "text-rose-600 font-black" : "text-slate-400";
                          }

                          return (
                            <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-[10px] text-slate-400 font-medium">
                                {new Date(log.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-[#293b64]">
                                {log.changedByRelation?.name || log.changedBy}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {log.user?.name || log.userId}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-wider">
                                  {log.module}
                                </span>
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap ${oldColorClass}`}>
                                {oldDisplay}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap ${newColorClass}`}>
                                {newDisplay}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            {/* LEDGER DE CRÉDITOS */}
            <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-[#293b64] p-6 text-white flex items-center gap-3">
                <Coins size={20} className="text-[#23bcef]" />
                <h3 className="text-sm font-black uppercase tracking-widest">Ledger de Movimientos de Crédito (Auditoría de Consumos)</h3>
              </div>

              <div className="p-8">
                {logsLoading ? (
                  <div className="text-center py-6 text-slate-500 font-medium">Cargando historial de créditos...</div>
                ) : creditHistory.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 font-medium">No hay transacciones de crédito registradas.</div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-[#0c122c]/5">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                          <th className="px-6 py-4">Fecha</th>
                          <th className="px-6 py-4">Profesional</th>
                          <th className="px-6 py-4">Tipo de Test</th>
                          <th className="px-6 py-4">Cantidad</th>
                          <th className="px-6 py-4">Descripción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
                        {creditHistory.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-[10px] text-slate-400 font-medium">
                              {new Date(item.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-[#293b64]">
                              {item.user?.name || item.user?.email || item.userId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="bg-[#23bcef]/10 text-[#23bcef] px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-wider border border-[#23bcef]/20">
                                {item.testType}
                              </span>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap ${item.amount > 0 ? "text-emerald-600 font-black" : "text-rose-600 font-black"}`}>
                              {item.amount > 0 ? `+${item.amount}` : item.amount}
                            </td>
                            <td className="px-6 py-4 text-slate-500 font-medium">
                              {item.description}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

