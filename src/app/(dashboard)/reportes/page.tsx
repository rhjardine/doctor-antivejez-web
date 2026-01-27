'use client';

import { useState } from 'react';
import { FaFilePdf, FaFilter, FaUsers, FaChartLine, FaUserMd, FaAward, FaCalendarAlt } from 'react-icons/fa';
import { toast } from 'sonner';
import { generateReport } from '@/lib/actions/reports.actions';
import { ReportData, ReportType, TimeRange, PatientReport, ProfessionalReport } from '@/types/reports';
import { formatDate } from '@/utils/date';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

const reportOptions = [
  { id: 'patient_attendance', label: 'Pacientes Atendidos', icon: FaUsers },
  { id: 'treatment_adherence', label: 'Adherencia al Tratamiento', icon: FaAward },
  { id: 'patient_evolution', label: 'Evolución de Pacientes', icon: FaChartLine },
  { id: 'professional_performance', label: 'Uso por Profesionales', icon: FaUserMd },
];

const timeRangeOptions = [
  { id: 'daily', label: 'Diario' },
  { id: 'weekly', label: 'Semanal' },
  { id: 'biweekly', label: 'Quincenal' },
  { id: 'monthly', label: 'Mensual' },
  { id: 'quarterly', label: 'Trimestral' },
  { id: 'semiannual', label: 'Semestral' },
  { id: 'annual', label: 'Anual' },
  { id: 'all', label: 'Histórico' },
];

