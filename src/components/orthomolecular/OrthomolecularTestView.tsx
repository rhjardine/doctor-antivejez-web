'use client';

// src/components/orthomolecular/OrthomolecularTestView.tsx
import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Patient } from '@/types';
import {
  ORTHOMOLECULAR_ITEMS,
  OrthomolecularFormValues,
  OrthomolecularCalculationResult,
  OrthomolecularItem,
} from '@/types/orthomolecular';
import { calculateAndSaveOrthomolecularTest } from '@/lib/actions/orthomolecular.actions';
import { toast } from 'sonner';
import { FaArrowLeft, FaSave, FaEdit, FaCheckCircle, FaChartLine } from 'react-icons/fa';

// --- Esquema de Validación con Zod ---
const validationSchema = z.object(
  Object.fromEntries(
    ORTHOMOLECULAR_ITEMS.map(item => [
      item.key,
      z.preprocess(
        (val) => (String(val).trim() === '' ? undefined : Number(val)),
        z.number({ invalid_type_error: 'Debe ser un número' })
          .min(0, 'El valor no puede ser negativo')
          .optional()
      )
    ])
  )
).refine(data => Object.values(data).some(val => val !== undefined), {
  message: "Debe completar al menos un parámetro.",
  path: [ORTHOMOLECULAR_ITEMS[0].key],
});

// --- Componente de Modal de Éxito ---
function SuccessModal({ onClose, results }: { onClose: () => void, results: OrthomolecularCalculationResult | null }) {
  if (!results) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center relative animate-slideUp">
        <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Test Guardado</h3>
        <p className="text-gray-600 mb-6">El test ortomolecular se ha calculado y guardado correctamente.</p>
        <div className="grid grid-cols-3 gap-4 text-lg">
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Edad Cronológica</p>
            <p className="font-bold text-gray-800">{results.chronologicalAge.toFixed(0)}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Edad Ortomolecular</p>
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

// --- Subcomponente para la tarjeta de resultado por ítem ---
interface ResultItemCardProps {
  item: OrthomolecularItem;
  value?: number;
  calculatedAge?: number;
  chronologicalAge: number;
  showResults: boolean;
}

function ResultItemCard({ item, value, calculatedAge, chronologicalAge, showResults }: ResultItemCardProps) {
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
    <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${showResults ? colorClasses[color] : 'bg-white border-slate-100'}`}>
      <h4 className="text-xs font-black text-slate-500 mb-3 uppercase tracking-wider">{item.label}</h4>
      <div className="space-y-3">
        <div className="flex justify-between items-end border-b border-slate-100 pb-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Valor:</span>
          <span className="font-black text-slate-900 leading-none">{value !== undefined ? value.toFixed(3) : '--'}</span>
        </div>
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Edad Calc:</span>
          <span className="font-black text-primary leading-none text-lg">
            {showResults && calculatedAge !== undefined ? `${calculatedAge.toFixed(1)}a` : '--'}
          </span>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 flex justify-center">
        <span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-tighter shadow-sm ${showResults ? statusColorClasses[color] : 'bg-slate-100 text-slate-400'}`}>
          {showResults ? label : 'SIN CALCULAR'}
        </span>
      </div>
    </div>
  );
}


