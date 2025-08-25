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
import { FaPrint, FaTimes, FaSyringe, FaCapsules, FaSpa, FaLeaf, FaVial, FaDna, FaStethoscope } from 'react-icons/fa';
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
  <li className="text-gray-800 break-inside-avoid flex items-start">
    <span className="text-primary mr-3 mt-1">&#8226;</span>
    <div>
      <span className="font-semibold">{name}</span>
      {details && <span className="text-gray-600 block text-sm">{details}</span>}
    </div>
  </li>
);

// --- Subcomponente para los títulos de categoría ---
const CategoryTitle = ({ title, icon }: { title: string, icon: React.ReactNode }) => (
  <div className="flex items-center gap-3 border-b-2 border-gray-200 pb-2 mb-4">
    <div className="text-primary text-2xl">{icon}</div>
    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
  </div>
);

export default function PatientGuidePreview({ patient, guideData, formValues, onClose }: Props) {
  const handlePrint = () => {
    window.print();
  };

  const { selections, observaciones } = formValues;

  const getCategoryIcon = (categoryId: string) => {
    if (categoryId.startsWith('cat_remocion')) return <FaSpa />;
    if (categoryId.startsWith('cat_revitalizacion')) return <FaSyringe />;
    if (categoryId.startsWith('cat_nutra')) return <FaCapsules />;
    if (categoryId.startsWith('cat_activador')) return <FaDna />;
    if (categoryId.startsWith('cat_formulas')) return <FaLeaf />;
    if (categoryId.startsWith('cat_sueros')) return <FaVial />;
    if (categoryId.startsWith('cat_terapias')) return <FaStethoscope />;
    return <FaCapsules />;
  };

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
            @page {
              size: A4;
              margin: 20mm;
            }
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
        <div id="printable-guide" className="p-8 lg:p-12 overflow-y-auto bg-white">
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
                    const categoryKey = Object.keys(homeopathicStructure).find(cat => 
                      Array.isArray(homeopathicStructure[cat as keyof typeof homeopathicStructure]) 
                        ? homeopathicStructure[cat as keyof typeof homeopathicStructure].includes(name)
                        : Object.values(homeopathicStructure[cat as keyof typeof homeopathicStructure]).flat().includes(name)
                    ) || '';
                    const subCategoryKey = !Array.isArray(homeopathicStructure[categoryKey as keyof typeof homeopathicStructure]) 
                      ? Object.keys(homeopathicStructure[categoryKey as keyof typeof homeopathicStructure]).find(subCat => homeopathicStructure[categoryKey as keyof typeof homeopathicStructure][subCat].includes(name))
                      : undefined;
                    const uniquePrefix = subCategoryKey ? `${categoryKey}_${subCategoryKey}` : categoryKey;
                    const itemId = `am_hom_${uniquePrefix}_${name}`.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
                    return selections[itemId]?.selected;
                  });
                const selectedBach = bachFlowersList.filter(subItem => selections?.[subItem.id]?.selected);
                
                if (!bioTerapicoSelection?.selected && selectedHomeopathy.length === 0 && selectedBach.length === 0) return null;

                return (
                  <div key={category.id} className="break-inside-avoid">
                    <CategoryTitle title={category.title} icon={getCategoryIcon(category.id)} />
                    {bioTerapicoSelection?.selected && (
                      <div className="text-gray-800 mb-4 pl-10">
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
                        <h4 className="font-semibold text-primary-dark mt-4 mb-2 pl-10">Homeopatía</h4>
                        <ul className="list-none space-y-1 pl-14 columns-2 md:columns-3 text-sm">
                          {selectedHomeopathy.map(name => <li key={name} className="before:content-['\2713'] before:text-green-500 before:mr-2">{name}</li>)}
                        </ul>
                      </>
                    )}
                    {selectedBach.length > 0 && (
                      <>
                        <h4 className="font-semibold text-primary-dark mt-4 mb-2 pl-10">Flores de Bach</h4>
                        <ul className="list-none space-y-1 pl-14 columns-2 md:columns-3 text-sm">
                          {selectedBach.map(item => <li key={item.id} className="before:content-['\2713'] before:text-green-500 before:mr-2">{item.name}</li>)}
                        </ul>
                      </>
                    )}
                  </div>
                );
              }
              
              if (selectedItems.length === 0) return null;

              return (
                <div key={category.id} className="break-inside-avoid">
                  <CategoryTitle title={category.title} icon={getCategoryIcon(category.id)} />
                  <ul className="list-none space-y-4 pl-10">
                    {selectedItems
                      .filter((it): it is StandardGuideItem | RevitalizationGuideItem | RemocionItem => 'name' in it)
                      .map(item => {
                        const details = selections[item.id];
                        let treatmentDetails: string | null = null;

                        if ('dose' in item && item.dose) {
                          treatmentDetails = item.dose;
                        } else if (category.type === 'REVITALIZATION') {
                          const rev = details as RevitalizationFormItem;
                          treatmentDetails = `${rev.complejoB_cc || '3 cc'} / ${rev.bioquel_cc || '3 cc'} / ${rev.frequency || ''}`;
                        } else if (category.type === 'REMOCION') {
                            const rem = details as RemocionFormItem;
                            const remItem = item as RemocionItem; 
                            if (remItem.subType === 'aceite_ricino' || remItem.subType === 'leche_magnesia') {
                                treatmentDetails = `${rem.cucharadas || '_'} cucharada(s) ${rem.horario || ''}`;
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
                    <CategoryTitle title="Observaciones" icon={<FaUserMd />} />
                    <p className="text-gray-800 whitespace-pre-wrap bg-gray-100 p-4 rounded-md border ml-10">{observaciones}</p>
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