'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { updateUserModulePermission, updateUserTestQuota } from '@/lib/actions/permissions.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { resolvePermissions, ModuleKey, UserRole, DEFAULT_PERMISSIONS } from '@/lib/permissions';

interface PermissionsPanelProps {
  prof: {
    id: string;
    role: string;
    permissions?: any;
    availableTests?: number;
  };
  onSuccess: () => void;
}

export function PermissionsPanel({ prof, onSuccess }: PermissionsPanelProps) {
  const [loading, setLoading] = useState(false);
  const [quota, setQuota] = useState(prof.availableTests || 0);
  
  // Resuelve los permisos actuales combinando defaults con overrides
  const role = prof.role as UserRole;
  const currentPermissions = resolvePermissions(role, prof.permissions);

  const modules = Object.keys(DEFAULT_PERMISSIONS.ADMIN) as ModuleKey[];

  const handleToggle = async (module: ModuleKey, currentValue: boolean) => {
    setLoading(true);
    const newValue = !currentValue;
    const res = await updateUserModulePermission(prof.id, module, newValue);
    
    if (res.success) {
      toast.success(`Acceso a ${module} ${newValue ? 'habilitado' : 'deshabilitado'}.`);
      onSuccess(); // Recarga la lista
    } else {
      toast.error(res.error || "Error al actualizar permiso.");
    }
    setLoading(false);
  };

  const handleQuotaUpdate = async () => {
    setLoading(true);
    const res = await updateUserTestQuota(prof.id, quota);
    
    if (res.success) {
      toast.success(`Cuota de tests actualizada a ${quota}.`);
      onSuccess();
    } else {
      toast.error(res.error || "Error al actualizar cuota.");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
        <h4 className="text-xs font-black text-[#293b64] uppercase mb-4 tracking-widest">Cuota de Tests Biológicos</h4>
        <div className="flex items-center gap-4">
          <Input 
            type="number" 
            min={0}
            value={quota}
            onChange={(e) => setQuota(Number(e.target.value))}
            className="w-24 text-center font-bold text-lg text-[#293b64]"
          />
          <Button 
            onClick={handleQuotaUpdate} 
            disabled={loading || quota === prof.availableTests}
            className="bg-[#23bcef] text-white hover:bg-cyan-600 font-bold uppercase text-xs"
          >
            Actualizar Cuota
          </Button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2">Esta cuota es consumida por la PWA o por el Agente IA al realizar tests.</p>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-black text-[#293b64] uppercase tracking-widest border-b pb-2">Control de Acceso Modular (RBAC/ABAC)</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modules.map(module => {
            const hasAccess = currentPermissions[module];
            return (
              <div key={module} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                <span className="text-sm font-bold text-slate-700 capitalize">{module.replace('_', ' ')}</span>
                <button
                  disabled={loading}
                  onClick={() => handleToggle(module, hasAccess)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${hasAccess ? 'bg-[#23bcef]' : 'bg-slate-200'} ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${hasAccess ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
