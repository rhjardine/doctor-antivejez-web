'use client';

import { useState, useEffect } from 'react';
import { Patient } from '@/types';
import { BoardWithRanges, FormValues, BIOPHYSICS_ITEMS, CalculationResult, PartialAges } from '@/types/biophysics';
import { getBiophysicsBoardsAndRanges, saveBiophysicsTest } from '@/lib/actions/biophysics.actions';
import { calculateBiofisicaResults, getAgeStatus, getStatusColor } from '@/utils/biofisica-calculations';
import { toast } from 'sonner';
import { FaArrowLeft, FaCalculator, FaSave, FaCheckCircle } from 'react-icons/fa'; // Se añade FaCheckCircle
import { useRouter } from 'next/navigation';

interface EdadBiofisicaTestViewProps {
  patient: Patient;
  onBack: () => void;
  onTestComplete: () => void;
}

// --- NUEVO Componente de Modal de Éxito ---
// Este modal aparecerá después de guardar el test exitosamente.
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
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [calculated, setCalculated] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false); // <-- Nuevo estado para el modal

  const [formValues, setFormValues] = useState<FormValues>({
    fatPercentage: undefined,
    bmi: undefined,
    digitalReflexes: { high: 0, long: 0, width: 0 },
    visualAccommodation: undefined,
    staticBalance: { high: 0, long: 0, width: 0 },
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
        const currentDimensions = prev[formKey] as { high: number, long: number, width: number };
        return { ...prev, [formKey]: { ...currentDimensions, [dimension]: value || 0 } };
      }
      return { ...prev, [formKey]: value };
    });
    setCalculated(false);
  };

  const handleCalculate = () => {
    const invalidFields = [];
    for (const item of BIOPHYSICS_ITEMS) {
      const value = formValues[item.key];
      if (item.hasDimensions) {
        const dimensionalValue = value as { high: number; long: number; width: number; } | undefined;
        if (dimensionalValue?.high === undefined || isNaN(dimensionalValue.high) || dimensionalValue?.long === undefined || isNaN(dimensionalValue.long) || dimensionalValue?.width === undefined || isNaN(dimensionalValue.width)) {
          invalidFields.push(item.label);
        }
      } else {
        if (value === undefined || isNaN(value as number)) {
          invalidFields.push(item.label);
        }
      }
    }

    if (invalidFields.length > 0) {
      toast.error(`Por favor, complete y/o corrija los siguientes campos: ${invalidFields.join(', ')}`);
      return;
    }

    setCalculating(true);
    try {
      const isAthlete = patient.gender.includes('DEPORTIVO');
      const calculationResult = calculateBiofisicaResults(boards, formValues, patient.chronologicalAge, patient.gender, isAthlete);
      setResults(calculationResult);
      setCalculated(true);
      toast.success('Cálculo completado exitosamente');
    } catch (error: any) {
      console.error("Error del servidor al calcular:", error.message);
      toast.error(`Error del servidor: ${error.message}`);
    } finally {
      setCalculating(false);
    }
  };

  // --- Lógica de guardado MODIFICADA ---
  const handleSave = async () => {
    if (!calculated) {
      toast.error('Debe calcular los resultados antes de guardar');
      return;
    }
    setSaving(true);
    try {
      const testData = {
        patientId: patient.id,
        chronologicalAge: patient.chronologicalAge,
        biologicalAge: results.biologicalAge,
        differentialAge: results.differentialAge,
        gender: patient.gender,
        isAthlete: patient.gender.includes('DEPORTIVO'),
        fatPercentage: formValues.fatPercentage,
        fatAge: results.partialAges.fatAge,
        bmi: formValues.bmi,
        bmiAge: results.partialAges.bmiAge,
        digitalReflexes: formValues.digitalReflexes ? (formValues.digitalReflexes.high + formValues.digitalReflexes.long + formValues.digitalReflexes.width) / 3 : undefined,
        reflexesAge: results.partialAges.reflexesAge,
        visualAccommodation: formValues.visualAccommodation,
        visualAge: results.partialAges.visualAge,
        staticBalance: formValues.staticBalance ? (formValues.staticBalance.high + formValues.staticBalance.long + formValues.staticBalance.width) / 3 : undefined,
        balanceAge: results.partialAges.balanceAge,
        skinHydration: formValues.skinHydration,
        hydrationAge: results.partialAges.hydrationAge,
        systolicPressure: formValues.systolicPressure,
        systolicAge: results.partialAges.systolicAge,
        diastolicPressure: formValues.diastolicPressure,
        diastolicAge: results.partialAges.diastolicAge,
      };
      const result = await saveBiophysicsTest(testData);
      if (result.success) {
        onTestComplete(); // Actualiza los datos del paciente en segundo plano
        setIsSuccessModalOpen(true); // Muestra el modal de éxito
      } else {
        toast.error(result.error || 'Error al guardar el test');
      }
    } catch (error) {
      toast.error('Error al guardar el test');
    } finally {
      setSaving(false);
    }
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
      {/* Renderizado condicional del modal */}
      {isSuccessModalOpen && <SuccessModal onClose={() => setIsSuccessModalOpen(false)} />}
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Panel Izquierdo - Formulario */}
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

          <div className="space-y-4 pr-2">
            {BIOPHYSICS_ITEMS.map(item => {
              const itemKey = item.key;
              const partialAgeKey = PARTIAL_AGE_KEYS_MAP[itemKey];
              const partialAgeValue = results.partialAges[partialAgeKey];

              return (
                <div key={item.key} className="bg-white/10 rounded-lg p-4">
                  <label className="block text-sm font-medium mb-2">
                    {item.label} {item.unit && `(${item.unit})`}
                  </label>

                  {item.hasDimensions ? (
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        step="any"
                        placeholder="Alto"
                        value={(formValues[itemKey] as any)?.high ?? ''}
                        onChange={e =>
                          handleInputChange(
                            item.key,
                            e.target.value === ''
                              ? undefined
                              : parseFloat(e.target.value),
                            'high'
                          )
                        }
                        className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="Largo"
                        value={(formValues[itemKey] as any)?.long ?? ''}
                        onChange={e =>
                          handleInputChange(
                            item.key,
                            e.target.value === ''
                              ? undefined
                              : parseFloat(e.target.value),
                            'long'
                          )
                        }
                        className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="Ancho"
                        value={(formValues[itemKey] as any)?.width ?? ''}
                        onChange={e =>
                          handleInputChange(
                            item.key,
                            e.target.value === ''
                              ? undefined
                              : parseFloat(e.target.value),
                            'width'
                          )
                        }
                        className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  ) : (
                    <input
                      type="number"
                      step="any"
                      value={(formValues[itemKey] as number) ?? ''}
                      onChange={e =>
                        handleInputChange(
                          item.key,
                          e.target.value === ''
                            ? undefined
                            : parseFloat(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  )}

                  {calculated && (
                    <div className="mt-2 text-sm">
                      <span className="opacity-70">Edad Calculada: </span>
                      <span className="font-medium">
                        {partialAgeValue !== undefined
                          ? `${partialAgeValue.toFixed(1)} años`
                          : '--'}
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
              onClick={handleCalculate}
              disabled={calculating}
              className="w-full bg-white text-primary-dark font-medium py-3 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <FaCalculator />
              <span>{calculating ? 'Calculando...' : 'Calcular'}</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!calculated || saving}
              className="w-full bg-green-500 text-white font-medium py-3 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <FaSave />
              <span>{saving ? 'Guardando...' : 'Guardar'}</span>
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full bg-gray-600 text-white font-medium py-3 rounded-lg hover:bg-gray-500 transition-colors"
            >
              <span>Volver</span>
            </button>
          </div>
        </div>

        {/* Panel Derecho - Resultados */}
        <div className="w-full md:w-1/2 space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultados Finales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Edad Biofísica</p>
                <p className="text-3xl font-bold text-gray-900">
                  {calculated ? `${results.biologicalAge} años` : '--'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Edad Diferencial</p>
                <p
                  className={`text-3xl font-bold ${getStatusColor(
                    getAgeStatus(results.differentialAge)
                  )}`}
                >
                  {calculated
                    ? `${results.differentialAge > 0 ? '+' : ''}${
                        results.differentialAge
                      } años`
                    : '--'}
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
                          {calculated && partialAge !== undefined
                            ? `${partialAge.toFixed(1)} años`
                            : '--'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-80">Diferencia:</span>
                        <span className="font-medium">
                          {calculated && partialAge !== undefined
                            ? `${partialAge - patient.chronologicalAge > 0 ? '+' : ''}${
                                (partialAge - patient.chronologicalAge).toFixed(1)
                              } años`
                            : '--'}
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
