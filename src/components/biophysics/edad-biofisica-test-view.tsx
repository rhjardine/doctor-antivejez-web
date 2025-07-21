'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { FaArrowLeft, FaSave, FaEdit, FaUndo, FaCheckCircle } from 'react-icons/fa';

import { Patient } from '@/types';
import {
  BIOPHYSICS_ITEMS,
  CalculationResult,
  FormValues,
  PartialAges,
} from '@/types/biophysics';
import { calculateAndSaveBiophysicsTest } from '@/lib/actions/biophysics.actions';
import { getAgeStatus, getStatusColor } from '@/utils/biofisica-calculations';

// --- Componente de Modal de Éxito (Conservado de tu versión original) ---
function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center relative animate-slideUp">
        <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">Operación realizada exitosamente</h3>
        <p className="text-gray-600 mb-6">El test biofísico ha sido guardado correctamente.</p>
        <button onClick={onClose} className="btn-primary w-full">
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

interface Props {
  patient: Patient;
  onBack: () => void;
  onTestComplete: () => void;
}

export default function EdadBiofisicaTestView({ patient, onBack, onTestComplete }: Props) {
  const [processing, setProcessing] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [results, setResults] = useState<CalculationResult | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>();

  const onSubmit = async (data: FormValues) => {
    setProcessing(true);
    setResults(null);

    // Convertir valores de string a número antes de enviar
    const numericData: FormValues = JSON.parse(JSON.stringify(data), (key, value) => {
        if (value !== null && value !== '' && !isNaN(Number(value))) {
            return Number(value);
        }
        return value;
    });

    const response = await calculateAndSaveBiophysicsTest({
      patientId: patient.id,
      chronologicalAge: patient.chronologicalAge,
      gender: patient.gender,
      isAthlete: patient.gender.includes('DEPORTIVO'),
      formValues: numericData,
    });

    setProcessing(false);

    if (response.success && response.data) {
      setResults({
        biologicalAge: response.data.biologicalAge,
        differentialAge: response.data.differentialAge,
        partialAges: response.data.partialAges,
      });
      setIsSaved(true);
      setIsSuccessModalOpen(true);
      onTestComplete();
    } else {
      toast.error(response.error || 'Ocurrió un error al procesar el test.');
    }
  };

  const handleEdit = () => {
    setIsSaved(false);
    toast.info('El formulario ha sido habilitado para edición.');
  };

  const getItemStatus = (partialAge: number | undefined) => {
    if (partialAge === undefined) return 'NORMAL';
    const diff = partialAge - patient.chronologicalAge;
    return getAgeStatus(diff);
  };

  return (
    <>
      {isSuccessModalOpen && <SuccessModal onClose={() => setIsSuccessModalOpen(false)} />}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Columna Izquierda: Formulario */}
        <div className="w-full md:w-1/2 bg-primary-dark rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-6">
            <button onClick={onBack} className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors">
              <FaArrowLeft />
              <span>Volver al Perfil Medico</span>
            </button>
            <div className="text-right">
              <h2 className="text-xl font-bold">{patient.firstName} {patient.lastName}</h2>
              <p className="text-sm opacity-80">
                Edad: {patient.chronologicalAge} años | {patient.gender.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-4">Test de Edad Biofísica</h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pr-2">
            {BIOPHYSICS_ITEMS.map(item => (
              <div key={item.key} className="bg-white/10 rounded-lg p-4">
                <label className="block text-sm font-medium mb-2">
                  {item.label} {item.unit && `(${item.unit})`}
                </label>
                {item.hasDimensions ? (
                  <div className="grid grid-cols-3 gap-2">
                    <Controller name={`${item.key}.high`} control={control} rules={{ required: true }} render={({ field }) => <input type="number" step="any" placeholder="Alto" {...field} className="input" disabled={isSaved || processing} />} />
                    <Controller name={`${item.key}.long`} control={control} rules={{ required: true }} render={({ field }) => <input type="number" step="any" placeholder="Largo" {...field} className="input" disabled={isSaved || processing} />} />
                    <Controller name={`${item.key}.width`} control={control} rules={{ required: true }} render={({ field }) => <input type="number" step="any" placeholder="Ancho" {...field} className="input" disabled={isSaved || processing} />} />
                  </div>
                ) : (
                  <Controller name={item.key} control={control} rules={{ required: true }} render={({ field }) => <input type="number" step="any" {...field} className="input w-full" disabled={isSaved || processing} />} />
                )}
              </div>
            ))}
            
            <div className="mt-6 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button type="submit" disabled={processing || isSaved} className="w-full bg-white text-primary-dark font-medium py-3 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                <FaSave />
                <span>{processing ? 'Procesando...' : 'Calcular y Guardar'}</span>
              </button>
              <button type="button" onClick={handleEdit} disabled={!isSaved || processing} className="w-full bg-yellow-500 text-white font-medium py-3 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                <FaEdit />
                <span>Editar</span>
              </button>
              <button type="button" onClick={onBack} disabled={processing} className="w-full bg-gray-600 text-white font-medium py-3 rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                <FaUndo />
                <span>Volver</span>
              </button>
            </div>
          </form>
        </div>

        {/* Columna Derecha: Resultados */}
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
                <p className="text-3xl font-bold text-primary">{results ? `${results.biologicalAge.toFixed(1)}` : '--'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Diferencial</p>
                <p className={`text-3xl font-bold ${results ? getStatusColor(getAgeStatus(results.differentialAge)) : 'text-gray-900'}`}>
                  {results ? `${results.differentialAge > 0 ? '+' : ''}${results.differentialAge.toFixed(1)}` : '--'}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultados por Ítem</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BIOPHYSICS_ITEMS.map(item => {
                const ageKey = PARTIAL_AGE_KEYS_MAP[item.key];
                const partialAge = results?.partialAges[ageKey];
                const status = getItemStatus(partialAge);
                const statusColor = status === 'REJUVENECIDO' ? 'bg-status-green' : status === 'NORMAL' ? 'bg-status-yellow' : 'bg-status-red';

                return (
                  <div key={item.key} className={`rounded-lg p-4 text-white transition-all ${results ? statusColor : 'bg-gray-300'}`}>
                    <h4 className="font-medium mb-2">{item.label}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="opacity-80">Edad Calculada:</span>
                        <span className="font-medium">{results && partialAge !== undefined ? `${partialAge.toFixed(1)} años` : '--'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-80">Diferencia:</span>
                        <span className="font-medium">{results && partialAge !== undefined ? `${(partialAge - patient.chronologicalAge).toFixed(1)} años` : '--'}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-white/20">
                        <span className="text-xs uppercase tracking-wide">{results ? status.replace(/_/g, ' ') : 'SIN CALCULAR'}</span>
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
