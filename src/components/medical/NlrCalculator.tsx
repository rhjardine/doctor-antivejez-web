'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Info, Save, History, AlertCircle, Calculator, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

type Unit = 'abs' | 'pct';

export default function NlrCalculator({ patient }: { patient: any }) {
    const [neutroVal, setNeutroVal] = useState<string>('');
    const [neutroUnit, setNeutroUnit] = useState<Unit>('abs');

    const [lymphoVal, setLymphoVal] = useState<string>('');
    const [lymphoUnit, setLymphoUnit] = useState<Unit>('abs');

    const [totalWbc, setTotalWbc] = useState<string>('');
    const [result, setResult] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [historyData, setHistoryData] = useState<any[]>([]);

    // Rangos de Referencia Médica
    const refs = {
        neutro: neutroUnit === 'abs' ? 'Ref: 1.500 - 7.500 µL' : 'Ref: 40% - 75%',
        lympho: lymphoUnit === 'abs' ? 'Ref: 1.000 - 4.500 µL' : 'Ref: 20% - 40%',
        wbc: 'Ref: 4.500 - 11.000 µL'
    };

    const calculateAbsolutes = useCallback(() => {
        const n = parseFloat(neutroVal);
        const l = parseFloat(lymphoVal);
        const wbc = parseFloat(totalWbc);

        let absN = n;
        let absL = l;

        if (neutroUnit === 'pct' && !isNaN(n) && !isNaN(wbc)) absN = (n * wbc) / 100;
        if (lymphoUnit === 'pct' && !isNaN(l) && !isNaN(wbc)) absL = (l * wbc) / 100;

        return { absN, absL };
    }, [neutroVal, neutroUnit, lymphoVal, lymphoUnit, totalWbc]);

    useEffect(() => {
        const { absN, absL } = calculateAbsolutes();
        if (absN > 0 && absL > 0) {
            setResult(parseFloat((absN / absL).toFixed(2)));
        } else {
            setResult(null);
        }
    }, [calculateAbsolutes]);

    const getStatus = (val: number) => {
        if (val <= 3.0) return { label: 'Inmuno-Balance (Normal)', color: 'text-emerald-600', bg: 'bg-emerald-50', pos: (val / 12) * 100 };
        if (val <= 6.0) return { label: 'Estrés Fisiológico Leve', color: 'text-yellow-600', bg: 'bg-yellow-50', pos: (val / 12) * 100 };
        return { label: 'Inflamación Sistémica / Crítica', color: 'text-rose-600', bg: 'bg-rose-50', pos: Math.min((val / 12) * 100, 100) };
    };

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
        if (!result || isSaving) return;
        setIsSaving(true);

        // Calculate final absolute values to save in database
        const { absN, absL } = calculateAbsolutes();

        try {
            const response = await fetch('/clinical-nlr-v1', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    patientId: patient.id,
                    neutrophils: absN,
                    lymphocytes: absL,
                    testDate: new Date()
                }),
            });
            if (response.ok) {
                toast.success('Registro guardado en la Historia Clínica');
                if (showHistory) loadHistory();
            } else {
                toast.error('Error al guardar el registro');
            }
        } catch (e) {
            toast.error('Error de conexión');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden font-sans">
            <div className="bg-[#293b64] p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-[#23bcef]/20 rounded-xl flex items-center justify-center text-[#23bcef]">
                        <Calculator size={24} />
                    </div>
                    <div>
                        <h2 className="text-white font-black uppercase tracking-widest text-sm">Calculador NLR de Alta Precisión</h2>
                        <p className="text-[#23bcef] text-[9px] font-bold tracking-widest uppercase opacity-80">Calibración Clínica Avanzada</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest"
                >
                    <History size={14} /> {showHistory ? 'Cerrar Panel' : 'Ver Historial'}
                </button>
            </div>

            <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Columna de Entrada / Historial */}
                {!showHistory ? (
                    <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
                        <UnitInput
                            label="Neutrófilos"
                            value={neutroVal}
                            onChange={setNeutroVal}
                            unit={neutroUnit}
                            onUnitChange={setNeutroUnit}
                            refText={refs.neutro}
                        />

                        <UnitInput
                            label="Linfocitos"
                            value={lymphoVal}
                            onChange={setLymphoVal}
                            unit={lymphoUnit}
                            onUnitChange={setLymphoUnit}
                            refText={refs.lympho}
                        />

                        {(neutroUnit === 'pct' || lymphoUnit === 'pct') && (
                            <div className="animate-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-black text-[#23bcef] uppercase mb-2 block">Total Leucocitos (WBC) requerido</label>
                                <input
                                    type="number"
                                    value={totalWbc}
                                    onChange={(e) => setTotalWbc(e.target.value)}
                                    placeholder="Ej. 7500"
                                    className="w-full bg-slate-50 border-2 border-[#23bcef]/30 rounded-2xl px-6 py-4 font-bold text-[#293b64] outline-none focus:border-[#23bcef] transition-all shadow-inner"
                                />
                                <p className="text-[9px] text-slate-400 mt-2 italic">{refs.wbc}</p>
                            </div>
                        )}

                        <button
                            onClick={handleSave}
                            className="w-full bg-[#23bcef] text-white font-black py-5 rounded-2xl shadow-xl hover:bg-[#1da8d8] transition-all uppercase text-xs tracking-widest active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-3"
                            disabled={!result || isSaving}
                        >
                            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                            {isSaving ? 'Registrando...' : `Registrar en Historia de ${patient?.firstName}`}
                        </button>
                    </div>
                ) : (
                    <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 overflow-y-auto max-h-[450px] animate-in fade-in duration-500 shadow-inner">
                        <div className="flex items-center gap-2 mb-4 border-b pb-2">
                            <History className="text-[#293b64]" size={16} />
                            <h4 className="text-[#293b64] font-black text-[10px] uppercase tracking-widest">Últimos Resultados Clínicos</h4>
                        </div>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[9px] text-slate-400 uppercase font-bold">
                                    <th className="pb-3 px-2">Fecha</th>
                                    <th className="pb-3 px-2">Ratio</th>
                                    <th className="pb-3 px-2 text-right">Riesgo</th>
                                </tr>
                            </thead>
                            <tbody className="text-[11px]">
                                {historyData.map((h, i) => (
                                    <tr key={i} className="border-b border-slate-200/50 last:border-0 font-medium hover:bg-white/50 transition-colors">
                                        <td className="py-3 px-2 text-slate-500">{new Date(h.testDate).toLocaleDateString()}</td>
                                        <td className="py-3 px-2 font-bold text-[#293b64]">{h.nlrValue.toFixed(2)}</td>
                                        <td className="py-3 px-2 text-right">
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${getStatus(h.nlrValue).bg} ${getStatus(h.nlrValue).color} border border-current`}>
                                                {h.riskLevel.split('_')[0]}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {historyData.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="py-10 text-center text-slate-400 italic">No hay registros previos</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Panel de Resultado */}
                <div className="bg-slate-50 rounded-[3rem] p-10 flex flex-col justify-center items-center relative border border-slate-100 shadow-inner">
                    {result ? (
                        <div className="w-full text-center space-y-8 animate-in zoom-in duration-500">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">NLR Ratio Calculado</p>
                                <h3 className="text-8xl font-black text-[#293b64] tracking-tighter">{result}</h3>
                                <div className={`px-6 py-2 m-auto inline-flex items-center gap-2 rounded-full text-[10px] font-black uppercase border shadow-sm ${getStatus(result).bg} ${getStatus(result).color}`}>
                                    {result <= 3.0 ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                    {getStatus(result).label}
                                </div>
                            </div>

                            {/* Gauge */}
                            <div className="w-full pt-6 relative px-2">
                                <div className="h-4 w-full bg-slate-200 rounded-full flex overflow-hidden shadow-inner">
                                    <div className="w-[25%] h-full bg-emerald-400 border-r border-white/20" /> {/* 0-3 */}
                                    <div className="w-[25%] h-full bg-yellow-400 border-r border-white/20" />  {/* 3-6 */}
                                    <div className="w-[50%] h-full bg-rose-500" />                          {/* 6-12 */}
                                </div>
                                {/* Pointer */}
                                <div
                                    className="absolute top-5 h-8 w-1.5 bg-[#293b64] rounded-full transition-all duration-1000 ease-out shadow-xl z-10"
                                    style={{ left: `${getStatus(result).pos}%`, transform: 'translateX(-50%)' }}
                                />

                                <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-4 px-1">
                                    <span>Balance (0-3)</span>
                                    <span>Estrés (3-6)</span>
                                    <span>Inflamación (6+)</span>
                                </div>
                            </div>

                            {result > 3 && (
                                <p className="text-[10px] text-slate-500 italic animate-in fade-in duration-1000">
                                    * Valores superiores a 3.0 pueden sugerir un estado de inflamación de bajo grado o estrés psicofisiológico.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="text-center opacity-20 group">
                            <Activity size={80} className="mx-auto text-slate-400 group-hover:scale-110 transition-transform duration-500" />
                            <p className="text-xs font-bold uppercase mt-6 tracking-widest">Esperando Biomarcadores</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function UnitInput({ label, value, onChange, unit, onUnitChange, refText }: any) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-[#293b64] uppercase tracking-widest">{label}</label>
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    {(['abs', 'pct'] as Unit[]).map((u) => (
                        <button
                            key={u}
                            onClick={() => onUnitChange(u)}
                            className={`px-3 py-1 text-[9px] font-black rounded-md transition-all ${unit === u ? 'bg-white text-[#23bcef] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {u === 'abs' ? 'ABSOLUTO' : '% RELATIVO'}
                        </button>
                    ))}
                </div>
            </div>
            <div className="relative">
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-xl font-bold text-[#293b64] shadow-sm outline-none focus:border-[#23bcef] transition-all"
                    placeholder={unit === 'abs' ? "Ej. 4500" : "Ej. 65"}
                />
                <span className="absolute right-6 top-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">{unit === 'abs' ? 'cells/µL' : '%'}</span>
            </div>
            <p className="text-[9px] text-slate-400 ml-2 italic opacity-70 tracking-tight">{refText}</p>
        </div>
    );
}
