'use client';

import { useState, useEffect } from 'react';
import { Patient } from '../../types';
import { BoardWithRanges, FormValues, BIOPHYSICS_ITEMS, CalculationResult, PartialAges } from '../../types/biophysics';
import { getBiophysicsBoardsAndRanges, calculateAndSaveBiophysicsTest } from '../../lib/actions/biophysics.actions';
import { getAgeStatus, getStatusColor } from '../../utils/biofisica-calculations';
import { toast } from 'sonner';
import { FaArrowLeft, FaCalculator, FaEdit, FaCheckCircle, FaUndo, FaSave } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

interface EdadBiofisicaTestViewProps {
  patient: Patient;
  onBack: () => void;
  onTestComplete: () => void;
}

// --- Componente de Modal de Éxito ---
function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center relative animate-slideUp">
        <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">Operación realizada exitosamente</h3>
        <p className="text-gray-600 mb-6">El test biofísico ha sido guardado correctamente.</p>
        <button
          onClick={onClose}
          className="btn-primary w-full"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}

const PARTIAL_AGE_KEYS_MAP: Record<typeof BIOPHYSICS_ITEMS[number]['key'], keyof PartialAges> = {
  fatPercentage: 'fatAge',
  bmi: 'bmiAge',
  digitalReflexes: 'reflexesAge',
  visualAccommodation: 'visualAge',
  staticBalance: 'balanceAge',
  skinHydration: 'hydrationAge',
  systolicPressure: 'systolicAge',
  diastolicPressure: 'diastolicAge',
};