// --- Componente Principal ---
export default function OrthomolecularTestView({ patient, onBack, onTestComplete }: { patient: Patient, onBack: () => void, onTestComplete: () => void }) {
  const [isEditing, setIsEditing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [results, setResults] = useState<OrthomolecularCalculationResult | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [calculatedAndSaved, setCalculatedAndSaved] = useState(false);

  const { control, handleSubmit, watch, formState: { errors, isValid } } = useForm<OrthomolecularFormValues>({
    resolver: zodResolver(validationSchema),
    mode: 'onChange',
    defaultValues: {},
  });

  const formValues = watch();

  const handleCalculateAndSave = async (data: OrthomolecularFormValues) => {
    setIsSaving(true);
    try {
      const result = await calculateAndSaveOrthomolecularTest({
        patientId: patient.id,
        chronologicalAge: patient.chronologicalAge,
        formValues: data,
      });

      if (result.success && result.data) {
        setResults(result.data);
        setIsEditing(false);
        setCalculatedAndSaved(true);
        setShowSuccessModal(true);
        toast.success("Test Ortomolecular guardado con éxito.");
      } else {
        toast.error(result.error || 'No se pudo calcular o guardar el test.');
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado al conectar con el servidor.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setCalculatedAndSaved(false);
    setResults(null);
    toast.info("El formulario ha sido habilitado para edición.");
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    onTestComplete();
  };

  return (
    <>
      {showSuccessModal && <SuccessModal onClose={handleModalClose} results={results} />}

      <form onSubmit={handleSubmit(handleCalculateAndSave)} className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        <div className="lg:col-span-2 bg-[#293b64] rounded-xl p-6 text-white">
          <div className="mb-6">
            <button type="button" onClick={onBack} className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors mb-4">
              <FaArrowLeft />
              <span>Volver al Perfil Medico</span>
            </button>
            <h1 className="text-2xl font-bold text-white mb-1">Test de Edad Ortomolecular</h1>
            <p className="text-gray-300">{patient.firstName} {patient.lastName} - {patient.chronologicalAge} años | {patient.gender.replace(/_/g, ' ')}</p>
          </div>

          <div className="space-y-5">
            {ORTHOMOLECULAR_ITEMS.map((item) => (
              <div key={item.key}>
                <label htmlFor={item.key} className="block text-sm font-medium mb-1 text-gray-200">{item.label} {item.unit && `(${item.unit})`}</label>
                <Controller
                  name={item.key}
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      id={item.key}
                      type="number"
                      step="any"
                      className={`input w-full placeholder-gray-400 ${isEditing
                          ? 'bg-white text-black'
                          : 'bg-gray-700/50 border-gray-500 text-white'
                        } ${errors[item.key] ? 'border-red-500' : ''}`}
                      placeholder="0.000"
                      disabled={!isEditing}
                      onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                      value={field.value ?? ''}
                    />
                  )}
                />
                {errors[item.key] && <p className="text-red-400 text-xs mt-1">{errors[item.key]?.message}</p>}
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-white/20 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button type="submit" disabled={isSaving || !isEditing || !isValid} className="font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white disabled:bg-green-500/50 disabled:cursor-not-allowed">
              <FaSave />
              <span>{isSaving ? 'Guardando...' : 'Calcular/Guardar'}</span>
            </button>
            <button type="button" onClick={handleEdit} disabled={isEditing} className="font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white disabled:bg-orange-500/50 disabled:cursor-not-allowed">
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
          {calculatedAndSaved && results ? (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-black text-slate-900 mb-4 uppercase tracking-tighter">Resultados Finales</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Edad Cronológica</p>
                    <p className="text-4xl font-black text-slate-800">{patient.chronologicalAge}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Edad Ortomolecular</p>
                    <p className="text-4xl font-black text-primary">
                      {results.biologicalAge.toFixed(1)}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Diferencial</p>
                    <p className={`text-4xl font-black ${results.differentialAge >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {results.differentialAge >= 0 ? '+' : ''}{results.differentialAge.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-black text-slate-900 mb-4 uppercase tracking-tighter">Resultados por Parámetros</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {ORTHOMOLECULAR_ITEMS.map(item => {
                    const ageKey = `${item.key}Age` as keyof OrthomolecularCalculationResult['partialAges'];
                    return (
                      <ResultItemCard
                        key={item.key}
                        item={item}
                        value={formValues[item.key] as number | undefined}
                        calculatedAge={results.partialAges[ageKey]}
                        chronologicalAge={patient.chronologicalAge}
                        showResults={calculatedAndSaved}
                      />
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
              <FaChartLine className="text-6xl text-slate-200 mb-6" />
              <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Análisis Ortomolecular</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">Completa los campos de biomarcadores y haz clic en "Calcular/Guardar" para generar el informe.</p>
            </div>
          )}
        </div>
      </form>
    </>
  );
}
