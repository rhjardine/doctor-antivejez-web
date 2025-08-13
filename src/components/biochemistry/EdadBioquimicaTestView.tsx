'use client';

// src/components/biochemistry/EdadBioquimicaTestView.tsx
import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Patient } from '@/types';
import {
  BIOCHEMISTRY_ITEMS,
  BiochemistryFormValues,
  BiochemistryCalculationResult,
  ResultStatus,
} from '@/types/biochemistry';
import { calculateAndSaveBiochemistryTest } from '@/lib/actions/biochemistry.actions';
import { calculateBioquimicaResults, getBiochemistryStatus, getStatusColorClass } from '@/utils/bioquimica-calculations';
import { toast } from 'sonner';
import { FaArrowLeft, FaSave, FaEdit, FaUndo, FaCheckCircle, FaCalculator } from 'react-icons/fa';

// --- Esquema de Validación con Zod ---
const validationSchema = z.object(
  Object.fromEntries(
    BIOCHEMISTRY_ITEMS.map(item => [
      item.key,
      z.preprocess(
        (val) => (String(val).trim() === '' ? undefined : Number(val)),
        z.number({ invalid_type_error: 'Debe ser un número' })
         .min(0, 'El valor no puede ser negativo')
      )
    ])
  )
);

// --- Componente de Modal de Éxito ---
function SuccessModal({ onClose, results }: { onClose: () => void, results: BiochemistryCalculationResult | null }) {
  if (!results) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center relative animate-slideUp">
        <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Test Guardado</h3>
        <p className="text-gray-600 mb-6">El test bioquímico se ha calculado y guardado correctamente.</p>
        <div className="grid grid-cols-2 gap-4 text-lg">
            <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Edad Bioquímica</p>
                <p className="font-bold text-primary">{results.biologicalAge.toFixed(1)}</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Diferencial</p>
                <p className={`font-bold ${results.differentialAge >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {results.differentialAge >= 0 ? '+' : ''}{results.differentialAge.toFixed(1)}
                </p>
            </div>
        </div>
        <button onClick={onClose} className="mt-6 w-full btn-primary">
          Cerrar
        </button>
      </div>
    </div>
  );
}

// --- Componente Principal ---
export default function EdadBioquimicaTestView({ patient, onBack, onTestComplete }: { patient: Patient, onBack: () => void, onTestComplete: () => void }) {
  const [isEditing, setIsEditing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [results, setResults] = useState<BiochemistryCalculationResult | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { control, handleSubmit, watch, formState: { errors, isValid } } = useForm<BiochemistryFormValues>({
    resolver: zodResolver(validationSchema),
    mode: 'onChange',
    defaultValues: {},
  });

  const formValues = watch();

  const liveCalculation = useCallback(() => {
    const filledValues = Object.entries(formValues)
      .filter(([, value]) => typeof value === 'number' && !isNaN(value))
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as BiochemistryFormValues);

    if (Object.keys(filledValues).length > 0) {
      return calculateBioquimicaResults(filledValues, patient.chronologicalAge);
    }
    return null;
  }, [formValues, patient.chronologicalAge]);
  
  const currentResults = liveCalculation();

  const handleCalculateAndSave = async (data: BiochemistryFormValues) => {
    setIsSaving(true);
    try {
      const result = await calculateAndSaveBiochemistryTest({
        patientId: patient.id,
        chronologicalAge: patient.chronologicalAge,
        formValues: data,
      });

      if (result.success && result.data) {
        setResults(result.data);
        setIsEditing(false);
        setShowSuccessModal(true);
        toast.success("Test Bioquímico guardado con éxito.");
      } else {
        toast.error(result.error || 'No se pudo calcular o guardar el test.');
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado al conectar con el servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    onTestComplete();
  };

  return (
    <>
      {showSuccessModal && <SuccessModal onClose={handleModalClose} results={results} />}
      
      <form onSubmit={handleSubmit(handleCalculateAndSave)} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Columna Izquierda: Formulario */}
        <div className="lg:col-span-3 bg-primary-dark rounded-xl p-6 text-white space-y-6">
            <div className="flex items-center justify-between">
                <button type="button" onClick={onBack} className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors">
                    <FaArrowLeft />
                    <span>Volver al Perfil</span>
                </button>
                <div className="text-right">
                    <h2 className="text-xl font-bold">{patient.firstName} {patient.lastName}</h2>
                    <p className="text-sm opacity-80">Edad: {patient.chronologicalAge} años | {patient.gender.replace(/_/g, ' ')}</p>
                </div>
            </div>

            <h3 className="text-lg font-semibold">Test de Edad Bioquímica</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {BIOCHEMISTRY_ITEMS.map((item) => (
                    <div key={item.key}>
                        <label htmlFor={item.key} className="block text-sm font-medium mb-2">{item.label} ({item.unit})</label>
                        <Controller
                            name={item.key}
                            control={control}
                            render={({ field }) => (
                                <input
                                    {...field}
                                    id={item.key}
                                    type="number"
                                    step="any"
                                    className={`input ${errors[item.key] ? 'border-red-500' : ''}`}
                                    placeholder="0.00"
                                    disabled={!isEditing}
                                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                                />
                            )}
                        />
                        {errors[item.key] && <p className="text-red-300 text-xs mt-1">{errors[item.key]?.message}</p>}
                    </div>
                ))}
            </div>
            
            {/* Botones de Acción */}
            <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button type="submit" disabled={isSaving || !isEditing || !isValid} className="w-full bg-white text-primary-dark font-medium py-3 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                    <FaSave />
                    <span>{isSaving ? 'Guardando...' : 'Calcular y Guardar'}</span>
                </button>
                <button type="button" onClick={() => setIsEditing(true)} disabled={isEditing} className="w-full bg-yellow-500 text-white font-medium py-3 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                    <FaEdit />
                    <span>Editar</span>
                </button>
                <button type="button" onClick={onBack} disabled={isSaving} className="w-full bg-gray-600 text-white font-medium py-3 rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                    <FaUndo />
                    <span>Volver</span>
                </button>
            </div>
        </div>

        {/* Columna Derecha: Resultados */}
        <div className="lg:col-span-2 space-y-6">
            <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultados Finales</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Edad Cronológica</p>
                        <p className="text-3xl font-bold text-gray-900">{patient.chronologicalAge}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Edad Bioquímica</p>
                        <p className={`text-3xl font-bold ${currentResults ? getStatusColorClass(currentResults.status) : 'text-primary'}`}>
                            {currentResults ? `${currentResults.biologicalAge.toFixed(1)}` : '--'}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Diferencial</p>
                        <p className={`text-3xl font-bold ${currentResults ? getStatusColorClass(currentResults.status) : 'text-gray-900'}`}>
                            {currentResults ? `${currentResults.differentialAge >= 0 ? '+' : ''}${currentResults.differentialAge.toFixed(1)}` : '--'}
                        </p>
                    </div>
                </div>
            </div>
            <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultados por Ítem</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {BIOCHEMISTRY_ITEMS.map(item => {
                        const ageKey = `${item.key}Age` as keyof BiochemistryCalculationResult['partialAges'];
                        const partialAge = currentResults?.partialAges[ageKey];
                        const status = partialAge ? getBiochemistryStatus(partialAge, patient.chronologicalAge) : 'NO_DATA';

                        return (
                            <div key={item.key} className={`rounded-lg p-4 text-white transition-all ${getStatusColorClass(status, true)}`}>
                                <h4 className="font-medium mb-2">{item.label}</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="opacity-80">Edad Calc:</span>
                                        <span className="font-medium">{partialAge ? `${partialAge.toFixed(1)} años` : '--'}</span>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-white/20">
                                        <span className="text-xs uppercase tracking-wide">{status.replace('_', ' ')}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      </form>
    </>
  );
}
