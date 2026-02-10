// src/components/genetics/GeneticTestView.tsx
'use client';

import React from 'react';
import { FaArrowLeft, FaPrint, FaPlus } from 'react-icons/fa';
import type { TelotestReport } from '@/types/genetics';
import { formatDate } from '@/utils/date';
import { Button } from '@/components/ui/button';

interface GeneticTestViewProps {
  report: TelotestReport;
  onBack: () => void;
  onNewTest?: () => void;
}

const Section: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-6">
    <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4 uppercase tracking-tight">{title}</h2>
    {children}
  </div>
);

const GeneticTestView: React.FC<GeneticTestViewProps> = ({ report, onBack, onNewTest }) => {
  const { patient, results, interpretation, therapeuticResults, generalRecommendations, references } = report;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'API': return 'bg-red-100 text-red-800';
      case 'Phytochemical': return 'bg-green-100 text-green-800';
      case 'Antioxidant': return 'bg-blue-100 text-blue-800';
      case 'Vitamine': return 'bg-yellow-100 text-yellow-800';
      case 'Mineral': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <FaArrowLeft className="text-slate-400" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Reporte de Edad Genética (Telotest)</h1>
            <p className="text-slate-500 font-medium">Análisis de longitud telomérica y envejecimiento celular</p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          {onNewTest && (
            <Button onClick={onNewTest} className="flex-1 md:flex-none gap-2 bg-primary hover:bg-primary-dark shadow-md shadow-primary/20 text-white font-bold">
              <FaPlus size={14} /> Nuevo Test
            </Button>
          )}
          <Button onClick={handlePrint} className="flex-1 md:flex-none gap-2 bg-slate-900 hover:bg-slate-800 shadow-md shadow-slate-200 text-white font-bold">
            <FaPrint size={14} /> Imprimir / Guardar PDF
          </Button>
        </div>
      </div>

      <Section title="Datos del Paciente">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><strong className="block text-slate-500 uppercase text-[10px] tracking-widest mb-1">Nombre</strong> <span className="font-bold text-slate-900">{patient.firstName} {patient.lastName}</span></div>
          <div><strong className="block text-slate-500 uppercase text-[10px] tracking-widest mb-1">Edad Cronológica</strong> <span className="font-bold text-slate-900">{patient.chronologicalAge} años</span></div>
          <div><strong className="block text-slate-500 uppercase text-[10px] tracking-widest mb-1">Fecha de Nacimiento</strong> <span className="font-bold text-slate-900">{formatDate(patient.birthDate)}</span></div>
          <div><strong className="block text-slate-500 uppercase text-[10px] tracking-widest mb-1">Código de Cliente</strong> <span className="font-bold text-slate-900">{patient.customerCode}</span></div>
        </div>
      </Section>

      <Section title="Resultados Genéticos">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm font-bold text-slate-500 uppercase mb-1">Longitud Promedio de Telómeros</p>
            <p className="text-3xl font-black text-primary">{results.averageTelomereLength}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm font-bold text-slate-500 uppercase mb-1">Edad Biológica Estimada</p>
            <p className="text-3xl font-black text-primary">{results.estimatedBiologicalAge}</p>
          </div>
          <div className={`p-4 rounded-lg border ${results.agingDifference <= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <p className={`text-sm font-bold uppercase mb-1 ${results.agingDifference <= 0 ? 'text-green-600' : 'text-red-600'}`}>Diferencia de Envejecimiento</p>
            <p className={`text-3xl font-black ${results.agingDifference <= 0 ? 'text-green-700' : 'text-red-700'}`}>{results.agingDifference > 0 ? `+${results.agingDifference}` : results.agingDifference} años</p>
          </div>
        </div>
        <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <h3 className="font-bold text-primary uppercase text-sm tracking-wider mb-2">Interpretación</h3>
          <p className="text-slate-700 text-base leading-relaxed">{interpretation}</p>
        </div>
      </Section>

      <Section title="Resultados Terapéuticos Sugeridos">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {therapeuticResults.map(rec => (
            <div key={rec.category}>
              <h3 className={`text-xs font-black mb-3 px-3 py-1.5 rounded-full inline-block uppercase tracking-wider ${getCategoryColor(rec.category)}`}>{rec.category}</h3>
              <ul className="space-y-1 text-slate-600 text-sm">
                {rec.items.map(item => <li key={item} className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Recomendaciones Generales">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {generalRecommendations.map(rec => (
            <div key={rec.category}>
              <h3 className="text-sm font-black text-primary-dark mb-4 uppercase tracking-wider">{rec.category}</h3>
              <ul className="space-y-3">
                {rec.points.map((point, index) => (
                  <li key={index} className="flex items-start bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                    <span className="text-green-500 mr-3 mt-1 flex-shrink-0 font-bold">&#10003;</span>
                    <span className="text-slate-600 text-sm leading-snug">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Referencias Científicas">
        <ul className="space-y-2 text-sm">
          {references.map(ref => (
            <li key={ref.id} className="break-words">
              <span className="text-gray-600">{ref.id}. {ref.text} </span>
              <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Ver publicación</a>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
};

export default GeneticTestView;
