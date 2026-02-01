'use client';

import { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaSearch } from 'react-icons/fa';
import { toast } from 'sonner';
import { ProfessionalRow } from '@/components/professionals/ProfessionalRow';
import { rechargeProfessionalQuota } from '@/lib/actions/professionals.actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

// Interface must match API response
interface Professional {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEDICO' | 'COACH';
  status: 'ACTIVO' | 'INACTIVO';
  quotaMax: number;
  quotaUsed: number;
  cedula?: string;
  password?: string;
}

export default function ProfesionalesPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [selectedProf, setSelectedProf] = useState<Professional | null>(null);

  // Forms state
  const [rechargeAmount, setRechargeAmount] = useState(50);
  const [formData, setFormData] = useState<Partial<Professional>>({});

  const fetchProfessionals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/professionals');
      if (res.ok) {
        const data = await res.json();
        setProfessionals(data);
      } else {
        toast.error("Error cargando profesionales");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const filtered = useMemo(() => {
    return professionals.filter(p =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [professionals, searchTerm]);

  const stats = useMemo(() => ({
    total: professionals.length,
    active: professionals.filter(p => p.status === 'ACTIVO').length,
    inactive: professionals.filter(p => p.status === 'INACTIVO').length
  }), [professionals]);

  // Handlers
  const handleRecharge = async () => {
    if (!selectedProf) return;
    const res = await rechargeProfessionalQuota(selectedProf.id, rechargeAmount);
    if (res.success) {
      toast.success("Cuota recargada con éxito");
      setIsRechargeModalOpen(false);
      fetchProfessionals(); // Refresh list
    } else {
      toast.error(res.error || "Error al recargar");
    }
  };

  const handleDelete = async (prof: Professional) => {
    if (!confirm("¿Eliminar este profesional?")) return;
    try {
      const res = await fetch(`/api/professionals?id=${prof.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Profesional eliminado");
        fetchProfessionals();
      } else {
        toast.error("Error al eliminar");
      }
    } catch (e) { toast.error("Error al eliminar"); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = selectedProf ? 'PUT' : 'POST';
    const body = selectedProf ? { ...formData, id: selectedProf.id } : formData;

    try {
      const res = await fetch('/api/professionals', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        toast.success(selectedProf ? "Actualizado" : "Creado");
        setIsEditModalOpen(false);
        fetchProfessionals();
      } else {
        toast.error("Error al guardar");
      }
    } catch (e) { toast.error("Error al guardar"); }
  };

  return (
    <div className="space-y-6 p-6 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-[#293b64] tracking-tight">Gestión de Profesionales</h1>
          <p className="text-slate-500 font-medium">Administra tu red de doctores y coaches</p>
        </div>
        <Button
          onClick={() => { setSelectedProf(null); setFormData({ role: 'MEDICO', status: 'ACTIVO' }); setIsEditModalOpen(true); }}
          className="bg-[#293b64] hover:bg-[#1e2b4a] text-white font-bold tracking-wider"
        >
          <FaPlus className="mr-2" /> NUEVO PROFESIONAL
        </Button>
      </div>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total</span>
          <span className="text-4xl font-black text-[#293b64]">{stats.total}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center border-b-4 border-b-emerald-400">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Activos</span>
          <span className="text-4xl font-black text-emerald-600">{stats.active}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center border-b-4 border-b-rose-400">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Inactivos</span>
          <span className="text-4xl font-black text-rose-600">{stats.inactive}</span>
        </div>
      </div>

      {/* Search & Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex items-center">
          <FaSearch className="text-slate-400 mr-3" />
          <input
            className="bg-transparent outline-none w-full text-sm font-medium text-slate-600 placeholder:text-slate-400"
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#293b64] text-white text-xs uppercase tracking-wider">
                <th className="p-4 font-black">Nombre / Profesional</th>
                <th className="p-4 font-black">Identificación</th>
                <th className="p-4 font-black">Rol</th>
                <th className="p-4 font-black text-center">Estatus</th>
                <th className="p-4 font-black text-center">Créditos Disp.</th>
                <th className="p-4 font-black text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">Cargando...</td></tr>
              ) : filtered.map(prof => (
                <ProfessionalRow
                  key={prof.id}
                  prof={prof}
                  onEdit={() => { setSelectedProf(prof); setFormData(prof); setIsEditModalOpen(true); }}
                  onRecharge={() => { setSelectedProf(prof); setIsRechargeModalOpen(true); }}
                  onDelete={() => handleDelete(prof)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>{selectedProf ? 'Editar Profesional' : 'Nuevo Profesional'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-[#293b64]">Nombre Completo</label>
              <Input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="border-[#293b64] focus:ring-[#23bcef]" required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-[#293b64]">Correo Electrónico</label>
              <Input type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} className="border-[#293b64] focus:ring-[#23bcef]" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-[#293b64]">Rol</label>
                <select
                  value={formData.role || 'MEDICO'}
                  onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full flex h-10 rounded-md border border-[#293b64] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#23bcef]"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="MEDICO">Médico</option>
                  <option value="COACH">Coach</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-[#293b64]">Estatus</label>
                <select
                  value={formData.status || 'ACTIVO'}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full flex h-10 rounded-md border border-[#293b64] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#23bcef]"
                >
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                </select>
              </div>
            </div>
            {!selectedProf && (
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-[#293b64]">Contraseña</label>
                <Input type="password" value={formData.password as string || ''} onChange={e => setFormData({ ...formData, password: e.target.value })} className="border-[#293b64]" placeholder="Opcional (default: 123456)" />
              </div>
            )}
            <DialogFooter className="mt-6">
              <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-[#293b64] text-white font-bold">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Recharge Modal */}
      <Dialog open={isRechargeModalOpen} onOpenChange={setIsRechargeModalOpen}>
        <DialogContent className="sm:max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#23bcef]">Recargar Cuota</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <p className="text-sm text-slate-600">
              Añadir créditos al balance actual de <span className="font-bold">{selectedProf?.quotaMax && (selectedProf.quotaMax - selectedProf.quotaUsed)}</span>.
            </p>
            <Input
              type="number"
              value={rechargeAmount}
              onChange={e => setRechargeAmount(Number(e.target.value))}
              className="text-center text-3xl font-black text-[#293b64] h-16 border-2 border-dashed border-[#23bcef]"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleRecharge} className="w-full bg-[#23bcef] text-white font-black hover:bg-cyan-600">CONFIRMAR RECARGA</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
