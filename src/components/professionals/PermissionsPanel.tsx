'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Shield, ShieldCheck, ShieldOff, Activity } from 'lucide-react';
import { updateUserModulePermission, updateUserTestQuota } from '@/lib/actions/permissions.actions';
import { resolvePermissions, DEFAULT_PERMISSIONS, ADMIN_ONLY_MODULES, ModuleKey, UserRole } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PermissionsPanelProps {
  prof: {
    id: string;
    name: string | null;
    role: string;
    permissions?: Record<string, boolean> | null;
    availableTests?: number;
  };
  onClose?: () => void;
  onSuccess: () => void;
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

/**
 * Panel de gestión de permisos y cuotas para profesionales.
 * Utiliza exportación nombrada para evitar errores de importación en Render.
 */
export function PermissionsPanel({ prof, onClose, onSuccess }: PermissionsPanelProps) {
  // Inicializamos el estado local basándonos en las propiedades recibidas
  const [localPerms, setLocalPerms] = useState<Record<ModuleKey, boolean>>(() =>
    resolvePermissions(prof.role as UserRole, prof.permissions)
  );
  const [testQuota, setTestQuota] = useState<number>(prof.availableTests || 0);
  const [saving, setSaving] = useState<ModuleKey | 'quota' | null>(null);

  // Sincronizar el estado interno si el objeto 'prof' cambia desde el padre
  useEffect(() => {
    setLocalPerms(resolvePermissions(prof.role as UserRole, prof.permissions));
    setTestQuota(prof.availableTests || 0);
  }, [prof]);

  const handleToggle = async (module: ModuleKey, newValue: boolean) => {
    if (ADMIN_ONLY_MODULES.includes(module)) {
      toast.error('Este módulo es exclusivo del Administrador.');
      return;
    }

    setSaving(module);
    // Actualización optimista para mejorar la respuesta visual
    setLocalPerms(prev => ({ ...prev, [module]: newValue }));

    try {
      const result = await updateUserModulePermission(prof.id, module, newValue);

      if (result.success) {
        toast.success(`Acceso a "${MODULE_LABELS[module].label}" ${newValue ? 'habilitado' : 'revocado'}.`);
        onSuccess(); // Notifica a la página para refrescar la lista de profesionales
      } else {
        // Revertir en caso de fallo en el servidor
        setLocalPerms(prev => ({ ...prev, [module]: !newValue }));
        toast.error(result.error || 'Error al actualizar el permiso en la base de datos.');
      }
    } catch (error) {
      setLocalPerms(prev => ({ ...prev, [module]: !newValue }));
      toast.error('Error de red al intentar actualizar los permisos.');
    } finally {
      setSaving(null);
    }
  };

  const handleSaveQuota = async () => {
    setSaving('quota');
    try {
      const result = await updateUserTestQuota(prof.id, testQuota);
      if (result.success) {
        toast.success(`Cuota actualizada exitosamente a ${testQuota} tests.`);
        onSuccess();
      } else {
        toast.error(result.error || 'No se pudo actualizar la cuota.');
      }
    } catch (error) {
      toast.error('Error de red al intentar actualizar la cuota.');
    } finally {
      setSaving(null);
    }
  };

  const configurableModules = (Object.keys(MODULE_LABELS) as ModuleKey[]).filter(
    m => !ADMIN_ONLY_MODULES.includes(m)
  );

  const defaultForRole = DEFAULT_PERMISSIONS[prof.role as UserRole] || {};

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-[#293b64] rounded-xl shadow-sm">
          <Shield className="text-[#23bcef]" size={20} />
        </div>
        <div>
          <h3 className="font-black text-[#293b64] uppercase tracking-tight text-sm">
            Accesos de {prof.name || 'Profesional'}
          </h3>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            Rol: {prof.role} · {prof.id}
          </p>
        </div>
      </div>

      {/* Sección de Gestión de Cuotas */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-[#293b64]">
          <Activity size={18} className="text-[#23bcef]" />
          <h4 className="font-black text-xs uppercase tracking-tighter">Tests Disponibles</h4>
        </div>
        <p className="text-[11px] text-slate-500 font-medium leading-tight">
          Asigna la cantidad de tests clínicos que el profesional puede ejecutar antes de requerir una recarga del administrador.
        </p>
        <div className="flex items-center gap-3 pt-1">
          <Input
            type="number"
            min="0"
            value={testQuota}
            onChange={(e) => setTestQuota(parseInt(e.target.value) || 0)}
            className="w-24 text-center font-black text-[#293b64] border-slate-200"
          />
          <Button
            onClick={handleSaveQuota}
            disabled={saving === 'quota' || testQuota === (prof.availableTests || 0)}
            className="bg-[#293b64] hover:bg-[#1e2b4a] text-white text-[10px] font-black uppercase h-10 px-4 transition-all"
          >
            {saving === 'quota' ? 'Procesando...' : 'Actualizar Saldo'}
          </Button>
        </div>
      </div>

      {/* Listado de Módulos con Switches */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-4 px-1">
          <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Habilitar Módulos</h4>
          <span className="text-[9px] font-bold text-slate-300 uppercase">Estado</span>
        </div>

        {configurableModules.map(module => {
          const isEnabled = localPerms[module];
          const isDefault = defaultForRole[module];
          const isModified = isEnabled !== isDefault;
          const isSavingThis = saving === module;

          return (
            <div
              key={module}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 ${isEnabled
                  ? 'border-[#23bcef]/30 bg-[#23bcef]/5 shadow-sm'
                  : 'border-slate-100 bg-white'
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${isEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  {isEnabled ? <ShieldCheck size={16} /> : <ShieldOff size={16} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className={`text-xs font-black uppercase tracking-tighter ${isEnabled ? 'text-[#293b64]' : 'text-slate-500'}`}>
                      {MODULE_LABELS[module].label}
                    </p>
                    {isModified && (
                      <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100 uppercase tracking-tighter">
                        Manual
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">{MODULE_LABELS[module].description}</p>
                </div>
              </div>

              {/* Interruptor (Toggle Switch) */}
              <button
                type="button"
                onClick={() => handleToggle(module, !isEnabled)}
                disabled={isSavingThis}
                className={`group relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#23bcef] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${isEnabled ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                aria-pressed={isEnabled}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      {onClose && (
        <div className="flex justify-end pt-4 border-t border-slate-100 mt-6">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50"
          >
            Cerrar Configuración
          </Button>
        </div>
      )}
    </div>
  );
}