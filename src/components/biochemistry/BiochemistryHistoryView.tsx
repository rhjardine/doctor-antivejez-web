// src/components/biochemistry/BiochemistryHistoryView.tsx
'use client';

import { useState } from 'react';
import { PatientWithDetails, BiochemistryTest } from '@/types';
import { formatDate, formatDateTime } from '@/utils/date';
import { FaArrowLeft, FaChartLine, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { deleteBiochemistryTest } from '@/lib/actions/biochemistry.actions';
import { toast } from 'sonner';

function DeleteConfirmationModal({ isOpen, onClose, onConfirm, test, isDeleting }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, test: BiochemistryTest | null, isDeleting: boolean }) {
  if (!isOpen || !test) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center relative animate-slideUp">
        <FaExclamationTriangle className="text-yellow-500 text-6xl mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">Confirmar Eliminación</h3>
        <p className="text-gray-600 mb-6">
          ¿Estás seguro de que deseas eliminar el test del <strong className="font-semibold">{formatDateTime(test.testDate)}</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-center gap-4">
          <button onClick={onClose} className="btn-secondary" disabled={isDeleting}>
            Cancelar
          </button>
          <button onClick={onConfirm} className="btn-danger" disabled={isDeleting}>
            {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface BiochemistryHistoryViewProps {
  patient: PatientWithDetails;
  onBack: () => void;
  onHistoryChange: () => void;
}

export default function BiochemistryHistoryView({ patient, onBack, onHistoryChange }: BiochemistryHistoryViewProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<BiochemistryTest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const chartData = patient.biochemistryTests
    .map(test => ({
      date: formatDate(test.testDate),
      'Edad Bioquímica': test.biochemicalAge,
      'Edad Cronológica': test.chronologicalAge,
    }))
    .reverse(); 

  const handleDeleteRequest = (test: BiochemistryTest) => {
    setTestToDelete(test);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!testToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteBiochemistryTest(testToDelete.id, patient.id);
      if (result.success) {
        toast.success('Test eliminado exitosamente.');
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
      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        test={testToDelete}
        isDeleting={isDeleting}
      />
      <div className="space-y-8 animate-fadeIn">
        <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              title="Volver"
            >
              <FaArrowLeft className="text-lg" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Historial de Tests Bioquímicos</h2>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaChartLine className="mr-2 text-primary" />
            Evolución de Edad Bioquímica vs. Cronológica
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" label={{ value: 'Años', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Edad Bioquímica" stroke="#82ca9d" strokeWidth={2} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Edad Cronológica" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Línea de Tiempo de Tests</h3>
             <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar-tabs">
              {patient.biochemistryTests.map(test => (
                <div key={test.id} className="p-4 rounded-lg bg-gray-50 border-l-4 border-primary">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">{formatDate(test.testDate)}</p>
                      <p className="text-sm text-gray-600">
                        Edad Bioq: <span className="font-bold text-primary">{Math.round(test.biochemicalAge)}</span> vs Crono: {Math.round(test.chronologicalAge)}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleDeleteRequest(test)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors ml-2 flex-shrink-0"
                      title="Eliminar este test"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
        </div>
      </div>
    </>
  );
}
