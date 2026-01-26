'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Info, Save, History, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function NlrCalculator({ patient }: { patient: any }) {
    const [neutrophils, setNeutrophils] = useState<string>('');
    const [lymphocytes, setLymphocytes] = useState<string>('');
    const [result, setResult] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [historyData, setHistoryData] = useState<any[]>([]);

    // Lógica de Calibración PulmCrit / Farkas
    const getClinicalStatus = (val: number) => {
        if (val <= 3.0) return { label: 'Normal / Saludable', color: 'text-emerald-600', bg: 'bg-emerald-50', width: (val / 12) * 100 };
        if (val <= 6.0) return { label: 'Estrés Leve / Inflamación', color: 'text-yellow-600', bg: 'bg-yellow-50', width: (val / 12) * 100 };
        if (val <= 9.0) return { label: 'Estrés Moderado-Severo', color: 'text-orange-600', bg: 'bg-orange-50', width: (val / 12) * 100 };
        return { label: 'Estado Crítico / Inflamación Severa', color: 'text-rose-600', bg: 'bg-rose-50', width: Math.min((val / 12) * 100, 100) };
    };

    useEffect(() => {
        const n = parseFloat(neutrophils);
        const l = parseFloat(lymphocytes);
        if (n > 0 && l > 0) {
            setResult(parseFloat((n / l).toFixed(2)));
        } else {
            setResult(null);
        }
    }, [neutrophils, lymphocytes]);

    const loadHistory = useCallback(async () => {
        try {
            const res = await fetch(`/clinical-nlr-v1/history?patientId=${patient.id}`);
            const data = await res.json();
            setHistoryData(data);
        } catch (e) { console.error(e); }
    }, [patient.id]);

    useEffect(() => {
        if (showHistory) {
            loadHistory();
        }
    }, [showHistory, loadHistory]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/clinical-nlr-v1', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ patientId: patient.id, neutrophils, lymphocytes, testDate: new Date() }),
            });
            if (response.ok) {
                toast.success('Registro guardado en la Historia Clínica');
                loadHistory();
            } else {
                toast.error('Error al guardar');
            }
        } catch (e) { toast.error('Error de conexión'); }
        setIsSaving(false);
    };

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden font-sans">
            {/* Header Estilo Luxury Clinic */}
            <div className="bg-[#293b64] p-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-[#23bcef]/20 rounded-2xl flex items-center justify-center text-[#23bcef]">
                        <Activity size={28} />
                    </div>
                    <div>
                        <h2 className="text-white font-black uppercase tracking-tighter text-xl">Índice NLR</h2>
                        <p className="text-[#23bcef] text-[10px] font-bold tracking-widest uppercase opacity-80">Marcador de Inflamación Crónica</p>
                    </div>
                </div>
                <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl transition-all text-xs font-bold uppercase tracking-widest">
                    <History size={16} /> {showHistory ? 'Cerrar Panel' : 'Ver Historial'}
                </button>
            </div>

            <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Formulario */}
                {!showHistory ? (
                    <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
                        <div className="grid grid-cols-1 gap-6">
                            <ClinicalInput label="Recuento de Neutrófilos" value={neutrophils} onChange={setNeutrophils} placeholder="Ej. 4500" />
                            <ClinicalInput label="Recuento de Linfocitos" value={lymphocytes} onChange={setLymphocytes} placeholder="Ej. 2000" />
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={!result || isSaving}
                            className="w-full bg-[#23bcef] hover:bg-[#1da8d8] text-white font-black py-5 rounded-2xl shadow-xl shadow-cyan-100 transition-all flex items-center justify-center gap-3 uppercase text-sm tracking-widest active:scale-[0.98] disabled:opacity-30"
                        >
                            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            {isSaving ? 'Procesando...' : 'Registrar en Historia'}
                        </button>
                    </div>
                ) : (
                    <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 overflow-y-auto max-h-[400px] animate-in fade-in duration-500">
                        <h4 className="text-[#293b64] font-black text-xs uppercase mb-4 tracking-widest border-b pb-2">Últimos Resultados</h4>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[9px] text-slate-400 uppercase font-bold">
                                    <th className="pb-3">Fecha</th>
                                    <th className="pb-3">Ratio</th>
                                    <th className="pb-3 text-right">Riesgo</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs">
                                {historyData.map((h, i) => (
                                    <tr key={i} className="border-b border-slate-200/50 last:border-0 font-medium">
                                        <td className="py-3 text-slate-500">{new Date(h.testDate).toLocaleDateString()}</td>
                                        <td className="py-3 font-bold text-[#293b64]">{h.nlrValue.toFixed(2)}</td>
                                        <td className="py-3 text-right">
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${getClinicalStatus(h.nlrValue).bg} ${getClinicalStatus(h.nlrValue).color}`}>
                                                {h.riskLevel.split('_')[0]}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Visualización del Stress-o-Meter */}
                <div className="bg-slate-50 rounded-[3rem] p-10 flex flex-col justify-center items-center border border-dashed border-slate-200 relative shadow-inner">
                    {result ? (
                        <div className="w-full text-center space-y-8 animate-in zoom-in duration-700">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NLR Score Actual</p>
                                <h3 className="text-8xl font-black text-[#293b64] tracking-tighter">{result}</h3>
                                <div className={`inline-flex items-center gap-2 px-6 py-2 rounded-full text-[11px] font-black uppercase ${getClinicalStatus(result).bg} ${getClinicalStatus(result).color} border border-current shadow-sm`}>
                                    {result <= 3.0 ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                    {getClinicalStatus(result).label}
                                </div>
                            </div>

                            {/* Stress-o-Meter Gauge */}
                            <div className="w-full space-y-4 pt-6">
                                <div className="relative h-6 bg-slate-200 rounded-full overflow-hidden shadow-inner flex">
                                    <div className="w-[25%] h-full bg-emerald-400 border-r border-white/20" /> {/* 0-3 */}
                                    <div className="w-[25%] h-full bg-yellow-400 border-r border-white/20" />  {/* 3-6 */}
                                    <div className="w-[25%] h-full bg-orange-500 border-r border-white/20" /> {/* 6-9 */}
                                    <div className="w-[25%] h-full bg-rose-600" />                          {/* 9-12 */}

                                    {/* Needle */}
                                    <div
                                        className="absolute top-0 w-1.5 h-full bg-[#293b64] shadow-2xl transition-all duration-1000 ease-out z-20"
                                        style={{ left: `${getClinicalStatus(result).width}%`, transform: 'translateX(-50%)' }}
                                    />
                                </div>
                                <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-tighter px-1">
                                    <span>Normal (1-3)</span>
                                    <span className="text-orange-600 font-black">Estrés {'>'} 3</span>
                                    <span>Crítico 9+</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center opacity-30 group">
                            <Activity size={80} className="mx-auto text-slate-400 group-hover:scale-110 transition-transform duration-500" />
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mt-6">Sincronización Clínica Requerida</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ClinicalInput({ label, value, onChange, placeholder }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-[#293b64] uppercase tracking-widest ml-2">{label}</label>
            <div className="relative">
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-white border-2 border-slate-100 rounded-3xl px-6 py-4 text-xl font-bold text-slate-800 outline-none focus:border-[#23bcef] focus:shadow-[0_0_20px_rgba(35,188,239,0.15)] transition-all"
                />
                <span className="absolute right-6 top-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">Abs</span>
            </div>
        </div>
    );
}
