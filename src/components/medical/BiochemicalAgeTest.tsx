'use client';

import React, { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calculator, Save, Edit3, ChevronLeft, AlertCircle, CheckCircle2, Activity, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

import { Patient } from '@/types';
import {
    BIOCHEMISTRY_ITEMS,
    BiochemistryFormValues,
    BiochemistryCalculationResult,
} from '@/types/biochemistry';
import { calculateAndSaveBiochemistryTest } from '@/lib/actions/biochemistry.actions';

// --- Validation Schema ---
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
).refine(data => Object.values(data).some(val => val !== undefined), {
    message: "Debe completar al menos un biomarcador para guardar el test.",
    path: [BIOCHEMISTRY_ITEMS[0].key],
});

interface BiochemicalAgeTestProps {
    patient: Patient;
    onBack: () => void;
    onTestComplete: () => void;
}

export const BiochemicalAgeTest = ({ patient, onBack, onTestComplete }: BiochemicalAgeTestProps) => {
    const [isEditMode, setIsEditMode] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [results, setResults] = useState<BiochemistryCalculationResult | null>(null);

    const { control, handleSubmit, watch, formState: { errors } } = useForm<BiochemistryFormValues>({
        resolver: zodResolver(validationSchema),
        mode: 'onChange',
        defaultValues: {},
    });

    const formValues = watch();

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
                setIsEditMode(false);
                toast.success("Test Bioquímico guardado con éxito.");
                onTestComplete();
            } else {
                toast.error(result.error || 'No se pudo calcular o guardar el test.');
            }
        } catch (error) {
            toast.error('Ocurrió un error de conexión.');
        } finally {
            setIsSaving(false);
        }
    };

    const getStatus = (calculatedAge: number | undefined, chronologicalAge: number) => {
        if (calculatedAge === undefined) return 'normal';
        const diff = calculatedAge - chronologicalAge;
        if (diff >= 7) return 'aged';
        if (diff > 0) return 'normal';
        return 'optimal';
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'optimal': return 'border-emerald-500 bg-emerald-50 text-emerald-700'; // Optimal (Green)
            case 'normal': return 'border-amber-400 bg-amber-50 text-amber-700';   // Normal (Yellow)
            case 'aged': return 'border-rose-500 bg-rose-50 text-rose-700';       // Aged (Red)
            default: return 'border-slate-200 bg-white text-slate-600';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'optimal': return 'Óptimo';
            case 'normal': return 'Normal';
            case 'aged': return 'Envejecido';
            default: return '--';
        }
    };

    // Transform results for the grid
    const gridResults = useMemo(() => {
        if (!results) return [];
        return BIOCHEMISTRY_ITEMS.map(item => {
            const ageKey = `${item.key}Age` as keyof BiochemistryCalculationResult['partialAges'];
            const calculatedAge = results.partialAges[ageKey];
            return {
                id: item.key,
                label: item.label,
                value: formValues[item.key] as number | undefined,
                age: calculatedAge,
                status: getStatus(calculatedAge, patient.chronologicalAge),
                unit: item.unit
            };
        });
    }, [results, formValues, patient.chronologicalAge]);

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-6 bg-slate-50 min-h-screen font-sans">

            {/* PANEL DE ENTRADA (Left Input Panel) */}
            <div className="w-full lg:w-1/3 bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-6 h-fit sticky top-6">
                <div className="flex items-center gap-2 mb-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ChevronLeft size={20} className="text-slate-400" />
                    </button>
                    <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-1 flex-1 uppercase tracking-tighter">Test Bioquímico</h2>
                </div>

                <form className="space-y-4">
                    {BIOCHEMISTRY_ITEMS.map((item) => (
                        <div key={item.key} className="group">
                            <label className="text-xs font-semibold text-slate-500 mb-1 block ml-1 uppercase tracking-wider">
                                {item.label}
                            </label>
                            <div className="relative">
                                <Controller
                                    name={item.key}
                                    control={control}
                                    render={({ field }) => (
                                        <input
                                            {...field}
                                            type="number"
                                            placeholder="0.00"
                                            disabled={!isEditMode && !!results}
                                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                                            value={field.value ?? ''}
                                            // UI FIX: Persistent Pure White background and specific border colors
                                            className={`w-full bg-white border-2 rounded-xl px-4 py-3 text-slate-900 font-bold outline-none transition-all placeholder:text-slate-300
                                ${errors[item.key] ? 'border-rose-400 focus:border-rose-500' : 'border-slate-100 focus:border-[#23bcef]'}
                                focus:ring-4 focus:ring-cyan-50 disabled:opacity-70 disabled:bg-white disabled:text-slate-700
                            `}
                                        />
                                    )}
                                />
                                <span className="absolute right-4 top-3 text-[10px] font-bold text-slate-400 uppercase">
                                    {item.unit}
                                </span>
                            </div>
                            {errors[item.key] && <p className="text-rose-500 text-[10px] mt-1 ml-1">{errors[item.key]?.message}</p>}
                        </div>
                    ))}
                </form>

                <div className="flex gap-3 pt-4">
                    <button
                        onClick={handleSubmit(handleCalculateAndSave)}
                        disabled={isSaving || (!isEditMode && !!results)}
                        className="flex-1 bg-[#23bcef] hover:bg-[#1da8d8] text-white font-bold py-4 rounded-2xl shadow-lg shadow-cyan-200/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Calculator size={18} />}
                        {isSaving ? 'Calculando...' : 'Calcular'}
                    </button>
                    <button
                        onClick={() => { setIsEditMode(true); setResults(null); }}
                        className="p-4 border-2 border-slate-100 text-slate-400 hover:border-[#293b64] hover:text-[#293b64] rounded-2xl transition-all active:scale-[0.98]"
                    >
                        {isEditMode ? <Save size={20} /> : <Edit3 size={20} />}
                    </button>
                </div>
            </div>

            {/* PANEL DE RESULTADOS (Right Bento Grid) */}
            <div className="flex-1 space-y-6">
                {/* Resumen Global (Hero Header) */}
                {results ? (
                    <div className="bg-white rounded-[2.5rem] p-8 text-slate-900 flex flex-col md:flex-row justify-between items-center shadow-sm border border-slate-200 relative overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
                        <div className="absolute top-0 right-0 p-8 opacity-10 text-slate-200">
                            <CheckCircle2 size={120} />
                        </div>
                        <div className="z-10 text-center md:text-left mb-6 md:mb-0">
                            <p className="text-primary font-bold uppercase tracking-widest text-xs mb-2">Edad Cronológica: <span className="text-slate-900 text-lg">{patient.chronologicalAge}</span></p>
                            <h3 className="text-3xl lg:text-4xl font-black italic text-slate-900">{patient.firstName} {patient.lastName}</h3>
                        </div>
                        <div className="text-center z-10 bg-slate-50 p-6 rounded-3xl border border-slate-100 min-w-[200px]">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Edad Bioquímica</p>
                            <p className="text-5xl font-black text-primary">{results.biologicalAge.toFixed(1)}</p>
                            <div className={`text-sm font-bold mt-1 ${results.differentialAge >= 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {results.differentialAge >= 0 ? `+${results.differentialAge.toFixed(1)} años de rezago` : `${results.differentialAge.toFixed(1)} años de ventaja`}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-[2.5rem] p-12 text-center border border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="text-slate-300" size={40} />
                        </div>
                        <h3 className="text-slate-900 font-bold text-lg mb-2">Esperando Resultados</h3>
                        <p className="text-slate-500 text-sm max-w-md mx-auto">
                            Ingrese los valores de los biomarcadores en el panel izquierdo y presione "Calcular" para generar el análisis de Edad Bioquímica de Alta Resolución.
                        </p>
                    </div>
                )}

                {/* Grid de Marcadores (Bento Grid) */}
                {results && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-in fade-in duration-1000 delay-150">
                        {gridResults.map((res) => (
                            <div
                                key={res.id}
                                className={`p-5 rounded-2xl border-l-4 shadow-sm transition-transform hover:scale-[1.02] bg-white ${getStatusStyles(res.status)}`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <p className="text-[10px] font-black uppercase tracking-tighter opacity-70 leading-tight max-w-[80%]">
                                        {res.label}
                                    </p>
                                    {res.status === 'aged' && <AlertCircle size={14} className="text-rose-500" />}
                                    {res.status === 'optimal' && <CheckCircle2 size={14} className="text-emerald-500" />}
                                    {res.status === 'normal' && <Activity size={14} className="text-amber-500" />}
                                </div>

                                <div className="flex items-baseline justify-between gap-2">
                                    <div>
                                        <p className="text-2xl font-black text-slate-800">{res.value !== undefined ? res.value : '--'}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{res.unit}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-medium text-slate-400">Edad Calc.</p>
                                        <p className="text-xl font-bold text-slate-800">
                                            {res.age !== undefined ? res.age.toFixed(1) : '--'} <span className="text-[10px] text-slate-400 font-normal">años</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                                    <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase border ${getStatusStyles(res.status)} bg-opacity-10 border-opacity-20`}>
                                        {getStatusLabel(res.status)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Subcomponent for loading state or other utils can be added here
function Loader2({ className, size }: { className?: string; size?: number }) {
    return (
        <svg
            className={className}
            width={size || 24}
            height={size || 24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    );
}

export default BiochemicalAgeTest;