export default function EdadBiofisicaTestView({ patient, onBack, onTestComplete }: EdadBiofisicaTestViewProps) {
  const router = useRouter();
  const [boards, setBoards] = useState<BoardWithRanges[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false); 
  const [isSaved, setIsSaved] = useState(false);
  const [calculated, setCalculated] = useState(false);

  const [formValues, setFormValues] = useState<FormValues>({
    fatPercentage: undefined,
    bmi: undefined,
    digitalReflexes: { high: undefined, long: undefined, width: undefined },
    visualAccommodation: undefined,
    staticBalance: { high: undefined, long: undefined, width: undefined },
    skinHydration: undefined,
    systolicPressure: undefined,
    diastolicPressure: undefined,
  });

  const [results, setResults] = useState<CalculationResult>({
    biologicalAge: 0,
    differentialAge: 0,
    partialAges: {},
  });

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      const boardsData = await getBiophysicsBoardsAndRanges();
      setBoards(boardsData);
    } catch (error) {
      toast.error('Error al cargar los baremos');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: number | undefined, dimension?: 'high' | 'long' | 'width') => {
    setFormValues(prev => {
      const formKey = key as keyof FormValues;
      if (dimension && (formKey === 'digitalReflexes' || formKey === 'staticBalance')) {
        const currentDimensions = prev[formKey] as { high?: number, long?: number, width?: number };
        return { ...prev, [formKey]: { ...currentDimensions, [dimension]: value } };
      }
      return { ...prev, [formKey]: value };
    });
    setCalculated(false);
    setIsSaved(false);
  };
  
  const handleCalculateAndSave = async () => {
    setProcessing(true);

    const invalidFields = [];
    for (const item of BIOPHYSICS_ITEMS) {
      const value = formValues[item.key];
      if (item.hasDimensions) {
        const dimensionalValue = value as { high?: number; long?: number; width?: number; };
        if (typeof dimensionalValue?.high !== 'number' || typeof dimensionalValue?.long !== 'number' || typeof dimensionalValue?.width !== 'number') {
          invalidFields.push(item.label);
        }
      } else {
        if (typeof value !== 'number') {
          invalidFields.push(item.label);
        }
      }
    }

    if (invalidFields.length > 0) {
      toast.error(`Por favor, complete todos los campos: ${invalidFields.join(', ')}`);
      setProcessing(false);
      return;
    }

    try {
      const params = {
        patientId: patient.id,
        chronologicalAge: patient.chronologicalAge,
        gender: patient.gender,
        isAthlete: patient.gender.includes('DEPORTIVO'),
        formValues: formValues,
      };
      
      const result = await calculateAndSaveBiophysicsTest(params);

      if (result.success && result.data) {
        const calculationResult: CalculationResult = {
            biologicalAge: result.data.biologicalAge,
            differentialAge: result.data.differentialAge,
            partialAges: result.data.partialAges,
        };
        setResults(calculationResult);
        setCalculated(true);
        onTestComplete(); 
        setIsSuccessModalOpen(true); 
        setIsSaved(true);
      } else {
        toast.error(result.error || 'Error al calcular y guardar el test');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar el test');
    } finally {
      setProcessing(false);
    }
  };
  
  const handleEdit = () => {
    setIsSaved(false);
    setCalculated(false);
    toast.info("El formulario ha sido habilitado para edición.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="loader"></div>
      </div>
    );
  }

  const getItemStatus = (partialAge: number | undefined) => {
    if (partialAge === undefined) return 'NORMAL';
    const diff = partialAge - patient.chronologicalAge;
    return getAgeStatus(diff);
  };

  return (
    <>
      {isSuccessModalOpen && <SuccessModal onClose={() => setIsSuccessModalOpen(false)} />}
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2 bg-primary-dark rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
            >
              <FaArrowLeft />
              <span>Volver al Perfil Medico</span>
            </button>
            <div className="text-right">
              <h2 className="text-xl font-bold">
                {patient.firstName} {patient.lastName}
              </h2>
              <p className="text-sm opacity-80">
                Edad: {patient.chronologicalAge} años |{' '}
                {patient.gender.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-4">Test de Edad Biofísica</h3>

          <div className="space-y-4 pr-2 biophysics-form">
            {BIOPHYSICS_ITEMS.map(item => {
              const itemKey = item.key;
              const partialAgeKey = PARTIAL_AGE_KEYS_MAP[itemKey];
              const partialAgeValue = results.partialAges[partialAgeKey];

              return (
                <div key={item.key} className="bg-white/10 rounded-lg p-4">
                  <label className="block text-sm font-medium mb-2">
                    {item.label} {item.unit && `(${item.unit})`}
                  </label>

                  {/* ===== INICIO DE LA CORRECCIÓN DE EMERGENCIA ===== */}
                  {/* Se reemplaza la clase 'input' por 'form-input-custom' para evitar conflictos de estilo. */}
                  {item.hasDimensions ? (
                    <div className="grid grid-cols-3 gap-2">
                      <input type="number" step="any" placeholder="Alto" value={(formValues[itemKey] as any)?.high ?? ''} onChange={e => handleInputChange(item.key, e.target.value === '' ? undefined : parseFloat(e.target.value), 'high')} className="form-input-custom" disabled={isSaved || processing} />
                      <input type="number" step="any" placeholder="Largo" value={(formValues[itemKey] as any)?.long ?? ''} onChange={e => handleInputChange(item.key, e.target.value === '' ? undefined : parseFloat(e.target.value), 'long')} className="form-input-custom" disabled={isSaved || processing} />
                      <input type="number" step="any" placeholder="Ancho" value={(formValues[itemKey] as any)?.width ?? ''} onChange={e => handleInputChange(item.key, e.target.value === '' ? undefined : parseFloat(e.target.value), 'width')} className="form-input-custom" disabled={isSaved || processing} />
                    </div>
                  ) : (
                    <input type="number" step="any" value={(formValues[itemKey] as number) ?? ''} onChange={e => handleInputChange(item.key, e.target.value === '' ? undefined : parseFloat(e.target.value))} className="form-input-custom w-full" disabled={isSaved || processing} />
                  )}
                  {/* ===== FIN DE LA CORRECCIÓN DE EMERGENCIA ===== */}

                  {calculated && (
                    <div className="mt-2 text-sm">
                      <span className="opacity-70">Edad Calculada: </span>
                      <span className="font-medium">
                        {partialAgeValue !== undefined ? `${partialAgeValue.toFixed(1)} años` : '--'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={handleCalculateAndSave}
              disabled={processing || isSaved}
              className="w-full bg-white text-primary-dark font-medium py-3 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <FaSave />
              <span>{processing ? 'Procesando...' : 'Calcular y Guardar'}</span>
            </button>

            <button
              type="button"
              onClick={handleEdit}
              disabled={!isSaved || processing}
              className="w-full bg-yellow-500 text-white font-medium py-3 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <FaEdit />
              <span>Editar</span>
            </button>

            <button
              type="button"
              onClick={onBack}
              disabled={processing}
              className="w-full bg-gray-600 text-white font-medium py-3 rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaUndo />
              <span>Volver</span>
            </button>
          </div>
        </div>

        <div className="w-full md:w-1/2 space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultados Finales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Edad Cronológica</p>
                <p className="text-3xl font-bold text-gray-900">{patient.chronologicalAge}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Edad Biofísica</p>
                <p className={`text-3xl font-bold ${calculated ? getStatusColor(getAgeStatus(results.differentialAge)) : 'text-primary'}`}>
                  {calculated ? `${results.biologicalAge}` : '--'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Diferencial</p>
                <p
                  className={`text-3xl font-bold ${calculated ? getStatusColor(getAgeStatus(results.differentialAge)) : 'text-gray-900'}`}
                >
                  {calculated ? `${results.differentialAge > 0 ? '+' : ''}${results.differentialAge}` : '--'}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultados por Ítem</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BIOPHYSICS_ITEMS.map(item => {
                const ageKey = PARTIAL_AGE_KEYS_MAP[item.key];
                const partialAge = results.partialAges[ageKey];
                const status = getItemStatus(partialAge);
                const statusColor =
                  status === 'REJUVENECIDO'
                    ? 'bg-status-green'
                    : status === 'NORMAL'
                      ? 'bg-status-yellow'
                      : 'bg-status-red';

                return (
                  <div
                    key={item.key}
                    className={`rounded-lg p-4 text-white transition-all ${
                      calculated ? statusColor : 'bg-gray-300'
                    }`}
                  >
                    <h4 className="font-medium mb-2">{item.label}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="opacity-80">Edad Calculada:</span>
                        <span className="font-medium">
                          {calculated && partialAge !== undefined ? `${partialAge.toFixed(1)} años` : '--'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-80">Diferencia:</span>
                        <span className="font-medium">
                          {calculated && partialAge !== undefined ? `${(partialAge - patient.chronologicalAge).toFixed(1)} años` : '--'}
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-white/20">
                        <span className="text-xs uppercase tracking-wide">
                          {calculated ? status.replace(/_/g, ' ') : 'SIN CALCULAR'}
                        </span>
                      </div>
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