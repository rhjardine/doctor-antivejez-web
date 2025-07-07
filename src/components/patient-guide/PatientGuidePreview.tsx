'use client';

import { PatientWithDetails } from '@/types';
import { FaPrint, FaTimes } from 'react-icons/fa';

type GuideItem = { id: string; name: string; dose?: string; };
type GuideData = Record<string, GuideItem[]>;
type Selections = Record<string, { selected: boolean; qty?: string; freq?: string; custom?: string; }>;

interface Props {
  patient: PatientWithDetails;
  guideData: GuideData;
  selections: Selections;
  onClose: () => void;
}

export default function PatientGuidePreview({ patient, guideData, selections, onClose }: Props) {
  
  const handlePrint = () => {
    const printContent = document.getElementById('printable-guide');
    const originalContents = document.body.innerHTML;
    if (printContent) {
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); // Recargar para restaurar los scripts y eventos
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Vista Previa de la Guía</h2>
          <div className="flex items-center gap-4">
            <button onClick={handlePrint} className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
              <FaPrint /> Imprimir
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
              <FaTimes />
            </button>
          </div>
        </div>
        <div id="printable-guide" className="p-8 overflow-y-auto">
          <header className="text-center mb-8">
             <h1 className="text-3xl font-bold text-primary-dark">Guía de Tratamiento Personalizada</h1>
             <p className="text-gray-600">Doctor AntiVejez</p>
          </header>
          <div className="grid grid-cols-2 gap-8 mb-8 border-b pb-4">
             <div>
                <p className="text-sm text-gray-500">Paciente</p>
                <p className="font-semibold text-lg">{patient.firstName} {patient.lastName}</p>
             </div>
             <div>
                <p className="text-sm text-gray-500">Fecha</p>
                <p className="font-semibold text-lg">{new Date().toLocaleDateString('es-VE')}</p>
             </div>
          </div>

          <div className="space-y-6">
            {Object.entries(guideData).map(([category, items]) => {
              const selectedItems = items.filter(item => selections[item.id]?.selected);
              if (selectedItems.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="text-xl font-semibold text-primary-dark border-b-2 border-primary-dark/50 pb-2 mb-3">{category}</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {selectedItems.map(item => {
                      const details = selections[item.id];
                      let treatmentDetails = '';
                      if (item.dose) {
                        treatmentDetails = item.dose;
                      } else if (details) {
                        treatmentDetails = [details.qty, details.freq, details.custom].filter(Boolean).join(' - ');
                      }
                      return (
                        <li key={item.id}>
                          <span className="font-medium">{item.name}:</span>
                          <span className="text-gray-700 ml-2">{treatmentDetails}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
