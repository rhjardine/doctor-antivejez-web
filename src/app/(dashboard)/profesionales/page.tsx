'use client';

import { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaSearch, FaTimes, FaFileExcel, FaEye, FaEdit, FaTrash, FaExclamationTriangle, FaExclamationCircle } from 'react-icons/fa';
import { toast } from 'sonner';

// --- TIPOS DE DATOS ---
type Professional = {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  correo: string;
  rol: 'Medico' | 'Odontologo' | 'Coach' | 'Administrativo';
  estatus: '1' | '0'; // '1' para Activo, '0' para Inactivo
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
const FORM_LIMIT = 10;
const FORM_LIMIT_WARNING_THRESHOLD = 8;
const LIMITED_ROLES = ['Medico', 'Odontologo', 'Coach'];

// --- COMPONENTE PRINCIPAL ---
export default function ProfesionalesPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);

  useEffect(() => {
    // Simular carga de datos
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

  const handleSave = (professionalData: Professional) => {
    if (editingProfessional) {
      // Editar
      setProfessionals(prev => prev.map(p => p.id === editingProfessional.id ? { ...p, ...professionalData } : p));
      toast.success("Profesional actualizado con éxito.");
    } else {
      // Crear
      const newProfessional = { ...professionalData, id: Date.now(), formularios: 0 };
      setProfessionals(prev => [newProfessional, ...prev]);
      toast.success("Profesional agregado con éxito.");
    }
    handleCloseModal();
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
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Profesionales</h1>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <FaPlus /> Agregar Profesional
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center"><h3 className="text-gray-500">Total Profesionales</h3><p className="text-4xl font-bold text-primary">{summaryCards.total}</p></div>
        <div className="card text-center"><h3 className="text-gray-500">Activos</h3><p className="text-4xl font-bold text-green-500">{summaryCards.active}</p></div>
        <div className="card text-center"><h3 className="text-gray-500">Inactivos</h3><p className="text-4xl font-bold text-red-500">{summaryCards.inactive}</p></div>
      </div>
      
      {/* Barra de Herramientas y Tabla */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="relative flex-grow">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar por nombre, apellido o cédula..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input pl-10 w-full"/>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setSearchTerm('')} className="btn-secondary"><FaTimes /> Limpiar</button>
            <button className="btn-success"><FaFileExcel /> Exportar</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="table-header">Nombre y Apellido</th>
                <th className="table-header">Cédula</th>
                <th className="table-header">Correo</th>
                <th className="table-header">Rol</th>
                <th className="table-header">Estatus</th>
                <th className="table-header">Formularios</th>
                <th className="table-header">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProfessionals.map(p => {
                const isLimitedRole = LIMITED_ROLES.includes(p.rol);
                const formCount = p.formularios;
                let formStatusClass = '';
                let formIcon = null;

                if (isLimitedRole) {
                    if (formCount >= FORM_LIMIT) {
                        formStatusClass = 'text-red-500 font-bold';
                        formIcon = <FaExclamationTriangle className="inline ml-1" title={`Límite (${FORM_LIMIT}) alcanzado`}/>;
                    } else if (formCount >= FORM_LIMIT_WARNING_THRESHOLD) {
                        formStatusClass = 'text-yellow-500 font-bold';
                        formIcon = <FaExclamationCircle className="inline ml-1" title={`Cerca del límite (${FORM_LIMIT})`}/>;
                    }
                }

                return (
                  <tr key={p.id} className="table-row">
                    <td className="table-cell font-medium">{p.nombre} {p.apellido}</td>
                    <td className="table-cell">{p.cedula}</td>
                    <td className="table-cell">{p.correo}</td>
                    <td className="table-cell">{p.rol}</td>
                    <td className={`table-cell font-semibold ${p.estatus === '1' ? 'text-green-600' : 'text-gray-500'}`}>{p.estatus === '1' ? 'Activo' : 'Inactivo'}</td>
                    <td className={`table-cell ${formStatusClass}`}>{formCount}{formIcon}</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-500 hover:text-blue-600"><FaEye /></button>
                        <button onClick={() => handleOpenModal(p)} className="p-2 text-gray-500 hover:text-green-600"><FaEdit /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-500 hover:text-red-600"><FaTrash /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Paginación */}
        {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">&laquo;</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 border rounded ${currentPage === page ? 'bg-primary text-white' : ''}`}>{page}</button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">&raquo;</button>
            </div>
        )}
      </div>

      {isModalOpen && <ProfessionalFormModal professional={editingProfessional} onSave={handleSave} onClose={handleCloseModal} />}
    </div>
  );
}

// --- COMPONENTE MODAL ---
function ProfessionalFormModal({ professional, onSave, onClose }: { professional: Professional | null, onSave: (data: Professional) => void, onClose: () => void }) {
  const [formData, setFormData] = useState<Omit<Professional, 'id'>>({
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
    onSave({ ...formData, id: professional?.id || 0 });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 animate-fadeIn">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{professional ? 'Editar' : 'Agregar'} Profesional</h2>
          <button onClick={onClose} className="p-2"><FaTimes /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="label">Nombre</label><input name="nombre" value={formData.nombre} onChange={handleChange} className="input" required/></div>
            <div><label className="label">Apellido</label><input name="apellido" value={formData.apellido} onChange={handleChange} className="input" required/></div>
            <div><label className="label">Cédula</label><input name="cedula" value={formData.cedula} onChange={handleChange} className="input" required/></div>
            <div><label className="label">Correo</label><input type="email" name="correo" value={formData.correo} onChange={handleChange} className="input" required/></div>
            <div><label className="label">Rol</label><select name="rol" value={formData.rol} onChange={handleChange} className="input"><option>Medico</option><option>Odontologo</option><option>Coach</option><option>Administrativo</option></select></div>
            <div><label className="label">Estatus</label><select name="estatus" value={formData.estatus} onChange={handleChange} className="input"><option value="1">Activo</option><option value="0">Inactivo</option></select></div>
            <div><label className="label">Formularios Usados</label><input type="number" name="formularios" value={formData.formularios} onChange={handleChange} className="input bg-gray-100" readOnly/></div>
          </div>
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
