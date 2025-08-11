// src/components/patient-guide/PatientGuidePreview.tsx
'use client';

import { PatientWithDetails } from '@/types';
import { GuideCategory, GuideFormValues, StandardGuideItem, MetabolicActivator, RevitalizationGuideItem, GuideItemType, RevitalizationFormItem, StandardFormItem } from '@/types/guide';
import { FaPrint, FaTimes } from 'react-icons/fa';

interface Props {
  patient: PatientWithDetails;
  guideData: GuideCategory[];
  formValues: GuideFormValues;
  onClose: () => void;
}

export default function PatientGuidePreview({ patient, guideData, formValues, onClose }: Props) {
  
  // SOLUCIÓN: Usar window.print() directamente. El CSS se encargará del resto.
  const handlePrint = () => {
    window.print();
  };

  const { selections, metabolic_activator } = formValues;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Encabezado del modal con acciones (no se imprime) */}
        <div className="p-4 border-b flex justify-between items-center no-print">
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
        
        {/* Contenido imprimible de la guía */}
        <div id="printable-guide" className="p-8 overflow-y-auto">
          {/* Encabezado del Documento */}
          <header className="text-center mb-8">
             <h1 className="text-3xl font-bold text-gray-800">Guía de Tratamiento Personalizada</h1>
             <p className="text-gray-500">Doctor AntiVejez</p>
          </header>
          
          {/* Datos del Paciente */}
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

          {/* Cuerpo de la Guía */}
          <div className="space-y-8">
            {guideData.map((category) => {
              const selectedItems = category.items.filter(item => selections?.[item.id]?.selected);

              if (category.type === GuideItemType.METABOLIC) {
                  const activator = category.items[0] as MetabolicActivator;
                  const selectedHomeopathy = activator.homeopathy.filter(subItem => metabolic_activator?.homeopathy?.[subItem.id]?.selected);
                  const selectedBach = activator.bachFlowers.filter(subItem => metabolic_activator?.bachFlowers?.[subItem.id]?.selected);

                  if (selectedHomeopathy.length === 0 && selectedBach.length === 0) return null;

                  return (
                      <div key={category.id}>
                          <h3 className="text-xl font-semibold text-gray-700 border-b-2 border-gray-200 pb-2 mb-3">{category.title}</h3>
                          {selectedHomeopathy.length > 0 && (
                            <>
                                <h4 className="font-semibold text-primary mt-4 mb-2">Homeopatía</h4>
                                <ul className="list-disc list-inside space-y-2 pl-2">
                                    {selectedHomeopathy.map(item => <li key={item.id}>{item.name}</li>)}
                                </ul>
                            </>
                          )}
                          {selectedBach.length > 0 && (
                            <>
                                <h4 className="font-semibold text-primary mt-4 mb-2">Flores de Bach</h4>
                                <ul className="list-disc list-inside space-y-2 pl-2">
                                    {selectedBach.map(item => <li key={item.id}>{item.name}</li>)}
                                </ul>
                            </>
                          )}
                      </div>
                  )
              }

              if (selectedItems.length === 0) return null;

              return (
                <div key={category.id}>
                  <h3 className="text-xl font-semibold text-gray-700 border-b-2 border-gray-200 pb-2 mb-3">{category.title}</h3>
                  <ul className="list-disc list-inside space-y-3 pl-2">
                    {selectedItems.map(item => {
                      const details = selections[item.id];
                      let treatmentDetails = '';

                      // ===== INICIO DE LA CORRECCIÓN =====
                      // Se realiza una aserción de tipo para que TypeScript sepa qué propiedades esperar.
                      if(category.type === GuideItemType.REVITALIZATION) {
                        const revitalizationDetails = details as RevitalizationFormItem;
                        treatmentDetails = [
                            revitalizationDetails.complejoB_cc ? `Complejo B: ${revitalizationDetails.complejoB_cc}cc` : '',
                            revitalizationDetails.bioquel_cc ? `Bioquel: ${revitalizationDetails.bioquel_cc}cc` : '',
                            revitalizationDetails.frequency ? `Frecuencia: ${revitalizationDetails.frequency}` : ''
                        ].filter(Boolean).join(' / ');
                      } else if ('dose' in item && item.dose) {
                        treatmentDetails = item.dose;
                      } else if (details) {
                        const standardDetails = details as StandardFormItem;
                        treatmentDetails = [standardDetails.qty, standardDetails.freq, standardDetails.custom].filter(Boolean).join(' - ');
                      }
                      // ===== FIN DE LA CORRECCIÓN =====
                      
                      return (
                        <li key={item.id} className="text-gray-800">
                          <span className="font-medium">{item.name}</span>
                          {treatmentDetails && <span className="text-gray-600 ml-2">: {treatmentDetails}</span>}
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
