'use client';

// src/components/biochemistry/BiochemistryHistoryView.tsx
import { useState, useMemo, useEffect } from 'react';
import { PatientWithDetails, BiochemistryTest } from '@/types';
import { BIOCHEMISTRY_ITEMS } from '@/types/biochemistry';
import { formatDate, formatDateTime } from '@/utils/date';
import { FaArrowLeft, FaChartLine, FaTrash, FaExclamationTriangle, FaFlask } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { deleteBiochemistryTest } from '@/lib/actions/biochemistry.actions';
import { getBiochemistryStatus, getStatusColorClass } from '@/utils/bioquimica-calculations';
import { toast } from 'sonner';

// --- Modal de Confirmación para Eliminar ---
function DeleteConfirmationModal({ isOpen, onClose, onConfirm, test, isDeleting }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, test: BiochemistryTest | null, isDeleting: boolean }) {
  if (!isOpen || !test) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center relative animate-slideUp">
        <FaExclamationTriangle className="text-yellow-500 text-6xl mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">Confirmar Eliminación</h3>
        <p className="text-gray-600 mb-6">¿Estás seguro de que deseas eliminar el test del <strong className="font-semibold">{formatDateTime(test.testDate)}</strong>? Esta acción no se puede deshacer.</p>
        <div className="flex justify-center gap-4"><button onClick={onClose} className="btn-secondary" disabled={isDeleting}>Cancelar</button><button onClick={onConfirm} className="btn-danger" disabled={isDeleting}>{isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}</button></div>
      </div>
    </div>
  );
}

// --- Componente Principal ---
interface BiochemistryHistoryViewProps {
  patient: PatientWithDetails;
  onBack: () => void;
  onHistoryChange: () => void;
}

export default function BiochemistryHistoryView({ patient, onBack, onHistoryChange }: BiochemistryHistoryViewProps) {
  const [selectedTest, setSelectedTest] = useState<BiochemistryTest | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<BiochemistryTest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sortedTests = useMemo(() =>
    [...(patient.biochemistryTests || [])].sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime()),
    [patient.biochemistryTests]
  );

  useEffect(() => {
    if (sortedTests.length > 0 && !selectedTest) {
      setSelectedTest(sortedTests[0]);
    }
  }, [sortedTests, selectedTest]);

  const chartData = useMemo(() => sortedTests.map(test => ({
    date: formatDate(test.testDate),
    'Edad Bioquímica': test.biochemicalAge,
    'Edad Cronológica': test.chronologicalAge,
  })).reverse(), [sortedTests]);

  const handleDeleteRequest = (test: BiochemistryTest) => {
    setTestToDelete(test);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!testToDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteBiochemistryTest(testToDelete.id);
      if (result.success) {
        toast.success('Test eliminado exitosamente.');
        setSelectedTest(null);
        onHistoryChange();
      } else {
        toast.error(result.error || 'No se pudo eliminar el test.');
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado al eliminar.');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <>
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} test={testToDelete} isDeleting={isDeleting} />
      <div className="space-y-8 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={onBack} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-lg" title="Volver"><FaArrowLeft className="text-lg" /></button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Historial de Tests Bioquímicos</h2>
              <p className="text-gray-600">Evolución de {patient.firstName} {patient.lastName}</p>
            </div>
          </div>
        </div>

        {sortedTests.length === 0 ? (
          <div className="card text-center py-12"><FaFlask className="mx-auto text-6xl text-gray-300 mb-4" /><h3 className="text-xl font-semibold text-gray-700 mb-2">No hay tests registrados</h3><p className="text-gray-500">Aún no se han realizado tests bioquímicos para este paciente.</p></div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center"><FaChartLine className="mr-2 text-primary" />Evolución de Edad Bioquímica vs. Cronológica</h3>
              <div className="h-80"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" /><XAxis dataKey="date" stroke="#666" /><YAxis stroke="#666" label={{ value: 'Años', angle: -90, position: 'insideLeft' }} /><Tooltip /><Legend /><Line type="monotone" dataKey="Edad Bioquímica" stroke="rgb(35, 188, 239)" strokeWidth={2} activeDot={{ r: 8 }} /><Line type="monotone" dataKey="Edad Cronológica" stroke="#8884d8" strokeWidth={2} /></LineChart></ResponsiveContainer></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Línea de Tiempo</h3>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar-tabs">
                  {sortedTests.map(test => (
                    <div key={test.id} onClick={() => setSelectedTest(test)} className={`p-4 rounded-lg transition-all duration-200 border-l-4 cursor-pointer ${selectedTest?.id === test.id ? 'bg-primary/10 border-primary shadow-md' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-400'}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-grow">
                          <p className="font-semibold text-gray-800">{formatDate(test.testDate)}</p>
                          <p className="text-sm text-gray-600">Edad Bioq: <span className="font-bold text-primary">{Math.round(test.biochemicalAge)}</span> vs Crono: {Math.round(test.chronologicalAge)}</p>
                          <p className={`text-sm font-medium ${test.differentialAge < 0 ? 'text-green-600' : 'text-red-600'}`}>Diferencial: {test.differentialAge >= 0 ? '+' : ''}{Math.round(test.differentialAge)} años</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteRequest(test); }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors ml-2 flex-shrink-0" title="Eliminar este test"><FaTrash /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2">
                {selectedTest && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <FaFlask className="mr-2 text-primary" />
                      Detalles del Test - {formatDateTime(selectedTest.testDate)}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {BIOCHEMISTRY_ITEMS.map(({ key, label }) => {
                        const value = (selectedTest as any)[key];
                        const ageValue = (selectedTest as any)[`${key}Age`];
                        const status = ageValue ? getBiochemistryStatus(ageValue, selectedTest.chronologicalAge) : 'SIN CALCULAR';
                        const statusColor = status === 'REJUVENECIDO' ? 'text-green-600' : status === 'NORMAL' ? 'text-yellow-600' : status === 'ENVEJECIDO' ? 'text-red-600' : 'text-gray-400';

                        return (
                          <div key={key} className="bg-gray-50 rounded-lg p-3 text-center border border-slate-100">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">{label}</p>
                            <p className="text-xl font-black text-slate-900">{value != null ? Number(value).toFixed(2) : '--'}</p>
                            <p className="text-xs text-slate-500 mt-1">Edad: <span className="font-bold">{ageValue != null ? Number(ageValue).toFixed(1) : '--'}a</span></p>
                            <p className={`text-[10px] font-black uppercase tracking-tighter mt-1 ${statusColor}`}>{status}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}