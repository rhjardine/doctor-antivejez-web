'use client';

import { useState } from 'react';
import { FaFilePdf, FaFilter, FaUsers, FaChartLine, FaUserMd, FaAward, FaCalendarAlt } from 'react-icons/fa';
import { toast } from 'sonner';
import { generateReport } from '@/lib/actions/reports.actions';
import { ReportData, ReportType, TimeRange, PatientReport, ProfessionalReport } from '@/types/reports';
import { formatDate } from '@/utils/date';

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
