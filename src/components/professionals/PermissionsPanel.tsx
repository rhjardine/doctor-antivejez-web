'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Shield, ShieldCheck, ShieldOff, Activity } from 'lucide-react';
import { updateUserModulePermission, updateUserTestQuota } from '@/lib/actions/permissions.actions';
import { resolvePermissions, DEFAULT_PERMISSIONS, ADMIN_ONLY_MODULES, ModuleKey, UserRole } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PermissionsPanelProps {
  user: {
    id: string;
    name: string;
    role: string;
    permissions: Record<string, boolean> | null;
    availableTests?: number;
  };
  onClose: () => void;
  onSaved: () => void;
}

const MODULE_LABELS: Record<ModuleKey, { label: string; description: string }> = {
  dashboard: { label: 'Dashboard', description: 'Panel de control y estadísticas' },
  historias: { label: 'Historias', description: 'Gestión de pacientes y tests' },
  citas: { label: 'Citas', description: 'Calendario y agenda' },
  profesionales: { label: 'Profesionales', description: 'Solo Administrador' },
  agente_ia: { label: 'Agente IA', description: 'Análisis clínico con IA' },
  edad_biologica: { label: 'Edad Biológica', description: 'Resumen global de tests' },
  campanas: { label: 'Campañas', description: 'Envío masivo de mensajes' },
  reportes: { label: 'Reportes', description: 'Informes y analítica avanzada' },
  ajustes: { label: 'Ajustes', description: 'Solo Administrador' },
  leads: { label: 'Leads', description: 'Captaciones del funnel' },
  notificaciones: { label: 'Notificaciones', description: 'Envío de notificaciones' },
};

export default function PermissionsPanel({ user, onClose, onSaved }: PermissionsPanelProps) {
  // Inicialización del estado
  const [localPerms, setLocalPerms] = useState<Record<ModuleKey, boolean>>(() => resolvePermissions(user.role as UserRole, user.permissions));
  const [testQuota, setTestQuota] = useState<number>(user.availableTests || 0);
  const [saving, setSaving] = useState<ModuleKey | 'quota' | null>(null);

  // EFECTO CLAVE: Sincroniza el panel modal si los datos cambian en el fondo al guardar
  useEffect(() => {
    setLocalPerms(resolvePermissions(user.role as UserRole, user.permissions));
    setTestQuota(user.availableTests || 0);
  }, [user]);

  const handleToggle = async (module: ModuleKey, newValue: boolean) => {
    if (ADMIN_ONLY_MODULES.includes(module)) {
      toast.error('Este módulo es exclusivo del Administrador.');
      return;
    }

    setSaving(module);
    // 1. Actualización Optimista: Cambia el switch visualmente al instante
    setLocalPerms(prev => ({ ...prev, [module]: newValue }));

    try {
      const result = await updateUserModulePermission(user.id, module, newValue);

      if (result.success) {
        toast.success(`Acceso a "${MODULE_LABELS[module].label}" ${newValue ? 'habilitado' : 'revocado'}.`);
        onSaved(); // Informa a la tabla para recargar datos
      } else {
        // 2. Reversión si el servidor falla
        setLocalPerms(prev => ({ ...prev, [module]: !newValue }));
        toast.error(result.error || 'Error al actualizar el permiso en BD.');
      }
    } catch (error) {
      setLocalPerms(prev => ({ ...prev, [module]: !newValue }));
      toast.error('Error de red al intentar conectar con el servidor.');
    } finally {
      setSaving(null);
    }
  };

  const handleSaveQuota = async () => {
    setSaving('quota');
    try {
      const result = await updateUserTestQuota(user.id, testQuota);
      if (result.success) {
        toast.success(`Cuota actualizada a ${testQuota} tests.`);
        onSaved();
      } else {
        toast.error(result.error || 'Error al actualizar cuota.');
      }
    } catch (error) {
      toast.error('Error de red al actualizar la cuota.');
    } finally {
      setSaving(null);
    }
  };

  const configurableModules = (Object.keys(MODULE_LABELS) as ModuleKey[]).filter(
    m => !ADMIN_ONLY_MODULES.includes(m)
  );

  const defaultForRole = DEFAULT_PERMISSIONS[user.role as UserRole] || {};

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-[#293b64] rounded-xl">
          <Shield className="text-[#23bcef]" size={20} />
        </div>
        <div>
          <h3 className="font-black text-[#293b64] uppercase tracking-tight">
            Gestión de Accesos: {user.name}
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Rol: {user.role} · Permite accesos y asigna recursos
          </p>
        </div>
      </div>

      {/* Control de Cuotas */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-[#293b64]">
          <Activity size={18} />
          <h4 className="font-bold text-sm uppercase">Cuota de Tests Clínicos</h4>
        </div>
        <p className="text-xs text-slate-500">
          Asigna la cantidad de tests de edad biológica/genómicos que este profesional puede realizar en la plataforma.
        </p>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min="0"
            value={testQuota}
            onChange={(e) => setTestQuota(parseInt(e.target.value) || 0)}
            className="w-24 text-center font-bold"
          />
          <Button
            onClick={handleSaveQuota}
            disabled={saving === 'quota' || testQuota === (user.availableTests || 0)}
            className="bg-[#23bcef] hover:bg-[#1da8d8] text-white text-xs h-9 transition-colors"
          >
            {saving === 'quota' ? 'Guardando...' : 'Actualizar Saldo'}
          </Button>
        </div>
      </div>

      {/* Control de Switches / Toggles */}
      <div className="space-y-2">
        <h4 className="font-bold text-sm uppercase text-slate-400 mb-3">Módulos del Sistema</h4>
        {configurableModules.map(module => {
          const isEnabled = localPerms[module];
          const isDefault = defaultForRole[module];
          const isModified = isEnabled !== isDefault;
          const isSavingThis = saving === module;

          return (
            <div
              key={module}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isEnabled
                ? 'border-emerald-200 bg-emerald-50/50'
                : 'border-slate-100 bg-white'
                }`}
            >
              <div className="flex items-center gap-3">
                {isEnabled
                  ? <ShieldCheck size={16} className="text-emerald-500 flex-shrink-0" />
                  : <ShieldOff size={16} className="text-slate-300 flex-shrink-0" />
                }
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {MODULE_LABELS[module].label}
                    {isModified && (
                      <span className="ml-2 text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase">
                        Modificado
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-400">{MODULE_LABELS[module].description}</p>
                </div>
              </div>

              {/* BOTÓN SWITCH OPTIMIZADO */}
              <button
                type="button"
                onClick={() => handleToggle(module, !isEnabled)}
                disabled={isSavingThis}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#23bcef] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${isEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                aria-pressed={isEnabled}
              >
                <span className="sr-only">Toggle {MODULE_LABELS[module].label}</span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-100 mt-6">
        <Button variant="outline" onClick={onClose} className="text-sm font-bold text-slate-600">
          Cerrar Panel
        </Button>
      </div>
    </div>
  );
}