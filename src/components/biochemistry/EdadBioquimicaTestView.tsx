'use client';

// src/components/biochemistry/EdadBioquimicaTestView.tsx
import { useState, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Patient } from '@/types';
import {
  BIOCHEMISTRY_ITEMS,
  BiochemistryFormValues,
  BiochemistryCalculationResult,
  BiochemistryItem,
  ResultStatus,
} from '@/types/biochemistry';
import { calculateAndSaveBiochemistryTest } from '@/lib/actions/biochemistry.actions';
import { calculateBioquimicaResults } from '@/utils/bioquimica-calculations';
import { toast } from 'sonner';
import { FaArrowLeft, FaSave, FaEdit, FaUndo, FaCheckCircle } from 'react-icons/fa';

// --- Esquema de Validación con Zod (sin cambios) ---
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

// --- Componente de Modal de Éxito (sin cambios) ---
function SuccessModal({ onClose, results }: { onClose: () => void, results: BiochemistryCalculationResult | null }) {
  if (!results) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center relative animate-slideUp">
        <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Test Guardado</h3>
        <p className="text-gray-600 mb-6">El test bioquímico se ha calculado y guardado correctamente.</p>
        <div className="grid grid-cols-3 gap-4 text-lg">
            <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Edad Cronológica</p>
                <p className="font-bold text-gray-800">{results.chronologicalAge.toFixed(0)}</p>
            </div>
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

// --- Subcomponente para la tarjeta de resultado por ítem (sin cambios) ---
interface ResultItemCardProps {
  item: BiochemistryItem;
  value?: number;
  calculatedAge?: number;
  chronologicalAge: number;
}

function ResultItemCard({ item, value, calculatedAge, chronologicalAge }: ResultItemCardProps) {
  const colorClasses = {
    gray: 'bg-gray-100 border-gray-300',
    red: 'bg-red-50 border-red-400',
    yellow: 'bg-yellow-50 border-yellow-400',
    green: 'bg-green-50 border-green-400',
  };
  type ColorKey = keyof typeof colorClasses;
  const statusColorClasses = {
    gray: 'bg-gray-200 text-gray-700',
    red: 'bg-red-500 text-white',
    yellow: 'bg-yellow-500 text-white',
    green: 'bg-green-500 text-white',
  };
  const { color, label } = useMemo((): { color: ColorKey; label: string } => {
    if (calculatedAge === undefined || calculatedAge === null) {
      return { color: 'gray', label: 'Sin Calcular' };
    }
    const diff = calculatedAge - chronologicalAge;
    if (diff >= 7) return { color: 'red', label: 'Envejecido' };
    if (diff > 0) return { color: 'yellow', label: 'Normal' };
    return { color: 'green', label: 'Rejuvenecido' };
  }, [calculatedAge, chronologicalAge]);

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <h4 className="font-semibold text-gray-800 mb-3">{item.label}</h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Valor:</span>
          <span className="font-bold text-gray-900">{value !== undefined ? value.toFixed(2) : '--'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Edad Calc:</span>
          <span className="font-bold text-gray-900">{calculatedAge !== undefined ? `${calculatedAge.toFixed(1)} años` : '--'}</span>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-200">
        <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusColorClasses[color]}`}>{label}</span>
      </div>
    </div>
  );
}


// --- Componente Principal Refactorizado ---
export default function EdadBioquimicaTestView({ patient, onBack, onTestComplete }: { patient: Patient, onBack: () => void, onTestComplete: () => void }) {
  const [isEditing, setIsEditing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [results, setResults] = useState<BiochemistryCalculationResult | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { control, handleSubmit, watch, formState: { errors, isValid }, reset } = useForm<BiochemistryFormValues>({
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
        const completeFormValues = BIOCHEMISTRY_ITEMS.reduce((acc, item) => {
            acc[item.key] = filledValues[item.key] ?? 0;
            return acc;
        }, {} as BiochemistryFormValues);
        return calculateBioquimicaResults(completeFormValues, patient.chronologicalAge);
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
      
      <div className="mb-4">
        <button type="button" onClick={onBack} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-lg">
            <FaArrowLeft />
            <span>Volver al Perfil</span>
        </button>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-1">Test de Edad Bioquímica</h1>
      <p className="text-gray-600 mb-6">{patient.firstName} {patient.lastName} - {patient.chronologicalAge} años | {patient.gender.replace(/_/g, ' ')}</p>

      <form onSubmit={handleSubmit(handleCalculateAndSave)} className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* ===== AJUSTE 1: Formulario con fondo azul oscuro y texto claro ===== */}
        <div className="lg:col-span-2 bg-[#293b64] rounded-xl p-6 text-white">
            <h3 className="text-lg font-bold mb-6">Biomarcadores Bioquímicos</h3>
            
            <div className="space-y-5">
                {BIOCHEMISTRY_ITEMS.map((item) => {
                    const ageKey = `${item.key}Age` as keyof BiochemistryCalculationResult['partialAges'];
                    const calculatedAge = currentResults?.partialAges[ageKey];
                    
                    return (
                        <div key={item.key}>
                            <label htmlFor={item.key} className="block text-sm font-medium mb-1 text-gray-200">{item.label} ({item.unit})</label>
                            <Controller
                                name={item.key}
                                control={control}
                                render={({ field }) => (
                                    <input
                                        {...field}
                                        id={item.key}
                                        type="number"
                                        step="any"
                                        className={`input w-full bg-gray-700/50 border-gray-500 text-white placeholder-gray-400 ${errors[item.key] ? 'border-red-500' : ''}`}
                                        placeholder="0.00"
                                        disabled={!isEditing}
                                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                                    />
                                )}
                            />
                            {/* ===== AJUSTE 5: Mostrar edad calculada debajo de cada ítem ===== */}
                            {calculatedAge !== undefined && (
                                <p className="text-right text-xs text-cyan-300 mt-1">
                                    Edad Calculada: {calculatedAge.toFixed(1)} años
                                </p>
                            )}
                            {errors[item.key] && <p className="text-red-400 text-xs mt-1">{errors[item.key]?.message}</p>}
                        </div>
                    );
                })}
            </div>
            
            {/* ===== AJUSTE 4: Botones estilizados profesionalmente ===== */}
            <div className="mt-8 pt-6 border-t border-white/20 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button type="submit" disabled={isSaving || !isEditing || !isValid} className="font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white disabled:bg-green-500/50 disabled:cursor-not-allowed">
                    <FaSave />
                    <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
                </button>
                <button type="button" onClick={() => setIsEditing(true)} disabled={isEditing} className="font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white disabled:bg-orange-500/50 disabled:cursor-not-allowed">
                    <FaEdit />
                    <span>Editar</span>
                </button>
                <button type="button" onClick={onBack} className="font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 bg-white hover:bg-gray-200 text-gray-700 border border-gray-300 shadow-sm">
                    <FaArrowLeft />
                    <span>Volver</span>
                </button>
            </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
            {/* ===== AJUSTE 2: Panel de resultados finales con fondo azul claro y texto blanco ===== */}
            <div className="bg-[#23bcef] p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-bold text-white mb-4">Resultados Finales</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="bg-gray-100 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Edad Cronológica</p>
                        <p className="text-4xl font-bold text-gray-800">{patient.chronologicalAge}</p>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Edad Bioquímica</p>
                        <p className={`text-4xl font-bold ${currentResults ? 'text-primary' : 'text-gray-400'}`}>
                            {currentResults ? `${currentResults.biologicalAge.toFixed(1)}` : '--'}
                        </p>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Diferencial</p>
                        <p className={`text-4xl font-bold ${!currentResults ? 'text-gray-400' : currentResults.differentialAge >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {currentResults ? `${currentResults.differentialAge >= 0 ? '+' : ''}${currentResults.differentialAge.toFixed(1)}` : '--'}
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="card">
                {/* ===== AJUSTE 3: Cambio de texto a "Resultados por Parámetros" ===== */}
                <h3 className="text-lg font-bold text-gray-800 mb-4">Resultados por Parámetros</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {BIOCHEMISTRY_ITEMS.map(item => {
                        const ageKey = `${item.key}Age` as keyof BiochemistryCalculationResult['partialAges'];
                        return (
                            <ResultItemCard 
                                key={item.key}
                                item={item}
                                value={formValues[item.key] as number | undefined}
                                calculatedAge={currentResults?.partialAges[ageKey]}
                                chronologicalAge={patient.chronologicalAge}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
      </form>
    </>
  );
}