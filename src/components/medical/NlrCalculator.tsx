'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Info, Save, History, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface NlrCalculatorProps {
    patient: any; // Using any for flexibility or specific Patient type if available
}

export default function NlrCalculator({ patient }: NlrCalculatorProps) {
    const patientId = patient.id;
    const [neutrophils, setNeutrophils] = useState<number | string>('');
    const [lymphocytes, setLymphocytes] = useState<number | string>('');
    const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
    const [result, setResult] = useState<number | null>(null);
    const [status, setStatus] = useState({ label: 'Esperando datos', color: 'text-slate-400', bg: 'bg-slate-100' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (neutrophils && lymphocytes && Number(lymphocytes) > 0) {
            const nlr = Number(neutrophils) / Number(lymphocytes);
            setResult(Number(nlr.toFixed(2)));

            if (nlr < 1.5) {
                setStatus({ label: 'Normal (Óptimo)', color: 'text-emerald-600', bg: 'bg-emerald-50' });
            } else if (nlr < 2.0) {
                setStatus({ label: 'Inflamación Muy Leve', color: 'text-emerald-500', bg: 'bg-emerald-50' });
            } else if (nlr < 2.5) {
                setStatus({ label: 'Inflamación Leve (Límite)', color: 'text-amber-500', bg: 'bg-amber-50' });
            } else if (nlr < 3.0) {
                setStatus({ label: 'Inflamación Moderada', color: 'text-amber-600', bg: 'bg-amber-50' });
            } else if (nlr < 4.0) {
                setStatus({ label: 'Inflamación Alta', color: 'text-orange-600', bg: 'bg-orange-50' });
            } else if (nlr < 6.0) {
                setStatus({ label: 'Inflamación Severa', color: 'text-rose-500', bg: 'bg-rose-50' });
            } else if (nlr < 10.0) {
                setStatus({ label: 'Inflamación Crítica', color: 'text-rose-600', bg: 'bg-rose-50' });
            } else {
                setStatus({ label: 'Riesgo Extremo', color: 'text-rose-700', bg: 'bg-rose-100' });
            }
        } else {
            setResult(null);
        }
    }, [neutrophils, lymphocytes]);

    const handleSave = async () => {
        if (!result || isSaving) return;

        setIsSaving(true);
        try {
            const response = await fetch('/clinical-nlr-v1', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    patientId,
                    neutrophils,
                    lymphocytes,
                    testDate,
                }),
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Test de NLR guardado exitosamente');
            } else {
                toast.error(data.error || 'Error al guardar el test');
            }
        } catch (error) {
            console.error('Error saving NLR:', error);
            toast.error('Error de conexión con el servidor');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden font-sans animate-in fade-in duration-500">
            {/* Header Corporativo */}
            <div className="bg-[#293b64] p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg text-[#23bcef]">
                        <Activity size={24} />
                    </div>
                    <h2 className="text-white font-black uppercase tracking-wider text-sm">Calculador de Inflamación (NLR)</h2>
                </div>
                <button className="text-[#23bcef] hover:bg-white/10 p-2 rounded-full transition-all">
                    <Info size={20} />
                </button>
            </div>

            <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Columna 1: Inputs */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="group">
                            <label className="block text-[10px] font-black text-[#293b64] uppercase tracking-widest mb-2 ml-1">
                                Neutrófilos (Valor Absoluto)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={neutrophils}
                                    onChange={(e) => setNeutrophils(e.target.value)}
                                    placeholder="Ej. 4500"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-lg font-bold text-slate-800 outline-none focus:border-[#23bcef] focus:bg-white transition-all shadow-inner"
                                />
                                <span className="absolute right-5 top-5 text-xs font-bold text-slate-400">células/µL</span>
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-[10px] font-black text-[#293b64] uppercase tracking-widest mb-2 ml-1">
                                Linfocitos (Valor Absoluto)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={lymphocytes}
                                    onChange={(e) => setLymphocytes(e.target.value)}
                                    placeholder="Ej. 2000"
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-lg font-bold text-slate-800 outline-none focus:border-[#23bcef] focus:bg-white transition-all shadow-inner"
                                />
                                <span className="absolute right-5 top-5 text-xs font-bold text-slate-400">células/µL</span>
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-[10px] font-black text-[#293b64] uppercase tracking-widest mb-2 ml-1">
                                Fecha del Análisis
                            </label>
                            <input
                                type="date"
                                value={testDate}
                                onChange={(e) => setTestDate(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#23bcef] focus:bg-white transition-all shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={handleSave}
                            disabled={!result || isSaving}
                            className="flex-1 bg-[#23bcef] hover:bg-[#1da8d8] text-white font-black py-4 rounded-2xl shadow-lg shadow-cyan-200 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest disabled:opacity-50 active:scale-95"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            {isSaving ? 'Guardando...' : 'Guardar Test'}
                        </button>
                        <button className="p-4 border-2 border-slate-100 text-slate-400 hover:border-[#293b64] hover:text-[#293b64] rounded-2xl transition-all active:scale-95">
                            <History size={20} />
                        </button>
                    </div>
                </div>

                {/* Columna 2: Visualizador Clínico */}
                <div className="flex flex-col justify-center items-center bg-slate-50 rounded-[2.5rem] p-8 border border-dashed border-slate-200 shadow-inner">
                    {result ? (
                        <div className="w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
                            <div className="text-sm font-black text-[#293b64] uppercase tracking-tighter">Resultado del Ratio</div>
                            <div className="text-7xl font-black text-[#293b64] tracking-tighter">{result}</div>

                            <div className={`inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase ${status.bg} ${status.color} border border-current shadow-sm`}>
                                {status.label}
                            </div>

                            {/* Gráfico de Riesgo (The Visual Gauge) */}
                            <div className="relative pt-8 w-full">
                                <div className="h-4 w-full bg-gradient-to-r from-emerald-400 via-amber-400 via-orange-400 to-rose-500 rounded-full flex overflow-hidden shadow-inner">
                                    {/* Visual markers for the gradient bands */}
                                </div>
                                {/* Aguja del indicador */}
                                <div
                                    className="absolute top-6 transition-all duration-1000 ease-out z-10"
                                    style={{ left: `${Math.min(Math.max((result / 10) * 100, 0), 100)}%` }}
                                >
                                    <div className="w-1.5 h-10 bg-[#293b64] rounded-full shadow-lg" />
                                    <div className="w-4 h-4 bg-[#293b64] -ml-[5px] -mt-1 rounded-full border-2 border-white shadow-md" />
                                </div>
                                <div className="flex justify-between text-[8px] font-bold text-slate-400 mt-4 px-1 uppercase tracking-tighter">
                                    <span>0.0</span>
                                    <span>Normal (1.5)</span>
                                    <span>Mod (3.0)</span>
                                    <span>Crítico (10.0+)</span>
                                </div>
                            </div>

                            {result >= 3 && (
                                <div className="mt-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 text-left animate-in slide-in-from-bottom-2">
                                    <AlertCircle className="text-rose-500 shrink-0" size={18} />
                                    <p className="text-[10px] text-rose-700 font-medium leading-relaxed">
                                        Atención: Relación elevada (NLR {result}). Sugiere inflamación sistémica significativa. Revise biomarcadores de fase aguda y considere protocolo de remoción de inflamatorios.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center space-y-4 opacity-30 grayscale transition-all">
                            <Activity size={60} className="mx-auto text-slate-400 animate-pulse" />
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Ingrese valores para analizar</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
