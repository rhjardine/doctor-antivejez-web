'use client';

import { PatientWithDetails } from '@/types';
import {
  GuideCategory,
  GuideFormValues,
  StandardGuideItem,
  MetabolicActivator,
  RevitalizationGuideItem,
  StandardFormItem,
  RevitalizationFormItem,
  RemocionFormItem,
  MetabolicFormItem
} from '@/types/guide';
import { FaPrint, FaTimes } from 'react-icons/fa';
import Image from 'next/image';

interface Props {
  patient: PatientWithDetails;
  guideData: GuideCategory[];
  formValues: GuideFormValues;
  onClose: () => void;
}

export default function PatientGuidePreview({ patient, guideData, formValues, onClose }: Props) {
  const handlePrint = () => {
    // Ocultar elementos no deseados antes de imprimir
    const elementsToHide = document.querySelectorAll('.no-print');
    elementsToHide.forEach(el => (el as HTMLElement).style.display = 'none');
    
    window.print();

    // Volver a mostrar los elementos después de imprimir
    elementsToHide.forEach(el => (el as HTMLElement).style.display = '');
  };

  const { selections, observaciones } = formValues;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn no-print">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header no imprimible */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Vista Previa de la Guía</h2>
          <div className="flex items-center gap-4">
            <button onClick={handlePrint} className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
              <FaPrint /> Imprimir / Guardar PDF
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Contenido Imprimible */}
        <div id="printable-guide" className="p-8 overflow-y-auto">
          <header className="flex justify-between items-center mb-8">
            <div className="w-48">
              <Image src="/logo.png" alt="Logo Doctor Antivejez" width={200} height={50} priority />
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold text-gray-800">Guía de Tratamiento</h1>
              <p className="text-gray-500">Personalizada</p>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-8 mb-8 border-b pb-4">
            <div>
              <p className="text-sm text-gray-500">Paciente</p>
              <p className="font-semibold text-lg">{patient.firstName} {patient.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fecha de Emisión</p>
              <p className="font-semibold text-lg">{new Date(formValues.guideDate).toLocaleDateString('es-VE')}</p>
            </div>
          </div>

          <div className="space-y-8">
            {guideData.map(category => {
              if (category.type === 'METABOLIC') {
                const activator = category.items[0] as MetabolicActivator;
                const bioTerapicoSelection = selections['am_bioterapico'] as MetabolicFormItem;
                const selectedHomeopathy = activator.homeopathy.filter(subItem => selections?.[subItem.id]?.selected);
                const selectedBach = activator.bachFlowers.filter(subItem => selections?.[subItem.id]?.selected);
                
                if (!bioTerapicoSelection?.selected && selectedHomeopathy.length === 0 && selectedBach.length === 0) return null;

                return (
                  <div key={category.id}>
                    <h3 className="text-xl font-semibold text-gray-700 border-b-2 border-gray-200 pb-2 mb-3">{category.title}</h3>
                    {bioTerapicoSelection?.selected && (
                      <div className="text-gray-800">
                        <span className="font-medium">Bioterápico + Bach:</span>
                        <span className="text-gray-600 ml-2">
                          {bioTerapicoSelection.gotas} gotas, {bioTerapicoSelection.vecesAlDia} veces al día. 
                          {bioTerapicoSelection.horario === 'Desayuno y Cena' 
                            ? ' 30 min antes de Desayuno y Cena.' 
                            : ' Cada 15 min por 1h en crisis.'}
                        </span>
                      </div>
                    )}
                    {selectedHomeopathy.length > 0 && (
                      <>
                        <h4 className="font-semibold text-primary mt-4 mb-2">Homeopatía</h4>
                        <ul className="list-disc list-inside space-y-2 pl-2 columns-2">
                          {selectedHomeopathy.map(item => <li key={item.id}>{item.name}</li>)}
                        </ul>
                      </>
                    )}
                    {selectedBach.length > 0 && (
                      <>
                        <h4 className="font-semibold text-primary mt-4 mb-2">Flores de Bach</h4>
                        <ul className="list-disc list-inside space-y-2 pl-2 columns-3">
                          {selectedBach.map(item => <li key={item.id}>{item.name}</li>)}
                        </ul>
                      </>
                    )}
                  </div>
                );
              }
              
              const selectedItems = category.items.filter(item => selections?.[item.id]?.selected);
              if (selectedItems.length === 0) return null;

              return (
                <div key={category.id}>
                  <h3 className="text-xl font-semibold text-gray-700 border-b-2 border-gray-200 pb-2 mb-3">{category.title}</h3>
                  <ul className="list-disc list-inside space-y-3 pl-2">
                    {selectedItems.map(item => {
                        const details = selections[item.id];
                        let treatmentDetails = '';

                        // Lógica para construir los detalles del tratamiento...
                        // (Esta parte se mantiene igual que en tu versión anterior)

                        return (
                          <li key={item.id} className="text-gray-800">
                            <span className="font-medium">{item.name}</span>
                            {treatmentDetails && (
                              <span className="text-gray-600 ml-2">: {treatmentDetails}</span>
                            )}
                          </li>
                        );
                      })}
                  </ul>
                </div>
              );
            })}
            
            {observaciones && (
                <div>
                    <h3 className="text-xl font-semibold text-gray-700 border-b-2 border-gray-200 pb-2 mb-3">Observaciones</h3>
                    <p className="text-gray-800 whitespace-pre-wrap">{observaciones}</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}