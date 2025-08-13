'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Patient } from '@/types';
import {
  BIOCHEMISTRY_ITEMS,
  BiochemistryFormValues,
  BiochemistryCalculationResult,
  BoardWithRanges,
} from '@/types/biochemistry';
import { calculateAndSaveBiochemistryTest, getBiochemistryBoardsAndRanges } from '@/lib/actions/biochemistry.actions';
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
         .optional()
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
                <p className={`font-bold ${results.differentialAge > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {results.differentialAge > 0 ? '+' : ''}{results.differentialAge.toFixed(1)}
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

export default function EdadBioquimicaTestView({ patient, onBack, onTestComplete }: { patient: Patient, onBack: () => void, onTestComplete: () => void }) {
  const [boards, setBoards] = useState<BoardWithRanges[]>([]);
  const [isEditing, setIsEditing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [results, setResults] = useState<BiochemistryCalculationResult | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<BiochemistryFormValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: {},
  });

  const formValues = watch();

  const fetchBoards = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedBoards = await getBiochemistryBoardsAndRanges();
      setBoards(fetchedBoards);
    } catch (error) {
      toast.error('Error al cargar los baremos. No se podrán realizar los cálculos.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

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
      } else {
        toast.error(result.error || 'No se pudo calcular o guardar el test.');
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado.');
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
      <div className="p-6 bg-white rounded-xl shadow-lg animate-fadeIn">
        <div className="flex items-center justify-between mb-6 border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Nuevo Test Bioquímico</h2>
            <p className="text-gray-600">Paciente: {patient.firstName} {patient.lastName}</p>
          </div>
          <button onClick={onBack} className="btn-secondary flex items-center space-x-2">
            <FaArrowLeft />
            <span>Volver</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(handleCalculateAndSave)}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {BIOCHEMISTRY_ITEMS.map((item) => (
              <div key={item.key} className="flex flex-col">
                <label htmlFor={item.key} className="label mb-1 text-sm font-medium text-gray-700">
                  {item.label} <span className="text-gray-400">({item.unit})</span>
                </label>
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
                      disabled={!isEditing || isLoading}
                      onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                    />
                  )}
                />
                {errors[item.key] && <p className="text-red-500 text-xs mt-1">{errors[item.key]?.message}</p>}
                <div className="text-xs text-gray-500 mt-1 h-4">
                  {results && results.partialAges[`${item.key}Age` as keyof typeof results.partialAges] !== undefined && (
                    <span>Edad calculada: <strong>{results.partialAges[`${item.key}Age` as keyof typeof results.partialAges]?.toFixed(1)}a</strong></span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t flex items-center justify-end space-x-4">
            {isEditing ? (
              <button
                type="submit"
                className="btn-primary flex items-center space-x-2"
                disabled={isLoading || isSaving}
              >
                <FaCalculator />
                <span>{isSaving ? 'Calculando y Guardando...' : 'Calcular y Guardar'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="btn-secondary flex items-center space-x-2"
              >
                <FaEdit />
                <span>Editar</span>
              </button>
            )}
            <button
              type="button"
              onClick={onBack}
              className="btn-secondary"
            >
              Volver
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
