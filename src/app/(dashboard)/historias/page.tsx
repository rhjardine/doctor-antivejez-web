'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { FaPlus, FaSearch, FaEye, FaEdit, FaTrash, FaVial, FaTh, FaList, FaHistory, FaFileMedicalAlt } from 'react-icons/fa';
import { getPaginatedPatients, deletePatient, searchPatients } from '@/lib/actions/patients.actions';
import { formatDate } from '@/utils/date';
import { formatIdentification } from '@/utils/format';
import { toast } from 'sonner';
import type { PatientWithDetails } from '@/types';

type Patient = PatientWithDetails;
const ITEMS_PER_PAGE = 10;

export default function HistoriasPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  // ===== INICIO DE LA CORRECCIÓN =====
  // Se permite que el estado acepte tanto 'list' como 'grid' para solucionar el error.
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  // ===== FIN DE LA CORRECCIÓN =====
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      loadPatients(currentPage, session.user.id);
    } else if (status === 'unauthenticated') {
        setLoading(false);
    }
  }, [currentPage, session, status]);

  const loadPatients = async (page: number, userId: string) => {
    setLoading(true);
    try {
      const result = await getPaginatedPatients({ page, limit: ITEMS_PER_PAGE, userId });
      if (result.success && result.patients) {
        setPatients(result.patients as Patient[]);
        setTotalPages(result.totalPages || 0);
      }
    } catch (error) {
      toast.error('Error al cargar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!session?.user?.id) return;
    setCurrentPage(1);
    setLoading(true);
    try {
      const result = searchQuery.trim()
        ? await searchPatients({ query: searchQuery, page: 1, limit: ITEMS_PER_PAGE, userId: session.user.id })
        : await getPaginatedPatients({ page: 1, limit: ITEMS_PER_PAGE, userId: session.user.id });

      if (result.success && result.patients) {
        setPatients(result.patients as Patient[]);
        setTotalPages(result.totalPages || 0);
      }
    } catch (error) {
      toast.error('Error al buscar pacientes');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!patientToDelete || !session?.user?.id) return;

    try {
      const result = await deletePatient(patientToDelete);
      if (result.success) {
        toast.success('Paciente eliminado exitosamente');
        loadPatients(currentPage, session.user.id);
      } else {
        toast.error(result.error || 'Error al eliminar paciente');
      }
    } catch (error) {
      toast.error('Error al eliminar paciente');
    } finally {
      setDeleteModalOpen(false);
      setPatientToDelete(null);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Pacientes</h1>
          <p className="text-gray-600 mt-1">Administra las historias clínicas de tus pacientes</p>
        </div>
        <Link
          href="/historias/nuevo"
          className="btn-primary flex items-center space-x-2"
        >
          <FaPlus />
          <span>Nuevo Paciente</span>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, identificación, N° Control..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <FaTh />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <FaList />
            </button>
          </div>
        </div>
      </div>

      {/* Patients View */}
      {patients.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No se encontraron pacientes para tu usuario</p>
          <Link href="/historias/nuevo" className="btn-primary mt-4 inline-block">
            Registrar primer paciente
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((patient) => {
            const isMale = patient.gender.startsWith('MASCULINO');
            const iconBgColor = isMale ? 'bg-blue-100' : 'bg-pink-100';
            const iconTextColor = isMale ? 'text-blue-600' : 'text-pink-600';
            
            return (
              <div key={patient.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className={`w-16 h-16 rounded-full ${iconBgColor} flex items-center justify-center flex-shrink-0`}>
                    <span className={`text-xl font-bold ${iconTextColor}`}>
                      {patient.firstName[0]}{patient.lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {patient.firstName} {patient.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">N° Control: {String(patient.controlNumber).padStart(4, '0')}</p>
                    <p className="text-sm text-gray-500">ID: {formatIdentification(patient.nationality, patient.identification)}</p>
                    <p className="text-sm text-gray-500">Edad: {patient.chronologicalAge}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Registrado: {formatDate(patient.createdAt)}</span>
                    {patient.biophysicsTests && patient.biophysicsTests.length > 0 && (
                      <span className="text-green-600">
                        Edad Bio: {patient.biophysicsTests[0].biologicalAge !== null && patient.biophysicsTests[0].biologicalAge !== undefined
                          ? `${Math.round(patient.biophysicsTests[0].biologicalAge)} años`
                          : '--'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex justify-end space-x-2">
                  <button onClick={() => router.push(`/historias/${patient.id}?tab=resumen`)} className="p-2 text-green-600 hover:bg-green-50 rounded" title="Ver Resumen Clínico"><FaFileMedicalAlt /></button>
                  <button onClick={() => router.push(`/historias/${patient.id}?tab=historia`)} className="p-2 text-cyan-600 hover:bg-cyan-50 rounded" title="Ver Historia Médica"><FaEdit /></button>
                  <button onClick={() => router.push(`/historias/${patient.id}?tab=biofisica`)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Ir a Tests"><FaVial /></button>
                  <button onClick={() => router.push(`/historias/${patient.id}?tab=biofisica&view=history`)} className="p-2 text-purple-600 hover:bg-purple-50 rounded" title="Ver Historial de Tests"><FaHistory /></button>
                  <button onClick={() => { setPatientToDelete(patient.id); setDeleteModalOpen(true); }} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Eliminar Registro de Paciente"><FaTrash /></button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto custom-scrollbar-tabs">
            <table className="w-full">
              <thead className="bg-primary-dark">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-white uppercase tracking-wider">PACIENTE</th>
                  <th className="text-left py-3 px-4 font-medium text-white uppercase tracking-wider">N° CONTROL</th>
                  <th className="text-left py-3 px-4 font-medium text-white uppercase tracking-wider">IDENTIFICACIÓN</th>
                  <th className="text-left py-3 px-4 font-medium text-white uppercase tracking-wider">EDAD</th>
                  <th className="text-left py-3 px-4 font-medium text-white uppercase tracking-wider">PROFESIONAL</th>
                  <th className="text-left py-3 px-4 font-medium text-white uppercase tracking-wider">FECHA REGISTRO</th>
                  <th className="text-left py-3 px-4 font-medium text-white uppercase tracking-wider">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {patients.map((patient) => {
                  const isMale = patient.gender.startsWith('MASCULINO');
                  const iconBgColor = isMale ? 'bg-blue-100' : 'bg-pink-100';
                  const iconTextColor = isMale ? 'text-blue-600' : 'text-pink-600';

                  return (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full ${iconBgColor} flex items-center justify-center flex-shrink-0`}>
                            <span className={`text-sm font-bold ${iconTextColor}`}>
                              {patient.firstName[0]}{patient.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {patient.firstName} {patient.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{patient.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700 font-medium">{String(patient.controlNumber).padStart(4, '0')}</td>
                      <td className="py-3 px-4 text-gray-700">{formatIdentification(patient.nationality, patient.identification)}</td>
                      <td className="py-3 px-4 text-gray-700">{patient.chronologicalAge}</td>
                      <td className="py-3 px-4 text-gray-700">Dr. Admin</td>
                      <td className="py-3 px-4 text-gray-700">{formatDate(patient.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button onClick={() => router.push(`/historias/${patient.id}?tab=resumen`)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Ver Resumen Clínico"><FaFileMedicalAlt /></button>
                          <button onClick={() => router.push(`/historias/${patient.id}?tab=historia`)} className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded" title="Ver Historia Médica"><FaEdit /></button>
                          <button onClick={() => router.push(`/historias/${patient.id}?tab=biofisica`)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Ir a Tests"><FaVial /></button>
                          <button onClick={() => router.push(`/historias/${patient.id}?tab=biofisica&view=history`)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded" title="Ver Historial de Tests"><FaHistory /></button>
                          <button onClick={() => { setPatientToDelete(patient.id); setDeleteModalOpen(true); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Eliminar Registro de Paciente"><FaTrash /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded-md disabled:opacity-50 hover:bg-gray-100 transition-colors">&laquo;</button>
          <span className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md disabled:opacity-50 hover:bg-gray-100 transition-colors">&raquo;</button>
        </div>
      )}

      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar eliminación</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar este paciente? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setPatientToDelete(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
