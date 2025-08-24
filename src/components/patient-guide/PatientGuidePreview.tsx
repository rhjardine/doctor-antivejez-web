'use client';

import { PatientWithDetails } from '@/types';
import {
  GuideCategory,
  GuideFormValues,
  StandardGuideItem,
  MetabolicActivator,
  RevitalizationGuideItem,
  RemocionItem,
  StandardFormItem,
  RevitalizationFormItem,
  MetabolicFormItem,
  RemocionFormItem,
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

// --- Subcomponente para renderizar un ítem de la guía ---
const GuideListItem = ({ name, details }: { name: string, details?: string | null }) => (
  <li className="text-gray-800 break-inside-avoid">
    <span className="font-semibold">{name}</span>
    {details && <span className="text-gray-600">: {details}</span>}
  </li>
);

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
              height: auto;
              overflow: visible;
            }
            .no-print {
              display: none;
            }
          }
        `}</style>
        <div id="printable-guide" className="p-8 lg:p-12 overflow-y-auto bg-gray-50">
          <header className="flex justify-between items-start mb-10 border-b-2 border-primary pb-6">
            <div className="w-40">
              <Image src="/images/logo.png" alt="Logo Doctor Antivejez" width={160} height={40} priority />
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-bold text-primary-dark">Guía de Tratamiento</h1>
              <p className="text-gray-500 text-lg">Personalizada</p>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-8 mb-10 border-b border-gray-200 pb-6">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider">Paciente</p>
              <p className="font-bold text-xl text-gray-800">{patient.firstName} {patient.lastName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 uppercase tracking-wider">Fecha de Emisión</p>
              <p className="font-bold text-xl text-gray-800">{new Date(formValues.guideDate).toLocaleDateString('es-VE')}</p>
            </div>
          </div>

          <main className="space-y-10">
            {guideData.map(category => {
              const selectedItems = category.items.filter(item => selections?.[item.id]?.selected);

              if (category.type === 'METABOLIC') {
                const bioTerapicoSelection = selections['am_bioterapico'] as MetabolicFormItem;
                const allHomeopathyNames = flattenHomeopathyItems(homeopathicStructure);
                const selectedHomeopathy = allHomeopathyNames
                  .filter(name => {
                    const itemId = `am_hom_${name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
                    return selections[itemId]?.selected;
                  });
                const selectedBach = bachFlowersList.filter(subItem => selections?.[subItem.id]?.selected);
                
                if (!bioTerapicoSelection?.selected && selectedHomeopathy.length === 0 && selectedBach.length === 0) return null;

                return (
                  <div key={category.id} className="break-inside-avoid">
                    <h3 className="category-title">{category.title}</h3>
                    {bioTerapicoSelection?.selected && (
                      <div className="text-gray-800 mb-4">
                        <span className="font-semibold">Bioterápico + Bach:</span>
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
                        <h4 className="font-semibold text-primary-dark mt-4 mb-2">Homeopatía</h4>
                        <ul className="list-disc list-inside space-y-1 pl-2 columns-2 md:columns-3 text-sm">
                          {selectedHomeopathy.map(name => <li key={name}>{name}</li>)}
                        </ul>
                      </>
                    )}
                    {selectedBach.length > 0 && (
                      <>
                        <h4 className="font-semibold text-primary-dark mt-4 mb-2">Flores de Bach</h4>
                        <ul className="list-disc list-inside space-y-1 pl-2 columns-2 md:columns-3 text-sm">
                          {selectedBach.map(item => <li key={item.id}>{item.name}</li>)}
                        </ul>
                      </>
                    )}
                  </div>
                );
              }
              
              if (selectedItems.length === 0) return null;

              return (
                <div key={category.id} className="break-inside-avoid">
                  <h3 className="category-title">{category.title}</h3>
                  <ul className="list-disc list-inside space-y-3 pl-4">
                    {selectedItems
                      .filter((it): it is StandardGuideItem | RevitalizationGuideItem | RemocionItem => 'name' in it)
                      .map(item => {
                        const details = selections[item.id];
                        let treatmentDetails: string | null = null;

                        if ('dose' in item && item.dose) {
                          treatmentDetails = item.dose;
                        } else if (category.type === 'REVITALIZATION') {
                          const rev = details as RevitalizationFormItem;
                          treatmentDetails = [rev.complejoB_cc, rev.bioquel_cc, rev.frequency].filter(Boolean).join(' / ');
                        } else if (category.type === 'REMOCION') {
                            const rem = details as RemocionFormItem;
                            const remItem = item as RemocionItem;
                            if (remItem.subType === 'aceite_ricino' || remItem.subType === 'leche_magnesia') {
                                treatmentDetails = `${rem.cucharadas || ''} cucharada(s) ${rem.horario || ''}`;
                            } else if (remItem.subType === 'detox_alcalina') {
                                treatmentDetails = `Por ${rem.semanas || '_'} semana(s). Tipo: ${rem.alimentacionTipo?.join(', ') || 'No especificado'}`;
                            } else if (remItem.subType === 'noni_aloe') {
                                treatmentDetails = `${rem.tacita_qty || '_'} tacita(s), ${rem.tacita || ''} (${rem.frascos || '_'} frasco(s))`;
                            }
                        } else {
                          const std = details as StandardFormItem;
                          treatmentDetails = [std.qty, std.freq, std.custom].filter(Boolean).join(' - ');
                        }

                        return <GuideListItem key={item.id} name={item.name} details={treatmentDetails} />;
                      })}
                  </ul>
                </div>
              );
            })}
            
            {observaciones && (
                <div className="break-inside-avoid pt-4">
                    <h3 className="category-title">Observaciones</h3>
                    <p className="text-gray-800 whitespace-pre-wrap bg-gray-100 p-4 rounded-md border">{observaciones}</p>
                </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

const flattenHomeopathyItems = (obj: typeof homeopathicStructure): string[] => {
    return Object.values(obj).flatMap(value => {
      if (Array.isArray(value)) {
        return value;
      }
      if (typeof value === 'object' && value !== null) {
        return flattenHomeopathyItems(value as any);
      }
      return [];
    });
};