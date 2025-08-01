'use client';

import { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaSearch, FaTimes, FaFileExcel, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaFileAlt, FaLayerGroup } from 'react-icons/fa';
import { toast } from 'sonner';

// --- TIPOS DE DATOS ---
type ProfessionalRole = 'Medico' | 'Odontologo' | 'Coach' | 'Administrativo';
type ProfessionalStatus = '1' | '0'; // '1' para Activo, '0' para Inactivo

type Professional = {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  correo: string;
  rol: ProfessionalRole;
  estatus: ProfessionalStatus;
  formularios: number;
};

// --- DATOS DE EJEMPLO (SIMULACIÓN DE API) ---
const initialProfessionals: Professional[] = [
    { id: 1, nombre: "Richard", apellido: "Jarbine", cedula: "V-12345653", correo: "mjardineig@gmail.com", rol: "Medico", estatus: "0", formularios: 0 },
    { id: 2, nombre: "Carolina", apellido: "Salvatori", cedula: "E-23522935", correo: "DRACAROLINASALVATORI@hotmail.com", rol: "Medico", estatus: "1", formularios: 50 },
    { id: 3, nombre: "Silvina", apellido: "Plaza", cedula: "E-27388831", correo: "SILVINA_PLAZA@HOTMAIL.COM", rol: "Odontologo", estatus: "1", formularios: 9 },
    { id: 4, nombre: "Claudia", apellido: "Tocomas", cedula: "E-26837632", correo: "DRA_CLAUDIA_TOCOMAS@HOTMAIL.COM", rol: "Coach", estatus: "1", formularios: 10 },
    { id: 5, nombre: "Lidia", apellido: "Alonzo", cedula: "E-22754862", correo: "LIDIAESTERALONZO@GMAIL.COM", rol: "Administrativo", estatus: "1", formularios: 50 },
    { id: 6, nombre: "Juan", apellido: "Perez", cedula: "V-9876543", correo: "jperez@mail.com", rol: "Coach", estatus: "1", formularios: 7 },
    { id: 7, nombre: "Maria", apellido: "Gonzalez", cedula: "V-1122334", correo: "mgonzalez@mail.com", rol: "Medico", estatus: "0", formularios: 11 },
];

const ITEMS_PER_PAGE = 5;

