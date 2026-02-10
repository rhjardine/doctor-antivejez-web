'use client';

import { useState, useEffect } from 'react';
import { PatientWithDetails, BiophysicsTest } from '@/types';
import { formatDate, formatDateTime } from '@/utils/date';
import { FaArrowLeft, FaChartLine, FaInfoCircle, FaRuler, FaWeight, FaBrain, FaEye, FaBalanceScale, FaTint, FaHeartbeat, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { deleteBiophysicsTest } from '@/lib/actions/biophysics.actions';
import { toast } from 'sonner';

// --- Componente de Modal de Confirmación de Eliminación ---
function DeleteConfirmationModal({ isOpen, onClose, onConfirm, test, isDeleting }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, test: BiophysicsTest | null, isDeleting: boolean }) {
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

interface BiophysicsHistoryViewProps {
  patient: PatientWithDetails;
  onBack: () => void;
  onHistoryChange: () => void;
}

// ===== INICIO DE LA CORRECCIÓN: Mapeo explícito de claves de edad =====
// Se añade la propiedad `ageKey` para mapear correctamente el valor del test con su edad calculada.
const detailItemsMap = [
  { key: 'fatPercentage', label: '% Grasa', icon: FaWeight, ageKey: 'fatAge' },
  { key: 'bmi', label: 'IMC', icon: FaRuler, ageKey: 'bmiAge' },
  { key: 'digitalReflexes', label: 'Reflejos Digitales', icon: FaBrain, ageKey: 'reflexesAge' },
  { key: 'visualAccommodation', label: 'Acomodación Visual', icon: FaEye, ageKey: 'visualAge' },
  { key: 'staticBalance', label: 'Balance Estático', icon: FaBalanceScale, ageKey: 'balanceAge' },
  { key: 'skinHydration', label: 'Hidratación Cutánea', icon: FaTint, ageKey: 'hydrationAge' },
  { key: 'systolicPressure', label: 'T.A. Sistólica', icon: FaHeartbeat, ageKey: 'systolicAge' },
  { key: 'diastolicPressure', label: 'T.A. Diastólica', icon: FaHeartbeat, ageKey: 'diastolicAge' },
];
// ===== FIN DE LA CORRECCIÓN =====

export default function BiophysicsHistoryView({ patient, onBack, onHistoryChange }: BiophysicsHistoryViewProps) {
  const [selectedTest, setSelectedTest] = useState<BiophysicsTest | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<BiophysicsTest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (patient.biophysicsTests && patient.biophysicsTests.length > 0) {
      setSelectedTest(patient.biophysicsTests[0]);
    } else {
      setSelectedTest(null);
    }
  }, [patient.biophysicsTests]);

  const chartData = patient.biophysicsTests
    .map(test => ({
      date: formatDate(test.testDate),
      'Edad Biológica': test.biologicalAge,
      'Edad Cronológica': test.chronologicalAge,
    }))
    .reverse();

  const handleDeleteRequest = (test: BiophysicsTest) => {
    setTestToDelete(test);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!testToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteBiophysicsTest(testToDelete.id, patient.id);
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
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              title="Volver a Edad Biológica"
            >
              <FaArrowLeft className="text-lg" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Historial de Tests Biofísicos</h2>
              <p className="text-gray-600">
                Evolución de {patient.firstName} {patient.lastName}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <FaChartLine className="mr-2 text-primary" />
            Evolución de Edad Biológica vs. Cronológica
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" label={{ value: 'Años', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Edad Biológica" stroke="rgb(35, 188, 239)" strokeWidth={2} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Edad Cronológica" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Línea de Tiempo</h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar-tabs">
              {patient.biophysicsTests.map(test => (
                <div
                  key={test.id}
                  className={`p-4 rounded-lg transition-all duration-200 border-l-4 ${selectedTest?.id === test.id
                      ? 'bg-primary/10 border-primary shadow-md'
                      : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                >
                  <div className="flex justify-between items-start">
                    <div onClick={() => setSelectedTest(test)} className="flex-grow cursor-pointer">
                      <p className="font-semibold text-gray-800">{formatDate(test.testDate)}</p>
                      <p className="text-sm text-gray-600">
                        Edad Bio: <span className="font-bold text-primary">{Math.round(test.biologicalAge)}</span> vs Crono: {Math.round(test.chronologicalAge)}
                      </p>
                      <p className={`text-sm font-medium ${test.differentialAge < 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Diferencial: {test.differentialAge > 0 ? '+' : ''}{Math.round(test.differentialAge)} años
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

          <div className="lg:col-span-2">
            {selectedTest ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                  <FaInfoCircle className="mr-2 text-primary" />
                  Detalles del Test - {formatDateTime(selectedTest.testDate)}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/* ===== INICIO DE LA CORRECCIÓN: Lógica de renderizado actualizada ===== */}
                  {detailItemsMap.map(({ key, label, icon: Icon, ageKey }) => {
                    const value = selectedTest[key as keyof BiophysicsTest];
                    const ageValue = selectedTest[ageKey as keyof BiophysicsTest];

                    return (
                      <div key={key} className="bg-gray-50 rounded-lg p-3 text-center">
                        <Icon className="mx-auto text-2xl text-primary/70 mb-2" />
                        <p className="text-sm font-medium text-gray-700">{label}</p>
                        {/* Se añade una comprobación más robusta para evitar errores con valores nulos o indefinidos */}
                        <p className="text-lg font-bold text-gray-900">{value != null ? Number(value).toFixed(2) : '--'}</p>
                        <p className="text-xs text-gray-500">Edad: {ageValue != null ? Number(ageValue).toFixed(1) : '--'}a</p>
                      </div>
                    );
                  })}
                  {/* ===== FIN DE LA CORRECCIÓN ===== */}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <p className="text-gray-500">No hay tests registrados para este paciente.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
