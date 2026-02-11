// src/components/genetics/GenomicHub.tsx
'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FaUpload, FaDna, FaCheckCircle, FaExclamationTriangle, FaHistory, FaFilePdf } from 'react-icons/fa';
import { toast } from 'sonner';
import { Patient } from '@/types';
import { getLabReports, validateLabReport } from '@/lib/actions/lab-report.actions';
import type { TeloTestExtraction } from '@/lib/ai/genomic-parser';

// ============================================================
// TYPES
// ============================================================
type ProcessingState = 'idle' | 'uploading' | 'processing' | 'completed' | 'error' | 'validating';
type ReportType = 'TELOTEST' | 'NUTRIGEN';
type ViewMode = 'upload' | 'history';

interface LabReportRecord {
    id: string;
    reportType: string;
    fileName: string;
    processingStatus: string;
    extractedData: any;
    validatedData: any;
    isValidated: boolean;
    errorMessage: string | null;
    testDate: string;
    createdAt: string;
}

interface GenomicHubProps {
    patient: Patient;
    onBack: () => void;
    onTestSaved?: () => void;
}

// ============================================================
// COMPONENT
// ============================================================
export default function GenomicHub({ patient, onBack, onTestSaved }: GenomicHubProps) {
    const [state, setState] = useState<ProcessingState>('idle');
    const [viewMode, setViewMode] = useState<ViewMode>('upload');
    const [reportType, setReportType] = useState<ReportType>('TELOTEST');
    const [extractedData, setExtractedData] = useState<any>(null);
    const [editableData, setEditableData] = useState<any>(null);
    const [labReportId, setLabReportId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [history, setHistory] = useState<LabReportRecord[]>([]);
    const [testDate, setTestDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Persistent state ref — survives tab switches
    const processingRef = useRef(false);

    // Load history
    useEffect(() => {
        if (viewMode === 'history') {
            getLabReports(patient.id).then(res => {
                if (res.success && res.data) {
                    setHistory(res.data as unknown as LabReportRecord[]);
                }
            });
        }
    }, [viewMode, patient.id]);

    // ── File handling ──────────────────────────────────────────
    const handleFileSelect = useCallback(async (file: File) => {
        if (!file.type.includes('pdf')) {
            toast.error('Solo se aceptan archivos PDF.');
            return;
        }
        if (file.size > 20 * 1024 * 1024) {
            toast.error('El archivo excede el tamaño máximo de 20MB.');
            return;
        }

        setState('uploading');
        processingRef.current = true;

        try {
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1];
                setState('processing');

                try {
                    const response = await fetch('/api/genomic-extract', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            pdfBase64: base64,
                            patientId: patient.id,
                            reportType,
                            fileName: file.name,
                            testDate,
                        }),
                    });

                    const result = await response.json();
                    processingRef.current = false;

                    if (result.processingStatus === 'COMPLETED' && result.extractedData) {
                        setExtractedData(result.extractedData);
                        setEditableData(JSON.parse(JSON.stringify(result.extractedData)));
                        setLabReportId(result.labReportId);
                        setState('completed');
                        toast.success('Informe procesado exitosamente.');
                    } else {
                        setState('error');
                        setErrorMessage(result.clinicalError || result.error || 'Error desconocido.');
                        toast.error(result.clinicalError || 'Error al procesar el informe.');
                    }
                } catch (fetchError) {
                    processingRef.current = false;
                    setState('error');
                    setErrorMessage('Error de conexión al procesar el informe.');
                    toast.error('Error de conexión.');
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            processingRef.current = false;
            setState('error');
            setErrorMessage('Error al leer el archivo.');
        }
    }, [patient.id, reportType, testDate]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    // ── Validation & Save ─────────────────────────────────────
    const handleValidateAndSave = async () => {
        if (!labReportId || !editableData) return;
        setState('validating');

        const result = await validateLabReport(
            labReportId,
            editableData,
            patient.id,           // Exact ID mapping
            testDate,             // Exact date mapping
            patient.chronologicalAge
        );

        if (result.success) {
            toast.success('Datos validados y guardados en el historial genético.');
            setState('idle');
            setExtractedData(null);
            setEditableData(null);
            setLabReportId(null);
            onTestSaved?.();
        } else {
            toast.error(result.error || 'Error al guardar.');
            setState('completed');
        }
    };

    // ── Reset ─────────────────────────────────────────────────
    const handleReset = () => {
        setState('idle');
        setExtractedData(null);
        setEditableData(null);
        setLabReportId(null);
        setErrorMessage('');
    };

    // ── Update editable field ──────────────────────────────────
    const updateField = (key: string, value: any) => {
        setEditableData((prev: any) => ({ ...prev, [key]: value }));
    };

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div className="animate-fadeIn">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <span className="p-2 bg-[#293b64] rounded-xl"><FaDna className="text-white text-lg" /></span>
                            Genómica Avanzada
                        </h1>
                        <p className="text-slate-500 text-sm">Extracción inteligente de informes Fagron</p>
                    </div>
                </div>

                {/* Tab Toggle */}
                <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                    <button
                        onClick={() => setViewMode('upload')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'upload' ? 'bg-white text-[#293b64] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <FaUpload className="inline mr-2" size={12} />Subir PDF
                    </button>
                    <button
                        onClick={() => setViewMode('history')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'history' ? 'bg-white text-[#293b64] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <FaHistory className="inline mr-2" size={12} />Historial
                    </button>
                </div>
            </div>

            {viewMode === 'history' ? (
                <HistoryView history={history} />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* LEFT PANEL — Upload / Processing */}
                    <div>
                        {/* Report Type Selector */}
                        <div className="flex gap-3 mb-4">
                            <button
                                onClick={() => setReportType('TELOTEST')}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border-2 ${reportType === 'TELOTEST'
                                        ? 'bg-[#293b64] text-white border-[#293b64]'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-[#23bcef]'
                                    }`}
                            >
                                TeloTest
                            </button>
                            <button
                                onClick={() => setReportType('NUTRIGEN')}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border-2 ${reportType === 'NUTRIGEN'
                                        ? 'bg-[#293b64] text-white border-[#293b64]'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-[#23bcef]'
                                    }`}
                            >
                                NutriGen
                            </button>
                        </div>

                        {/* Date Selector */}
                        <div className="mb-4">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">Fecha del Test</label>
                            <input
                                type="date"
                                value={testDate}
                                onChange={(e) => setTestDate(e.target.value)}
                                className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:border-[#23bcef] focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all"
                            />
                        </div>

                        {/* Drop Zone / Processing State */}
                        {state === 'idle' && (
                            <div
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onClick={() => fileInputRef.current?.click()}
                                className="cursor-pointer border-3 border-dashed border-[#23bcef]/40 rounded-2xl bg-[#293b64] p-12 flex flex-col items-center justify-center text-center hover:border-[#23bcef] transition-all group min-h-[280px]"
                            >
                                <div className="w-20 h-20 rounded-full bg-[#23bcef]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <FaUpload className="text-[#23bcef] text-3xl" />
                                </div>
                                <h3 className="text-white font-bold text-lg mb-2">
                                    Arrastra tu informe PDF aquí
                                </h3>
                                <p className="text-slate-400 text-sm mb-4">
                                    o haz clic para seleccionar un archivo
                                </p>
                                <span className="text-[#23bcef] text-xs font-semibold px-4 py-2 bg-[#23bcef]/10 rounded-full">
                                    Máximo 20MB • Solo PDF
                                </span>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                />
                            </div>
                        )}

                        {(state === 'uploading' || state === 'processing') && (
                            <div className="border-2 border-[#23bcef]/30 rounded-2xl bg-[#293b64] p-12 flex flex-col items-center justify-center text-center min-h-[280px]">
                                {/* Pulse Animation */}
                                <div className="relative mb-8">
                                    <div className="w-20 h-20 rounded-full bg-[#23bcef]/20 flex items-center justify-center animate-pulse">
                                        <FaDna className="text-[#23bcef] text-3xl animate-spin" style={{ animationDuration: '3s' }} />
                                    </div>
                                    <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-[#23bcef]/30 animate-ping" />
                                </div>
                                <h3 className="text-white font-bold text-lg mb-2">
                                    {state === 'uploading' ? 'Subiendo archivo...' : 'Analizando biomarcadores genómicos...'}
                                </h3>
                                <p className="text-slate-400 text-sm">
                                    {state === 'processing'
                                        ? 'Este proceso puede tomar hasta 60 segundos para informes extensos. Puede cambiar de pestaña sin perder el progreso.'
                                        : 'Preparando el archivo para el análisis...'}
                                </p>
                                <div className="mt-6 w-48 h-1 bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#23bcef] rounded-full animate-pulse" style={{ width: state === 'uploading' ? '30%' : '70%' }} />
                                </div>
                            </div>
                        )}

                        {state === 'error' && (
                            <div className="border-2 border-red-200 rounded-2xl bg-red-50 p-8 flex flex-col items-center justify-center text-center min-h-[280px]">
                                <FaExclamationTriangle className="text-red-400 text-4xl mb-4" />
                                <h3 className="text-slate-900 font-bold text-lg mb-2">Error Clínico</h3>
                                <p className="text-slate-600 text-sm mb-6 max-w-sm">{errorMessage}</p>
                                <button
                                    onClick={handleReset}
                                    className="px-6 py-3 bg-[#293b64] text-white rounded-xl font-bold hover:bg-[#1e2d4f] transition-colors"
                                >
                                    Reintentar
                                </button>
                            </div>
                        )}

                        {state === 'validating' && (
                            <div className="border-2 border-emerald-200 rounded-2xl bg-emerald-50 p-8 flex flex-col items-center justify-center text-center min-h-[280px]">
                                <div className="w-12 h-12 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin mb-4" />
                                <h3 className="text-slate-900 font-bold text-lg">Guardando datos validados...</h3>
                            </div>
                        )}
                    </div>

                    {/* RIGHT PANEL — Comparison Table */}
                    <div>
                        {(state === 'completed' && extractedData && editableData) ? (
                            <ComparisonTable
                                extractedData={extractedData}
                                editableData={editableData}
                                onUpdateField={updateField}
                                onValidate={handleValidateAndSave}
                                onReset={handleReset}
                                reportType={reportType}
                                patientName={`${patient.firstName} ${patient.lastName}`}
                                chronologicalAge={patient.chronologicalAge}
                            />
                        ) : (
                            <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                    <FaDna className="text-4xl text-slate-200" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Esperando Informe</h3>
                                <p className="text-slate-500 text-sm max-w-sm">
                                    Suba un informe de laboratorio Fagron para ver los datos extraídos y compararlos antes de guardar.
                                </p>
                                {/* Patient Info */}
                                <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-xs">
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
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================
// COMPARISON TABLE COMPONENT
// ============================================================
interface ComparisonTableProps {
    extractedData: TeloTestExtraction;
    editableData: any;
    onUpdateField: (key: string, value: any) => void;
    onValidate: () => void;
    onReset: () => void;
    reportType: ReportType;
    patientName: string;
    chronologicalAge: number;
}

function ComparisonTable({
    extractedData,
    editableData,
    onUpdateField,
    onValidate,
    onReset,
    reportType,
    patientName,
    chronologicalAge,
}: ComparisonTableProps) {
    const teloFields = [
        { key: 'sampleCode', label: 'Código de Muestra', type: 'text' },
        { key: 'averageTelomereLength', label: 'Longitud Telomérica', type: 'text' },
        { key: 'estimatedBiologicalAge', label: 'Edad Biológica Estimada', type: 'number' },
        { key: 'agingDifference', label: 'Diferencia de Envejecimiento', type: 'number' },
        { key: 'sampleDate', label: 'Fecha de Muestra', type: 'text' },
        { key: 'analysisDate', label: 'Fecha de Análisis', type: 'text' },
    ];

    const fields = reportType === 'TELOTEST' ? teloFields : teloFields;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <FaCheckCircle className="text-emerald-500 text-xl" />
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Datos Extraídos</h3>
                        <p className="text-xs text-slate-500">Verifique y corrija los valores antes de guardar</p>
                    </div>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
                    {reportType}
                </span>
            </div>

            {/* Patient Context */}
            <div className="bg-slate-50 rounded-xl p-3 mb-4 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Paciente: <span className="text-slate-900">{patientName}</span></span>
                <span className="text-xs font-bold text-slate-500">Edad Cronológica: <span className="text-slate-900">{chronologicalAge} años</span></span>
            </div>

            {/* Comparison Table */}
            <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3 text-xs font-bold text-slate-400 uppercase px-3 pb-2 border-b border-slate-100">
                    <span>Campo</span>
                    <span>Valor Extraído</span>
                    <span>Valor Validado</span>
                </div>

                {fields.map(field => (
                    <div key={field.key} className="grid grid-cols-3 gap-3 items-center px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <span className="text-sm font-semibold text-slate-700">{field.label}</span>
                        <span className="text-sm text-slate-500 font-mono bg-slate-100 px-3 py-1.5 rounded-lg truncate">
                            {String(extractedData[field.key as keyof typeof extractedData] ?? '-')}
                        </span>
                        <input
                            type={field.type}
                            value={editableData[field.key] ?? ''}
                            onChange={(e) => onUpdateField(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                            className="text-sm font-bold text-slate-900 bg-white border-2 border-slate-200 rounded-lg px-3 py-1.5 focus:border-[#23bcef] focus:ring-2 focus:ring-cyan-500/10 outline-none transition-all"
                        />
                    </div>
                ))}
            </div>

            {/* Interpretation Preview */}
            {editableData.interpretation && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <p className="text-xs font-bold text-amber-600 mb-1 uppercase">Interpretación</p>
                    <p className="text-sm text-slate-700">{editableData.interpretation}</p>
                </div>
            )}

            {/* Rejuvenation Score */}
            {editableData.summary?.rejuvenationScore !== undefined && (
                <div className="mt-4 p-4 bg-gradient-to-r from-[#293b64] to-[#1e2d4f] rounded-xl text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-300 uppercase">Rejuvenation Score</p>
                            <p className="text-3xl font-black">{editableData.summary.rejuvenationScore}<span className="text-lg text-slate-400">/100</span></p>
                        </div>
                        <div className="w-16 h-16 rounded-full border-4 border-[#23bcef] flex items-center justify-center">
                            <FaDna className="text-[#23bcef] text-xl" />
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
                <button
                    onClick={onValidate}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200/50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                    <FaCheckCircle size={16} />
                    Validar y Guardar
                </button>
                <button
                    onClick={onReset}
                    className="px-6 py-4 border-2 border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 rounded-xl font-bold transition-all"
                >
                    Descartar
                </button>
            </div>
        </div>
    );
}

// ============================================================
// HISTORY VIEW COMPONENT
// ============================================================
function HistoryView({ history }: { history: LabReportRecord[] }) {
    if (history.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <FaHistory className="text-slate-200 text-5xl mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">Sin informes procesados</h3>
                <p className="text-slate-500 text-sm">Los informes de laboratorio procesados aparecerán aquí.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {history.map(report => (
                <div key={report.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${report.processingStatus === 'COMPLETED' ? 'bg-emerald-50' :
                                report.processingStatus === 'ERROR' ? 'bg-red-50' :
                                    'bg-amber-50'
                            }`}>
                            <FaFilePdf className={`text-lg ${report.processingStatus === 'COMPLETED' ? 'text-emerald-500' :
                                    report.processingStatus === 'ERROR' ? 'text-red-500' :
                                        'text-amber-500'
                                }`} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">{report.fileName}</p>
                            <p className="text-xs text-slate-500">
                                {report.reportType} • {new Date(report.createdAt).toLocaleDateString('es-VE')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${report.processingStatus === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                                report.processingStatus === 'ERROR' ? 'bg-red-50 text-red-700' :
                                    report.processingStatus === 'PROCESSING' ? 'bg-amber-50 text-amber-700' :
                                        'bg-slate-100 text-slate-600'
                            }`}>
                            {report.processingStatus === 'COMPLETED' ? (report.isValidated ? 'Validado' : 'Completado') :
                                report.processingStatus === 'ERROR' ? 'Error' :
                                    report.processingStatus === 'PROCESSING' ? 'Procesando' : 'Pendiente'}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
