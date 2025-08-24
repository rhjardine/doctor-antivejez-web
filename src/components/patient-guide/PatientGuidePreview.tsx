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
  MetabolicFormItem,
  RemocionItem
} from '@/types/guide';
import { FaPrint, FaTimes } from 'react-icons/fa';
import Image from 'next/image';
import { homeopathicStructure, bachFlowersList } from './PatientGuide'; 

interface Props {
  patient: PatientWithDetails;
  guideData: GuideCategory[];
  formValues: GuideFormValues;
  onClose: () => void;
}

// ===== SOLUCIÓN: Función auxiliar recursiva para aplanar la estructura jerárquica =====
const flattenHomeopathyItems = (obj: typeof homeopathicStructure): string[] => {
  return Object.values(obj).flatMap(value => {
    if (Array.isArray(value)) {
      return value; // Es un array de strings, devolverlo directamente
    }
    if (typeof value === 'object' && value !== null) {
      return flattenHomeopathyItems(value as any); // Es un objeto anidado, llamar recursivamente
    }
    return [];
  });
};
// ====================================================================================

export default function PatientGuidePreview({ patient, guideData, formValues, onClose }: Props) {
  const handlePrint = () => {
    window.print();
  };

  const { selections, observaciones } = formValues;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn no-print">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
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

        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-guide, #printable-guide * {
              visibility: visible;
            }
            #printable-guide {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none;
            }
          }
        `}</style>
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
                const bioTerapicoSelection = selections['am_bioterapico'] as MetabolicFormItem;
                
                // ===== SOLUCIÓN: Usar la nueva función para obtener una lista plana de todos los nombres =====
                const allHomeopathyNames = flattenHomeopathyItems(homeopathicStructure);
                const selectedHomeopathy = allHomeopathyNames
                  .filter(name => {
                    const itemId = `am_hom_${name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
                    return selections[itemId]?.selected;
                  })
                  .map(name => ({ id: `am_hom_${name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`, name }));
                // ========================================================================================

                const selectedBach = bachFlowersList.filter(subItem => selections?.[subItem.id]?.selected);
                
                if (!bioTerapicoSelection?.selected && selectedHomeopathy.length === 0 && selectedBach.length === 0) return null;

                return (
                  <div key={category.id}>
                    <h3 className="text-xl font-semibold text-gray-700 border-b-2 border-gray-200 pb-2 mb-3">{category.title}</h3>
                    {bioTerapicoSelection?.selected && (
                      <div className="text-gray-800">
                        <span className="font-medium">Bioterápico + Bach:</span>
                        <span className="text-gray-600 ml-2">
                          {bioTerapicoSelection.gotas} gotas, {bioTerapicoSelection.vecesAlDia} veces al día. 
                          {(Array.isArray(bioTerapicoSelection.horario) ? bioTerapicoSelection.horario : [bioTerapicoSelection.horario]).map(h => 
                            h === 'Desayuno y Cena' 
                            ? ' 30 min antes de Desayuno y Cena.' 
                            : ' Cada 15 min por 1h en crisis.'
                          ).join(' y ')}
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
                    {selectedItems
                      .filter(
                        (it): it is StandardGuideItem | RevitalizationGuideItem | RemocionItem => 'name' in it
                      )
                      .map(item => {
                        const details = selections[item.id];
                        let treatmentDetails = '';

                        if ('dose' in item && item.dose) {
                          treatmentDetails = item.dose;
                        } else if (category.type === 'REVITALIZATION') {
                          const rev = details as RevitalizationFormItem;
                          treatmentDetails = [rev.complejoB_cc, rev.bioquel_cc, rev.frequency]
                            .filter(Boolean)
                            .join(' / ');
                        } else if (category.type === 'REMOCION') {
                            const rem = details as RemocionFormItem;
                            const remocionItem = item as RemocionItem; 
                            if (remocionItem.subType === 'aceite_ricino' || remocionItem.subType === 'leche_magnesia') {
                                treatmentDetails = `${rem.cucharadas || ''} cucharada(s) ${rem.horario || ''}`;
                            } else if (remocionItem.subType === 'detox_alcalina') {
                                treatmentDetails = `${rem.semanas ? `${rem.semanas} semana(s)` : ''} ${rem.alimentacionTipo?.join(', ') || ''}`;
                            } else if (remocionItem.subType === 'noni_aloe') {
                                treatmentDetails = `${rem.tacita_qty || ''} tacita(s) ${rem.tacita || ''} (${rem.frascos || ''} frasco(s))`;
                            }
                        } else {
                          const std = details as StandardFormItem;
                          treatmentDetails = [std.qty, std.freq, std.custom]
                            .filter(Boolean)
                            .join(' - ');
                        }

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