// --- COMPONENTE MODAL ASIGNAR FORMULARIOS ---
function AssignFormsModal({ professional, onSave, onClose }: { professional: Professional, onSave: (id: number, amount: number) => void, onClose: () => void }) {
  const [amount, setAmount] = useState(100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!isNaN(numericAmount) && numericAmount > 0) {
      onSave(professional.id, numericAmount);
    } else {
      toast.error("La cantidad debe ser un número mayor a cero.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4 pb-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Asignar Formularios</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><FaTimes className="text-gray-500"/></button>
        </div>
        <p className="mb-2">Profesional: <span className="font-semibold">{professional.nombre} {professional.apellido}</span></p>
        <p className="mb-4">Formularios Disponibles: <span className="font-semibold">{professional.formularios}</span></p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="form-amount" className="label">Cantidad a Asignar</label>
            <input
              id="form-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="input"
              min="1"
              step="1"
              required
            />
          </div>
          <div className="flex justify-end gap-4 pt-4 border-t mt-4">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Asignar</button>
          </div>
        </form>
      </div>
    </div>
  );
}


// --- COMPONENTE PRINCIPAL ---
export default function ProfesionalesPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [professionalToAssign, setProfessionalToAssign] = useState<Professional | null>(null);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setProfessionals(initialProfessionals);
      setLoading(false);
    }, 500);
  }, []);

  const filteredProfessionals = useMemo(() => {
    return professionals.filter(p =>
      `${p.nombre} ${p.apellido} ${p.cedula}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [professionals, searchTerm]);

  const paginatedProfessionals = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProfessionals.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProfessionals, currentPage]);

  const totalPages = Math.ceil(filteredProfessionals.length / ITEMS_PER_PAGE);

  const handleOpenModal = (professional: Professional | null = null) => {
    setEditingProfessional(professional);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProfessional(null);
  };

  const handleOpenAssignModal = (professional: Professional) => {
    setProfessionalToAssign(professional);
    setIsAssignModalOpen(true);
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
    setProfessionalToAssign(null);
  };

  const handleSave = (professionalData: Professional) => {
    if (editingProfessional) {
      setProfessionals(prev => prev.map(p => p.id === editingProfessional.id ? { ...p, ...professionalData } : p));
      toast.success("Profesional actualizado con éxito.");
    } else {
      const newProfessional = { ...professionalData, id: Date.now(), formularios: professionalData.formularios || 0 };
      setProfessionals(prev => [newProfessional, ...prev]);
      toast.success("Profesional agregado con éxito.");
    }
    handleCloseModal();
  };

  const handleAssignForms = (id: number, amount: number) => {
    setProfessionals(prev =>
      prev.map(p =>
        p.id === id ? { ...p, formularios: p.formularios + amount } : p
      )
    );
    toast.success(`${amount} formularios asignados con éxito.`);
    handleCloseAssignModal();
  };
  
  const handleToggleStatus = (id: number) => {
    setProfessionals(prev => prev.map(p => p.id === id ? {...p, estatus: p.estatus === '1' ? '0' : '1'} : p));
    toast.info("Estatus del profesional actualizado.");
  };

  const handleDelete = (id: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar a este profesional?")) {
      setProfessionals(prev => prev.filter(p => p.id !== id));
      toast.success("Profesional eliminado.");
    }
  };
  
  const summaryCards = useMemo(() => ({
      total: professionals.length,
      active: professionals.filter(p => p.estatus === '1').length,
      inactive: professionals.filter(p => p.estatus === '0').length,
  }), [professionals]);

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="loader"></div></div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Profesionales</h1>
          <p className="text-gray-600 mt-1">Administra el personal médico y administrativo del sistema.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <FaPlus /> Agregar Profesional
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center"><h3 className="text-gray-500 font-medium">TOTAL DE PROFESIONALES</h3><p className="text-4xl font-bold text-primary">{summaryCards.total}</p></div>
        <div className="card text-center"><h3 className="text-gray-500 font-medium">ACTIVOS</h3><p className="text-4xl font-bold text-green-600">{summaryCards.active}</p></div>
        <div className="card text-center"><h3 className="text-gray-500 font-medium">INACTIVOS</h3><p className="text-4xl font-bold text-red-600">{summaryCards.inactive}</p></div>
      </div>
      
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="relative flex-grow max-w-lg">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar por nombre, apellido o cédula..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input pl-10 w-full"/>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSearchTerm('')} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <FaTimes /> Limpiar
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
              <FaFileExcel /> Exportar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-primary-dark">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Nombre y Apellido</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Cédula</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Correo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Estatus</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Formularios Disp.</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {paginatedProfessionals.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{p.nombre} {p.apellido}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{p.cedula}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{p.correo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{p.rol}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${p.estatus === '1' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {p.estatus === '1' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center font-medium text-gray-700">{p.formularios}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleToggleStatus(p.id)} className={`p-2 rounded-md transition-colors ${p.estatus === '1' ? 'text-green-500 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-200'}`} title={p.estatus === '1' ? 'Desactivar' : 'Activar'}>
                          {p.estatus === '1' ? <FaToggleOn size={18}/> : <FaToggleOff size={18}/>}
                        </button>
                        <button onClick={() => handleOpenAssignModal(p)} className="p-2 rounded-md text-indigo-500 hover:bg-indigo-100" title="Asignar Formularios"><FaLayerGroup /></button>
                        <button onClick={() => toast.info('Funcionalidad de Formularios en desarrollo.')} className="p-2 rounded-md text-blue-500 hover:bg-blue-100" title="Ver Formularios"><FaFileAlt /></button>
                        <button onClick={() => handleOpenModal(p)} className="p-2 rounded-md text-yellow-500 hover:bg-yellow-100" title="Ver/Editar"><FaEdit /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-2 rounded-md text-red-500 hover:bg-red-100" title="Eliminar"><FaTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded-md disabled:opacity-50">&laquo;</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 border rounded-md ${currentPage === page ? 'bg-primary text-white border-primary' : 'hover:bg-gray-100'}`}>{page}</button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md disabled:opacity-50">&raquo;</button>
            </div>
        )}
      </div>

      {isModalOpen && <ProfessionalFormModal professional={editingProfessional} onSave={handleSave} onClose={handleCloseModal} />}
      {isAssignModalOpen && professionalToAssign && <AssignFormsModal professional={professionalToAssign} onSave={handleAssignForms} onClose={handleCloseAssignModal} />}
    </div>
  );
}

// --- COMPONENTE MODAL EDICIÓN ---
function ProfessionalFormModal({ professional, onSave, onClose }: { professional: Professional | null, onSave: (data: Professional) => void, onClose: () => void }) {
  const [formData, setFormData] = useState({
    nombre: professional?.nombre || '',
    apellido: professional?.apellido || '',
    cedula: professional?.cedula || '',
    correo: professional?.correo || '',
    rol: professional?.rol || 'Medico',
    estatus: professional?.estatus || '1',
    formularios: professional?.formularios || 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, id: professional?.id || 0 } as Professional);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">{professional ? 'Editar' : 'Agregar'} Profesional</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><FaTimes className="text-gray-500"/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="label">Nombre</label><input name="nombre" value={formData.nombre} onChange={handleChange} className="input" required/></div>
            <div><label className="label">Apellido</label><input name="apellido" value={formData.apellido} onChange={handleChange} className="input" required/></div>
            <div><label className="label">Cédula</label><input name="cedula" value={formData.cedula} onChange={handleChange} className="input" required/></div>
            <div><label className="label">Correo</label><input type="email" name="correo" value={formData.correo} onChange={handleChange} className="input" required/></div>
            <div><label className="label">Rol</label><select name="rol" value={formData.rol} onChange={handleChange} className="input"><option>Medico</option><option>Odontologo</option><option>Coach</option><option>Administrativo</option></select></div>
            <div><label className="label">Estatus</label><select name="estatus" value={formData.estatus} onChange={handleChange} className="input"><option value="1">Activo</option><option value="0">Inactivo</option></select></div>
             {/* El campo de formularios no es editable directamente aquí, se gestiona con el nuevo modal */}
            <div className="md:col-span-2"><label className="label">Formularios Disponibles</label><input type="number" name="formularios" value={formData.formularios} className="input bg-gray-100 cursor-not-allowed" readOnly/></div>
          </div>
          <div className="flex justify-end gap-4 pt-6 border-t mt-6">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
}
