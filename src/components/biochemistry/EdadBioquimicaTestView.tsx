'use client';

import { useState, useEffect } from 'react';
import { Patient } from '@/types';
import {
  BIOCHEMISTRY_ITEMS,
  BiochemistryFormValues,
  BiochemistryCalculationResult,
  BoardWithRanges,
  ResultStatus,
} from '@/types/biochemistry';
// ===== INICIO DE LA CORRECCIÓN =====
// Se corrige el nombre de la función importada para que coincida con la exportada.
import { calculateAndSaveBiochemistryTest, getBiochemistryBoardsAndRanges } from '@/lib/actions/biochemistry.actions';
// ===== FIN DE LA CORRECCIÓN =====
import { getStatusColor } from '@/utils/bioquimica-calculations';
import { toast } from 'sonner';
import { FaArrowLeft, FaSave, FaEdit, FaUndo, FaCheckCircle } from 'react-icons/fa';

interface EdadBioquimicaTestViewProps {
  patient: Patient;
  onBack: () => void;
  onTestComplete: () => void;
}

function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center relative animate-slideUp">
        <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">Operación Exitosa</h3>
        <p className="text-gray-600 mb-6">El test bioquímico se ha guardado correctamente.</p>
        <button onClick={onClose} className="btn-primary w-full">Aceptar</button>
      </div>
    </div>
  );
}

export default function EdadBioquimicaTestView({ patient, onBack, onTestComplete }: EdadBioquimicaTestViewProps) {
  const [boards, setBoards] = useState<BoardWithRanges[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [calculated, setCalculated] = useState(false);

  const [formValues, setFormValues] = useState<BiochemistryFormValues>({});
  const [results, setResults] = useState<Partial<BiochemistryCalculationResult>>({});

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const boardsData = await getBiochemistryBoardsAndRanges();
        setBoards(boardsData);
      } catch (error) {
        toast.error('Error al cargar los baremos del test.');
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const handleInputChange = (key: keyof BiochemistryFormValues, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [key]: value === '' ? undefined : parseFloat(value),
    }));
    setCalculated(false);
    setIsSaved(false);
  };

  const handleCalculateAndSave = async () => {
    setProcessing(true);

    const missingFields = BIOCHEMISTRY_ITEMS.filter(item => formValues[item.key] === undefined);
    if (missingFields.length > 0) {
      toast.error(`Por favor, complete todos los campos: ${missingFields.map(f => f.label).join(', ')}`);
      setProcessing(false);
      return;
    }

    try {
      const result = await calculateAndSaveBiochemistryTest({
        patientId: patient.id,
        chronologicalAge: patient.chronologicalAge,
        formValues,
      });

      if (result.success && result.data) {
        setResults(result.data);
        setCalculated(true);
        setIsSaved(true);
        setIsSuccessModalOpen(true);
        onTestComplete();
      } else {
        toast.error(result.error || 'Ocurrió un error al procesar el test.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error inesperado.');
    } finally {
      setProcessing(false);
    }
  };

  const handleEdit = () => {
    setIsSaved(false);
    setCalculated(false);
    toast.info("Formulario habilitado para edición.");
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="loader"></div></div>;
  }

  return (
    <>
      {isSuccessModalOpen && <SuccessModal onClose={() => setIsSuccessModalOpen(false)} />}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Columna del Formulario */}
        <div className="w-full md:w-1/2 bg-primary-dark rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-6">
            <button onClick={onBack} className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors">
              <FaArrowLeft />
              <span>Volver al Perfil</span>
            </button>
            <div className="text-right">
              <h2 className="text-xl font-bold">{patient.firstName} {patient.lastName}</h2>
              <p className="text-sm opacity-80">Edad: {patient.chronologicalAge} años | {patient.gender.replace(/_/g, ' ')}</p>
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-4">Test de Edad Bioquímica</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-2 max-h-[60vh] overflow-y-auto custom-scrollbar-tabs">
            {BIOCHEMISTRY_ITEMS.map(item => (
              <div key={item.key} className="bg-white/10 rounded-lg p-3">
                <label className="block text-xs font-medium mb-1">{item.label} <span className="opacity-70">{item.unit && `(${item.unit})`}</span></label>
                <input
                  type="number"
                  step="any"
                  value={formValues[item.key] ?? ''}
                  onChange={e => handleInputChange(item.key, e.target.value)}
                  className="input text-sm"
                  disabled={isSaved || processing}
                />
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button onClick={handleCalculateAndSave} disabled={processing || isSaved} className="btn-primary-white">
              <FaSave className="mr-2" /> {processing ? 'Procesando...' : 'Calcular y Guardar'}
            </button>
            <button onClick={handleEdit} disabled={!isSaved || processing} className="btn-warning">
              <FaEdit className="mr-2" /> Editar
            </button>
            <button onClick={onBack} disabled={processing} className="btn-secondary-dark">
              <FaUndo className="mr-2" /> Volver
            </button>
          </div>
        </div>

        {/* Columna de Resultados */}
        <div className="w-full md:w-1/2 space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultados Finales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Edad Cronológica</p>
                <p className="text-3xl font-bold text-gray-900">{patient.chronologicalAge}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Edad Bioquímica</p>
                <p className={`text-3xl font-bold ${calculated ? 'text-primary' : 'text-gray-400'}`}>
                  {calculated ? results.biologicalAge?.toFixed(1) : '--'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Diferencial</p>
                <p className={`text-3xl font-bold ${calculated ? 'text-gray-900' : 'text-gray-400'}`}>
                  {calculated && results.differentialAge !== undefined ? `${results.differentialAge > 0 ? '+' : ''}${results.differentialAge.toFixed(1)}` : '--'}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultados por Ítem</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {BIOCHEMISTRY_ITEMS.map(item => {
                const status = calculated && results.statuses ? results.statuses[item.key] : undefined;
                const statusColor = status ? getStatusColor(status) : 'bg-gray-300';
                const statusText = status ? status.replace('_', ' ').replace('OPTIMAL', 'ÓPTIMO') : 'SIN CALCULAR';

                return (
                  <div key={item.key} className={`rounded-lg p-3 text-white transition-all ${statusColor}`}>
                    <h4 className="font-bold text-sm truncate">{item.label}</h4>
                    <p className="text-xs opacity-80 mb-1">Valor: {formValues[item.key] ?? '--'} {item.unit}</p>
                    <div className="mt-1 pt-1 border-t border-white/20 text-center">
                      <span className="text-xs font-semibold uppercase tracking-wider">{statusText}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
