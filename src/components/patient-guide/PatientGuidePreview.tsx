'use client';

import React, { forwardRef } from 'react';
import { PatientWithDetails } from '@/types';
import {
  GuideCategory,
  GuideFormValues,
  StandardGuideItem,
  RevitalizationGuideItem,
  RemocionItem,
  StandardFormItem,
  RevitalizationFormItem,
  MetabolicFormItem,
  RemocionFormItem,
} from '@/types/guide';
import { FaPrint, FaTimes, FaSyringe, FaCapsules, FaSpa, FaLeaf, FaVial, FaDna, FaStethoscope, FaUserMd } from 'react-icons/fa';
import Image from 'next/image';
import { homeopathicStructure, bachFlowersList } from './PatientGuide';

interface Props {
  patient: PatientWithDetails;
  guideData: GuideCategory[];
  formValues: GuideFormValues;
  onClose: () => void;
}

// --- Subcomponente para renderizar un ítem de la guía ---
const GuideListItem = ({ name, details }: { name: string; details?: string | null }) => (
  <li className="text-gray-800 break-inside-avoid flex items-start">
    <span className="text-primary mr-3 mt-1">&#8226;</span>
    <div>
      <span className="font-semibold">{name}</span>
      {details && <span className="text-gray-600 block text-sm">{details}</span>}
    </div>
  </li>
);

// --- Subcomponente para los títulos de categoría ---
const CategoryTitle = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
  <div className="flex items-center gap-3 border-b-2 border-gray-200 pb-2 mb-4">
    <div className="text-primary text-2xl">{icon}</div>
    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
  </div>
);

const PatientGuidePreview = forwardRef<HTMLDivElement, Props>(
  ({ patient, guideData, formValues, onClose }, ref) => {
    const handlePrint = () => {
      window.print();
    };

    const { selections, observaciones } = formValues;

    const getCategoryIcon = (categoryId: string) => {
      if (categoryId.startsWith('cat_remocion')) return <FaSpa />;
      if (categoryId.startsWith('cat_revitalizacion')) return <FaSyringe />;
      if (categoryId.startsWith('cat_nutra')) return <FaCapsules />;
      if (categoryId.startsWith('cat_cosmeceuticos')) return <FaSpa />;
      if (categoryId.startsWith('cat_activador')) return <FaDna />;
      if (categoryId.startsWith('cat_formulas')) return <FaLeaf />;
      if (categoryId.startsWith('cat_sueros')) return <FaVial />;
      if (categoryId.startsWith('cat_terapias')) return <FaStethoscope />;
      return <FaCapsules />;
    };

    return (
      <>
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn no-print">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Vista Previa de la Guía</h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePrint}
                  className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
                >
                  <FaPrint /> Imprimir / Guardar PDF
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-200"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Contenido de la Vista Previa */}
            <div className="overflow-y-auto">
              <PrintableGuideContent
                ref={ref}
                patient={patient}
                guideData={guideData}
                formValues={formValues}
                getCategoryIcon={getCategoryIcon}
              />
            </div>
          </div>
        </div>

        {/* Estilos globales para impresión */}
        <style jsx global>{`
          @media print {
            @page {
              size: A4;
              margin: 15mm;
            }
            
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            .no-print {
              display: none !important;
            }
            
            .print-break-inside-avoid {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            
            .print-break-after {
              break-after: page;
              page-break-after: always;
            }
            
            .print-text-sm {
              font-size: 11pt !important;
            }
            
            .print-text-xs {
              font-size: 9pt !important;
            }
            
            .print-font-bold {
              font-weight: bold !important;
            }
            
            .print-margin-bottom {
              margin-bottom: 8pt !important;
            }
            
            .print-padding {
              padding: 4pt !important;
            }
            
            .print-border-gray {
              border: 1pt solid #d1d5db !important;
            }
            
            .print-bg-gray {
              background-color: #f9fafb !important;
            }
            
            .print-text-primary {
              color: #3b82f6 !important;
            }
            
            .print-hide-overflow {
              overflow: visible !important;
            }
          }
        `}</style>
      </>
    );
  }
);

