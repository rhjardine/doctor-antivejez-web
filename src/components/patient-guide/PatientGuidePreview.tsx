'use client';

import { PatientWithDetails } from '@/types';
// Importar los tipos centralizados desde el nuevo archivo
import { GuideData, Selections } from '@/types/guide';
import { FaPrint, FaTimes } from 'react-icons/fa';

interface Props {
  patient: PatientWithDetails;
  guideData: GuideData;
  selections: Selections;
  onClose: () => void;
}

export default function PatientGuidePreview({ patient, guideData, selections, onClose }: Props) {
  
  // Función para manejar la impresión del contenido de la guía
  const handlePrint = () => {
    const printContent = document.getElementById('printable-guide');
    if (printContent) {
      const originalContents = document.body.innerHTML;
      // Se crea un HTML temporal para la impresión con los estilos necesarios
      document.body.innerHTML = `
        <html>
          <head>
            <title>Guía del Paciente - ${patient.firstName} ${patient.lastName}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { 
                font-family: 'Inter', sans-serif; 
                -webkit-print-color-adjust: exact; /* Fuerza la impresión de colores de fondo en Chrome */
                print-color-adjust: exact; /* Estándar */
              }
              @media print {
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `;
      window.print();
      document.body.innerHTML = originalContents;
      // Es necesario recargar para restaurar los event listeners de React
      window.location.reload(); 
    }
  };

  return (
    // Overlay del modal
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Encabezado del modal con acciones */}
        <div className="p-4 border-b flex justify-between items-center no-print">
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
        
        {/* Contenido imprimible de la guía */}
        <div id="printable-guide" className="p-8 overflow-y-auto">
          <header className="text-center mb-8">
             <h1 className="text-3xl font-bold text-[#293B64]">Guía de Tratamiento Personalizada</h1>
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
            {Object.entries(guideData).map(([category, content]) => {
              // Determina los ítems seleccionados, ya sea de un array simple o de las subcategorías
              const selectedItems = Array.isArray(content) 
                ? content.filter(item => selections[item.id]?.selected)
                : [...content.homeopathy, ...content.bachFlowers].filter(item => selections[item.id]?.selected);

              if (selectedItems.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="text-xl font-semibold text-[#293B64] border-b-2 border-gray-200 pb-2 mb-3">{category}</h3>
                  <ul className="list-disc list-inside space-y-2 pl-2">
                    {selectedItems.map(item => {
                      const details = selections[item.id];
                      let treatmentDetails = '';
                      // Si el ítem tiene una dosis predefinida, úsala
                      if ('dose' in item && item.dose) {
                        treatmentDetails = item.dose;
                      } else if (details) {
                        // De lo contrario, construye los detalles a partir de la selección del usuario
                        treatmentDetails = [details.qty, details.freq, details.custom].filter(Boolean).join(' - ');
                      }
                      return (
                        <li key={item.id}>
                          <span className="font-medium">{item.name}</span>
                          {treatmentDetails && <span className="text-gray-700 ml-2">: {treatmentDetails}</span>}
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
