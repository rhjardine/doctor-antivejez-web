// src/components/genetics/GeneticTestView.tsx
'use client';

import { FaArrowLeft, FaPrint } from 'react-icons/fa';
import type { TelotestReport } from '@/types/genetics';
import { formatDate } from '@/utils/date';

interface GeneticTestViewProps {
  report: TelotestReport;
  onBack: () => void;
}

const Section: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="card mt-6">
        <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">{title}</h2>
        {children}
    </div>
);

export default function GeneticTestView({ report, onBack }: GeneticTestViewProps) {
  const { patient, results, interpretation, therapeuticResults, generalRecommendations, references } = report;

  const getCategoryColor = (category: string) => {
    switch(category) {
        case 'API': return 'bg-red-100 text-red-800';
        case 'Phytochemical': return 'bg-green-100 text-green-800';
        case 'Antioxidant': return 'bg-blue-100 text-blue-800';
        case 'Vitamine': return 'bg-yellow-100 text-yellow-800';
        case 'Mineral': return 'bg-indigo-100 text-indigo-800';
        default: return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <div className="animate-fadeIn">
      <button onClick={onBack} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-lg mb-4">
        <FaArrowLeft />
        <span>Volver al Resumen</span>
      </button>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-900">Reporte de Edad Genética (Telotest)</h1>
        <button onClick={() => window.print()} className="btn-primary flex items-center gap-2">
          <FaPrint /> Imprimir / Guardar PDF
        </button>
      </div>
      
      <Section title="Datos del Paciente">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><strong className="block text-gray-500">Nombre</strong> {patient.firstName} {patient.lastName}</div>
          <div><strong className="block text-gray-500">Edad Cronológica</strong> {patient.chronologicalAge} años</div>
          <div><strong className="block text-gray-500">Fecha de Nacimiento</strong> {formatDate(patient.birthDate)}</div>
          <div><strong className="block text-gray-500">Código de Cliente</strong> {patient.customerCode}</div>
        </div>
      </Section>
      
      <Section title="Resultados Genéticos">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Longitud Promedio de Telómeros</p>
            <p className="text-3xl font-bold text-primary">{results.averageTelomereLength}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Edad Biológica Estimada</p>
            <p className="text-3xl font-bold text-primary">{results.estimatedBiologicalAge}</p>
          </div>
          <div className={`p-4 rounded-lg ${results.agingDifference <= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            <p className={`text-sm ${results.agingDifference <= 0 ? 'text-green-600' : 'text-red-600'}`}>Diferencia de Envejecimiento</p>
            <p className={`text-3xl font-bold ${results.agingDifference <= 0 ? 'text-green-700' : 'text-red-700'}`}>{results.agingDifference > 0 ? `+${results.agingDifference}` : results.agingDifference} años</p>
          </div>
        </div>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800">Interpretación</h3>
          <p className="mt-2 text-gray-700 text-base">{interpretation}</p>
        </div>
      </Section>
      
      <Section title="Resultados Terapéuticos Sugeridos">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {therapeuticResults.map(rec => (
            <div key={rec.category}>
              <h3 className={`text-lg font-semibold mb-3 px-3 py-1 rounded-full inline-block text-sm ${getCategoryColor(rec.category)}`}>{rec.category}</h3>
              <ul className="space-y-1 list-disc list-inside text-gray-600">
                {rec.items.map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Section>
      
      <Section title="Recomendaciones Generales">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {generalRecommendations.map(rec => (
            <div key={rec.category}>
              <h3 className="text-lg font-semibold text-primary-dark mb-3">{rec.category}</h3>
              <ul className="space-y-3">
                {rec.points.map((point, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-3 mt-1 flex-shrink-0">&#10003;</span>
                    <span className="text-gray-600">{point}</span>
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