// Componente separado para el contenido imprimible
const PrintableGuideContent = forwardRef<
  HTMLDivElement,
  {
    patient: PatientWithDetails;
    guideData: GuideCategory[];
    formValues: GuideFormValues;
    getCategoryIcon: (categoryId: string) => React.ReactNode;
  }
>(({ patient, guideData, formValues, getCategoryIcon }, ref) => {
  const { selections, observaciones } = formValues;

  return (
    <div ref={ref} className="p-8 lg:p-12 bg-white print-hide-overflow">
      {/* Header */}
      <header className="flex justify-between items-start mb-10 border-b-2 border-primary pb-6 print-break-inside-avoid">
        <div className="w-40">
          <Image
            src="/images/logo.png"
            alt="Logo Doctor Antivejez"
            width={160}
            height={40}
            priority
            className="print-break-inside-avoid"
          />
        </div>
        <div className="text-right">
          <h1 className="text-4xl font-bold text-primary-dark print-font-bold">
            Guía de Tratamiento
          </h1>
          <p className="text-gray-500 text-lg">Personalizada</p>
        </div>
      </header>

      {/* Patient Info */}
      <div className="grid grid-cols-2 gap-8 mb-10 border-b border-gray-200 pb-6 print-break-inside-avoid">
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wider">Paciente</p>
          <p className="font-bold text-xl text-gray-800 print-font-bold">
            {patient.firstName} {patient.lastName}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 uppercase tracking-wider">Fecha de Emisión</p>
          <p className="font-bold text-xl text-gray-800 print-font-bold">
            {new Date(formValues.guideDate).toLocaleDateString('es-VE')}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="space-y-10">
        {guideData.map(category => {
          const selectedItems = category.items.filter(item => selections?.[item.id]?.selected);

          if (category.type === 'METABOLIC') {
            const bioTerapicoSelection = selections['am_bioterapico'] as MetabolicFormItem;

            const allHomeopathyItems = Object.entries(homeopathicStructure).flatMap(([cat, subItems]) => {
              if (Array.isArray(subItems)) {
                return subItems.map(name => ({ 
                  name, 
                  category: cat, 
                  subCategory: undefined as string | undefined 
                }));
              }
              return Object.entries(subItems).flatMap(([subCat, items]) =>
                items.map(name => ({ name, category: cat, subCategory: subCat }))
              );
            }).flat();

            const selectedHomeopathy = allHomeopathyItems
              .filter(item => {
                const uniquePrefix = item.subCategory 
                  ? `${item.category}_${item.subCategory}` 
                  : item.category;
                const itemId = `am_hom_${uniquePrefix}_${item.name}`
                  .replace(/[^a-zA-Z0-9_]/g, '_')
                  .toLowerCase();
                return selections[itemId]?.selected;
              })
              .map(item => item.name);

            const selectedBach = bachFlowersList.filter(subItem =>
              selections?.[subItem.id]?.selected
            );

            if (!bioTerapicoSelection?.selected && selectedHomeopathy.length === 0 && selectedBach.length === 0) {
              return null;
            }

            return (
              <div key={category.id} className="print-break-inside-avoid">
                <CategoryTitle title={category.title} icon={getCategoryIcon(category.id)} />
                {bioTerapicoSelection?.selected && (
                  <div className="text-gray-800 mb-4 pl-10 print-margin-bottom">
                    <span className="font-semibold print-font-bold">Bioterápico + Bach:</span>
                    <span className="text-gray-600 ml-2 print-text-sm">
                      {bioTerapicoSelection.gotas} gotas, {bioTerapicoSelection.vecesAlDia} veces al día.{' '}
                      {(Array.isArray(bioTerapicoSelection.horario) 
                        ? bioTerapicoSelection.horario 
                        : [bioTerapicoSelection.horario]).map(h =>
                        h === 'Desayuno y Cena'
                          ? ' 30 min antes de Desayuno y Cena.'
                          : ' Cada 15 min por 1h en crisis.'
                      ).join(' y ')}
                    </span>
                  </div>
                )}
                {selectedHomeopathy.length > 0 && (
                  <>
                    <h4 className="font-semibold text-primary-dark mt-4 mb-2 pl-10 print-font-bold print-text-primary">
                      Homeopatía
                    </h4>
                    <ul className="list-none space-y-1 pl-14 columns-2 md:columns-3 text-sm print-text-sm">
                      {selectedHomeopathy.map(name => (
                        <li
                          key={name}
                          className="before:content-['\2713'] before:text-green-500 before:mr-2 print-break-inside-avoid"
                        >
                          {name}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                {selectedBach.length > 0 && (
                  <>
                    <h4 className="font-semibold text-primary-dark mt-4 mb-2 pl-10 print-font-bold print-text-primary">
                      Flores de Bach
                    </h4>
                    <ul className="list-none space-y-1 pl-14 columns-2 md:columns-3 text-sm print-text-sm">
                      {selectedBach.map(item => (
                        <li
                          key={item.id}
                          className="before:content-['\2713'] before:text-green-500 before:mr-2 print-break-inside-avoid"
                        >
                          {item.name}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            );
          }

          if (selectedItems.length === 0) return null;

          return (
            <div key={category.id} className="print-break-inside-avoid">
              <CategoryTitle title={category.title} icon={getCategoryIcon(category.id)} />
              <ul className="list-none space-y-4 pl-10">
                {selectedItems
                  .filter((it): it is StandardGuideItem | RevitalizationGuideItem | RemocionItem => 'name' in it)
                  .map(item => {
                    const details = selections[item.id];
                    let treatmentDetails: string | null = null;

                    const isNutraceutico = [
                      'cat_nutra_primarios',
                      'cat_nutra_secundarios',
                      'cat_nutra_complementarios',
                      'cat_cosmeceuticos',
                      'cat_formulas_naturales'
                    ].includes(category.id);

                    if ('dose' in item && item.dose) {
                      treatmentDetails = item.dose;
                    } else if (category.type === 'REVITALIZATION') {
                      const rev = details as RevitalizationFormItem;
                      treatmentDetails = `${rev.complejoB_cc || '3 cc'} / ${rev.bioquel_cc || '3 cc'} - ${rev.frequency || ''}`;
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
                    } else if (isNutraceutico) {
                      const std = details as StandardFormItem;
                      const parts = [
                        std.qty ? `${std.qty} ${std.doseType || ''}`.trim() : null,
                        std.freq,
                        std.custom
                      ].filter(Boolean);
                      treatmentDetails = parts.join(' - ');
                    } else {
                      const std = details as StandardFormItem;
                      treatmentDetails = [std.qty, std.freq, std.custom].filter(Boolean).join(' - ');
                    }

                    return (
                      <GuideListItem
                        key={item.id}
                        name={item.name}
                        details={treatmentDetails}
                      />
                    );
                  })}
              </ul>
            </div>
          );
        })}

        {observaciones && (
          <div className="print-break-inside-avoid pt-4">
            <CategoryTitle title="Observaciones" icon={<FaUserMd />} />
            <p className="text-gray-800 whitespace-pre-wrap bg-gray-100 p-4 rounded-md border ml-10 print-bg-gray print-padding print-border-gray print-text-sm">
              {observaciones}
            </p>
          </div>
        )}
      </main>
    </div>
  );
});

PrintableGuideContent.displayName = 'PrintableGuideContent';
PatientGuidePreview.displayName = 'PatientGuidePreview';

export default PatientGuidePreview;