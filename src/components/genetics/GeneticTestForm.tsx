// src/components/genetics/GeneticTestForm.tsx
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FaArrowLeft, FaSave, FaFlask, FaDna } from 'react-icons/fa';
import { toast } from 'sonner';
import { Patient } from '@/types';
import { createGeneticTest } from '@/lib/actions/genetics.actions';
import { telotestReportData } from '@/lib/mock-data';

const schema = z.object({
    averageTelomereLength: z.string().min(1, 'La longitud es requerida'),
    estimatedBiologicalAge: z.coerce.number().min(0, 'Debe ser un número positivo'),
    testDate: z.string().min(1, 'La fecha es requerida'),
});

type FormData = z.infer<typeof schema>;

interface GeneticTestFormProps {
    patient: Patient;
    onBack: () => void;
    onSuccess: () => void;
}

export default function GeneticTestForm({ patient, onBack, onSuccess }: GeneticTestFormProps) {
    const [isSaving, setIsSaving] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            testDate: new Date().toISOString().split('T')[0],
        },
    });

    const onSubmit = async (data: FormData) => {
        setIsSaving(true);
        try {
            const differentialAge = data.estimatedBiologicalAge - patient.chronologicalAge;

            const result = await createGeneticTest({
                patientId: patient.id,
                chronologicalAge: patient.chronologicalAge,
                averageTelomereLength: data.averageTelomereLength,
                biologicalAge: data.estimatedBiologicalAge,
                differentialAge: differentialAge,
                testDate: new Date(data.testDate),
                // Por ahora usamos los datos mockeados para interpretación y recomendaciones 
                // ya que requieren lógica médica compleja de baremos
                interpretation: telotestReportData.interpretation,
                therapeuticResults: telotestReportData.therapeuticResults,
                recommendations: telotestReportData.generalRecommendations,
            });

            if (result.success) {
                toast.success('Test genético guardado correctamente');
                onSuccess();
            } else {
                toast.error(result.error || 'Error al guardar el test');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn text-slate-900">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                <button onClick={onBack} className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors font-medium">
                    <FaArrowLeft />
                    <span>Volver</span>
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-[#293b64] rounded-2xl">
                        <FaDna className="text-4xl text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-900">Nuevo Test Genético</h2>
                        <p className="text-slate-500 text-sm">Ingresa los resultados del laboratorio Telotes</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">Fecha del Test</label>
                        <input
                            {...register('testDate')}
                            type="date"
                            className="w-full bg-[#293b64] border-2 border-slate-700 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        />
                        {errors.testDate && <p className="text-red-500 text-xs mt-1">{errors.testDate.message}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">Longitud de Telómeros (kb)</label>
                        <input
                            {...register('averageTelomereLength')}
                            type="text"
                            placeholder="Ej: 1.34 kb"
                            className="w-full bg-[#293b64] border-2 border-slate-700 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-slate-400"
                        />
                        {errors.averageTelomereLength && <p className="text-red-500 text-xs mt-1">{errors.averageTelomereLength.message}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">Edad Biológica Estimada</label>
                        <input
                            {...register('estimatedBiologicalAge')}
                            type="number"
                            placeholder="Años"
                            className="w-full bg-[#293b64] border-2 border-slate-700 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-slate-400"
                        />
                        {errors.estimatedBiologicalAge && <p className="text-red-500 text-xs mt-1">{errors.estimatedBiologicalAge.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? 'Guardando...' : <><FaSave /> Guardar Resultados</>}
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-slate-200 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <FaFlask className="text-4xl text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Información del Telotest</h3>
                <p className="text-slate-500 text-sm max-w-sm">
                    Este test mide la longitud promedio de los telómeros en los leucocitos,
                    proporcionando una medida precisa del envejecimiento celular.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Paciente</p>
                        <p className="text-sm font-bold text-slate-900">{patient.firstName} {patient.lastName}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Edad Actual</p>
                        <p className="text-sm font-bold text-slate-900">{patient.chronologicalAge} años</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