export default function ReportesPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('patient_attendance');
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('monthly');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    setReportData(null);
    try {
      const data = await generateReport(selectedReport, selectedTimeRange);
      setReportData(data);
    } catch (error: any) {
      toast.error(error.message || 'Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const renderReportTable = () => {
    if (!reportData) return null;

    const { type, data } = reportData;

    // Reporte RI-Bio: Dashboard Inteligente
    if (type === 'ri_bio') {
      const stats = data as any; // Cast for RiBioReport structure
      const COLORS = { cyan: '#23bcef', navy: '#293b64', emerald: '#10b981', slate: '#64748b' };

      return (
        <div className="space-y-6">
          {/* 1. Metric Cards (Bento Row 1) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10"><FaChartLine size={80} /></div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Correlación RI-Bio (Pearson r)</h3>
              <div className="text-5xl font-black text-[#293b64]">{stats.correlation}</div>
              <p className={`text-xs mt-2 font-bold px-3 py-1 rounded-full ${stats.correlation > 0.7 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                {stats.correlation > 0.7 ? 'ALTA SINCRONICIDAD' : 'CORRELACIÓN MODERADA'}
              </p>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><FaAward size={80} /></div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Adherencia Global (Omics)</h3>
              <div className="text-5xl font-black text-[#23bcef]">{stats.globalAdherence}%</div>
              <p className="text-xs text-slate-400 mt-2 font-medium">Esfuerzo del Paciente</p>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#293b64] to-[#1e293b]">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-white"><FaUserMd size={80} /></div>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-2">Rejuvenecimiento Total</h3>
              <div className="text-5xl font-black text-[#10b981]">{stats.rejuvenationYears} Años</div>
              <p className="text-xs text-slate-300 mt-2 font-medium">Retorno Biológico Real</p>
            </div>
          </div>

          {/* 2. Charts (Bento Row 2) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Chart: Adherence vs Reversal */}
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
              <h3 className="text-lg font-black text-[#293b64] uppercase tracking-tighter mb-6">Impacto de la Adherencia en Rejuvenecimiento</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={stats.chartData}>
                    <defs>
                      <linearGradient id="colorAdherencia" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" orientation="left" stroke={COLORS.cyan} tickCount={5} tick={{ fontSize: 10 }} width={30} />
                    <YAxis yAxisId="right" orientation="right" stroke={COLORS.emerald} tickCount={5} tick={{ fontSize: 10 }} width={30} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="adherence" name="Adherencia %" fill="url(#colorAdherencia)" stroke={COLORS.cyan} strokeWidth={3} />
                    <Line yAxisId="right" type="step" dataKey="rejuvenation" name="Años Revertidos" stroke={COLORS.emerald} strokeWidth={3} dot={{ r: 4, fill: COLORS.emerald }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radar Chart: 4R Efficiency */}
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
              <h3 className="text-lg font-black text-[#293b64] uppercase tracking-tighter mb-6">Eficiencia Terapia 4R</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={stats.radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Paciente" dataKey="A" stroke={COLORS.navy} strokeWidth={2} fill={COLORS.navy} fillOpacity={0.3} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 3. AI Insights Card */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">AI</div>
              <h3 className="text-sm font-black text-slate-700 uppercase">Análisis Clínico Automatizado (Nemotron-Mini 4B Estimate)</h3>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              <span className="font-bold text-[#293b64]">Observación:</span> Se detecta una correlación de <span className="font-mono font-bold">{stats.correlation}</span> entre la adherencia a los protocolos 4R y la reversión de edad biológica.
              {stats.correlation > 0.8
                ? " Esto indica una respuesta fisiológica altamente sensible a las intervenciones de estilo de vida. Se recomienda mantener la intensidad actual en Restauración (Nutrición)."
                : " La respuesta fisiológica muestra latencia. Se sugiere revisar la carga alostática o posibles bloqueos en la fase de Remoción (Detox)."}
              <br /><br />
              <span className="font-bold text-[#293b64]">Recomendación:</span> Siguiente ciclo debería enfocar en {stats.radarData.sort((a: any, b: any) => a.A - b.A)[0]?.subject} para equilibrar la eficiencia sistémica.
            </p>
          </div>
        </div>
      );
    }

    // Default Reports tables
    switch (type) {
      case 'patient_attendance':
        return (
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Paciente</th>
                <th scope="col" className="px-6 py-3">Fecha de Registro</th>
                <th scope="col" className="px-6 py-3">Profesional a Cargo</th>
              </tr>
            </thead>
            <tbody>
              {(data as PatientReport[]).map(item => (
                <tr key={item.id} className="bg-white border-b">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{item.firstName} {item.lastName}</th>
                  <td className="px-6 py-4">{formatDate(item.createdAt)}</td>
                  <td className="px-6 py-4">{item.user?.name || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'treatment_adherence':
        return (
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Paciente</th>
                <th scope="col" className="px-6 py-3">N° de Tests Realizados</th>
              </tr>
            </thead>
            <tbody>
              {(data as PatientReport[]).map(item => (
                <tr key={item.id} className="bg-white border-b">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{item.firstName} {item.lastName}</th>
                  <td className="px-6 py-4">{item.testsCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'patient_evolution':
        return (
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Paciente</th>
                <th scope="col" className="px-6 py-3">Mejora en Edad Biológica</th>
              </tr>
            </thead>
            <tbody>
              {(data as PatientReport[]).map(item => (
                <tr key={item.id} className="bg-white border-b">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{item.firstName} {item.lastName}</th>
                  <td className="px-6 py-4 font-medium text-green-600">{item.evolution?.toFixed(2)} años</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'professional_performance':
        return (
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Profesional</th>
                <th scope="col" className="px-6 py-3">Formularios Utilizados</th>
              </tr>
            </thead>
            <tbody>
              {(data as ProfessionalReport[]).map(item => (
                <tr key={item.id} className="bg-white border-b">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{item.name}</th>
                  <td className="px-6 py-4">{item.formsUsed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      default:
        return <p>Tipo de reporte no reconocido.</p>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Módulo de Reportes</h1>
        <p className="text-gray-600 mt-1">Genera informes detallados sobre la actividad del sistema.</p>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Seleccione los Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="label">Tipo de Reporte</label>
            <select value={selectedReport} onChange={e => setSelectedReport(e.target.value as ReportType)} className="input">
              {reportOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Rango de Tiempo</label>
            <select value={selectedTimeRange} onChange={e => setSelectedTimeRange(e.target.value as TimeRange)} className="input">
              {timeRangeOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
            </select>
          </div>
          <div className="self-end">
            <button onClick={handleGenerateReport} disabled={loading} className="w-full btn-primary flex items-center justify-center gap-2">
              <FaFilter />
              {loading ? 'Generando...' : 'Generar Reporte'}
            </button>
          </div>
        </div>
      </div>

      {reportData && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {reportOptions.find(opt => opt.id === selectedReport)?.label} - {timeRangeOptions.find(opt => opt.id === selectedTimeRange)?.label}
            </h2>
            <button className="btn-secondary flex items-center gap-2 text-sm py-2">
              <FaFilePdf /> Exportar a PDF
            </button>
          </div>
          <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
            {renderReportTable()}
          </div>
        </div>
      )}
    </div>
  );
}
