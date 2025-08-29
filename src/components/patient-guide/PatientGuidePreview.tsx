'use client';

import React, { useRef } from 'react';
import ReactToPrint from 'react-to-print';
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
  guideData: any; // Extendido con foodItems, etc.
  formValues: GuideFormValues;
  onClose: () => void;
}

const GuideListItem = ({ name, details }: { name: string, details?: string | null }) => (
  <li className="text-gray-800 break-inside-avoid flex items-start">
    <span className="text-primary mr-3 mt-1">&#8226;</span>
    <div>
      <span className="font-semibold">{name}</span>
      {details && <span className="text-gray-600 block text-sm">{details}</span>}
    </div>
  </li>
);

const CategoryTitle = ({ title, icon }: { title: string, icon: React.ReactNode }) => (
  <div className="flex items-center gap-3 border-b-2 border-gray-200 pb-2 mb-4">
    <div className="text-primary text-2xl">{icon}</div>
    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
  </div>
);

export default function PatientGuidePreview({ patient, guideData, formValues, onClose }: Props) {
  const componentRef = useRef<HTMLDivElement>(null);

  const { selections, observaciones, foodSelections } = formValues;

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

  const selectedBach = bachFlowersList.filter(item => selections[item.id]?.selected);
  const selectedHomeopathy = []; // Lógica para extraer de homeopathicStructure

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn no-print">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Vista Previa de la Guía</h2>
          <div className="flex items-center gap-4">
            <ReactToPrint
              trigger={() => (
                <button className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
                  <FaPrint /> Imprimir / Guardar PDF
                </button>
              )}
              content={() => componentRef.current}
              documentTitle={`Guia_${patient.firstName}_${patient.lastName}`}
              pageStyle="@page { size: A4; margin: 20mm; } @media print { body { -webkit-print-color-adjust: exact; } }"
            />
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
              <FaTimes />
            </button>
          </div>
        </div>

        <style jsx global>{`
          @media print {
            @page { size: A4; margin: 20mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .no-print, .fixed, .absolute, .bg-black\/60 { display: none !important; }
            #printable-guide { display: block !important; position: relative !important; width: 100% !important; height: auto !important; overflow: visible !important; background: white !important; padding: 0 !important; margin: 0 !important; }
          }
        `}</style>

        <div ref={componentRef} id="printable-guide" className="p-8 lg:p-12 overflow-y-auto bg-white">
          <header className="flex justify-between items-start mb-10 border-b-2 border-primary pb-6">
            <div className="w-40">
              <Image src="/images/logo.png" alt="Logo Doctor Antivejez" width={160} height={40} priority />
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-bold">Guía de Tratamiento</h1>
              <p className="text-xl text-gray-600">Personalizada</p>
            </div>
          </header>

          <section className="grid grid-cols-2 mb-8">
            <div>
              <h2 className="font-bold uppercase text-gray-700">Paciente</h2>
              <p className="text-2xl font-semibold">{patient.firstName} {patient.lastName}</p>
            </div>
            <div className="text-right">
              <h2 className="font-bold uppercase text-gray-700">Fecha de Emisión</h2>
              <p className="text-2xl font-semibold">{new Date(formValues.guideDate).toLocaleDateString('es-ES')}</p>
            </div>
          </section>

          <main className="space-y-10">
            {guideData.categories.map((category: GuideCategory) => {
              const selectedItems = category.items.filter((item: any) => selections[item.id]?.selected);
              if (selectedItems.length === 0) return null;

              return (
                <div key={category.id} className="break-inside-avoid">
                  <CategoryTitle title={category.title} icon={getCategoryIcon(category.id)} />
                  <ul className="list-none space-y-4 pl-10">
                    {selectedItems.map((item: any) => {
                      const details = selections[item.id];
                      let treatmentDetails: string | null = null;

                      // Lógica para details por tipo (standard, revitalization, etc.)
                      if (category.type === 'STANDARD') {
                        const std = details as StandardFormItem;
                        treatmentDetails = [std.qty, std.doseType, std.freq, std.custom].filter(Boolean).join(' - ');
                      } // Añade casos para otros tipos

                      return <GuideListItem key={item.id} name={item.name} details={treatmentDetails} />;
                    })}
                  </ul>
                </div>
              );
            })}

            {/* Sección Alimentación */}
            <div className="break-inside-avoid">
              <CategoryTitle title="Alimentación" icon={<FaLeaf />} />
              {['DESAYUNO', 'ALMUERZO', 'CENA', 'MERIENDAS_POSTRES'].map(meal => (
                <div key={meal}>
                  <h4 className="font-semibold text-primary-dark mt-4 mb-2 pl-10">{meal}</h4>
                  <ul className="list-none space-y-1 pl-14 columns-2 md:columns-3 text-sm">
                    {foodSelections?.map(id => {
                      const item = guideData.foodItems.find((f: any) => f.id === id && f.mealType === meal);
                      if (item) return <GuideListItem key={item.id} name={item.name} />;
                    })}
                  </ul>
                </div>
              ))}
            </div>

            {/* Claves y Guía General */}
            <div className="break-inside-avoid">
              <CategoryTitle title="Claves de Longevidad" icon={<FaDna />} />
              <ul className="list-none space-y-4 pl-10">
                {guideData.wellnessKeys.map((key: any) => <GuideListItem key={key.id} name={key.title} details={key.description} />)}
              </ul>
            </div>

            <div className="break-inside-avoid">
              <CategoryTitle title="Recetas y Guía General" icon={<FaStethoscope />} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4>Evitar</h4>
                  <ul>{guideData.generalGuides.filter((g: any) => g.type === 'AVOID').map((g: any) => <li key={g.id}>{g.text}</li>)}</ul>
                </div>
                <div>
                  <h4>Sustituir</h4>
                  <ul>{guideData.generalGuides.filter((g: any) => g.type === 'SUBSTITUTE').map((g: any) => <li key={g.id}>{g.text}</li>)}</ul>
                </div>
              </div>
            </div>

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