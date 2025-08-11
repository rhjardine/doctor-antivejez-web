// src/components/patient-guide/PatientGuide.tsx
'use client';

import { useForm, useWatch } from 'react-hook-form';
import { useState } from 'react';
import { PatientWithDetails } from '@/types';
import {
  GuideCategory,
  GuideFormValues,
  StandardGuideItem,
  RevitalizationGuideItem,
  MetabolicActivator,
  MetabolicSubItem,
  GuideItemType,
} from '@/types/guide';
import {
  FaUser,
  FaCalendar,
  FaChevronDown,
  FaChevronUp,
  FaPlus,
  FaEye,
  FaPaperPlane,
  FaTrash,
  FaTimes,
  FaEnvelope,
  FaMobileAlt,
} from 'react-icons/fa';
import PatientGuidePreview from './PatientGuidePreview';
import { toast } from 'sonner';

// Datos iniciales de la guía. Podrían venir de una base de datos en el futuro.
const initialGuideData: GuideCategory[] = [
    {
    id: 'cat_remocion',
    title: 'Fase de Remoción',
    type: GuideItemType.STANDARD,
    items: [
      { id: 'rem_1', name: 'Aceite de ricino', dose: '03 Cucharadas (adultos) - Una vez en la noche' },
      { id: 'rem_2', name: 'Leche de magnesia', dose: '06 Cucharadas (adultos) - Una vez en la noche' },
      { id: 'rem_3', name: 'Sal de higuera o sal de Epson', dose: '30 Grs en 1 litro de agua (adultos) - Una vez en la noche; Evitar en niños y ancianos debilitados' },
    ],
  },
  {
    id: 'cat_revitalizacion',
    title: 'Fase de Revitalización',
    type: GuideItemType.REVITALIZATION,
    items: [
        { id: 'rev_1', name: 'Complejo B + Bioquel' }
    ],
  },
  {
    id: 'cat_nutra_primarios',
    title: 'Nutracéuticos Primarios',
    type: GuideItemType.STANDARD,
    items: [
      { id: 'np_1', name: 'MegaGH4 (Fórmula Antienvejecimiento)' },
      { id: 'np_2', name: 'StemCell Enhancer (Revierte la oxidación)' },
      { id: 'np_3', name: 'Transfer Tri Factor (Modulador celular)' },
      { id: 'np_4', name: 'Telomeros (Activador de la Telomerasa)' },
    ]
  },
  {
    id: 'cat_activador',
    title: 'Activador Metabólico',
    type: GuideItemType.METABOLIC,
    items: [{
      id: 'cat_activador',
      homeopathy: [
        { id: 'am_hom_1', name: 'Cardiovascular' }, { id: 'am_hom_2', name: 'Respiratorio' }, { id: 'am_hom_3', name: 'Digestivo' },
      ],
      bachFlowers: [
        { id: 'am_bach_1', name: 'Agrimonia' }, { id: 'am_bach_2', name: 'Brezo' }, { id: 'am_bach_3', name: 'Aspen' },
      ]
    }]
  },
];

export default function PatientGuide({ patient }: { patient: PatientWithDetails }) {
  const [guideData, setGuideData] = useState<GuideCategory[]>(initialGuideData);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    cat_remocion: true,
    cat_revitalizacion: true,
  });
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { register, handleSubmit, control, getValues, setValue } = useForm<GuideFormValues>({
    defaultValues: {
      guideDate: new Date().toISOString().split('T')[0],
      selections: {},
      metabolic_activator: { homeopathy: {}, bachFlowers: {} },
    },
  });

  const selections = useWatch({ control, name: 'selections' });
  const metabolicSelections = useWatch({ control, name: 'metabolic_activator' });

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const onSubmit = (data: GuideFormValues) => {
    console.log('Datos de la guía para guardar:', data);
    toast.success('Guía guardada (simulación). Revisa la consola para ver los datos.');
    // Aquí iría la llamada a la server action para guardar en la BD
    // await savePatientGuide(patient.id, data);
  };

  const frequencyOptions = ["Mañana", "Noche", "30 min antes de Desayuno", "30 min antes de Cena", "Antes del Ejercicio", "Otros"];

  // Componente unificado para renderizar cada ítem de la guía
  const renderItem = (item: any, category: GuideCategory) => {
    const isSelected = selections?.[item.id]?.selected;

    switch (category.type) {
      case GuideItemType.REVITALIZATION:
        return (
          <div key={item.id} className="p-3 bg-blue-50/80 rounded-md border border-blue-200 space-y-3">
            <div className="flex items-center gap-4">
              <input type="checkbox" {...register(`selections.${item.id}.selected`)} className="w-5 h-5 accent-primary" />
              <label className="font-semibold text-blue-800">{item.name}</label>
            </div>
            {isSelected && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pl-9">
                <input {...register(`selections.${item.id}.complejoB_cc`)} placeholder="Complejo B (cc)" className="input text-sm py-1" />
                <input {...register(`selections.${item.id}.bioquel_cc`)} placeholder="Bioquel (cc)" className="input text-sm py-1" />
                <input {...register(`selections.${item.id}.frequency`)} placeholder="Frecuencia (ej: 10 dosis)" className="input text-sm py-1" />
              </div>
            )}
          </div>
        );

      case GuideItemType.STANDARD:
      default:
        return (
          <div key={item.id} className="p-3 bg-gray-50 rounded-md hover:bg-gray-100">
            <div className="flex items-center gap-4">
              <input type="checkbox" {...register(`selections.${item.id}.selected`)} className="w-5 h-5 accent-primary" />
              <label className="flex-grow font-medium text-gray-800">{item.name}</label>
              {item.dose && <span className="text-sm text-gray-600 bg-gray-200 px-2 py-1 rounded">{item.dose}</span>}
            </div>
            {isSelected && !item.dose && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 pl-9">
                <input {...register(`selections.${item.id}.qty`)} placeholder="Cant." className="input text-sm py-1" />
                <select {...register(`selections.${item.id}.freq`)} className="input text-sm py-1">
                  <option value="">Frecuencia...</option>
                  {frequencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <input {...register(`selections.${item.id}.custom`)} placeholder="Detalle personalizado" className="input text-sm py-1" />
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-primary text-white p-4 rounded-lg flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4"><FaUser className="text-xl" /><span className="font-semibold">{patient.firstName} {patient.lastName}</span></div>
        <div className="flex items-center gap-4"><FaCalendar className="text-xl" /><input type="date" {...register('guideDate')} className="bg-white/20 border-none rounded-md p-2 text-sm"/></div>
      </div>

      {guideData.map((category) => (
        <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
          <header onClick={() => toggleCategory(category.id)} className="w-full flex justify-between items-center p-4 cursor-pointer bg-primary-dark text-white rounded-t-lg">
            <h3 className="font-semibold">{category.title}</h3>
            {openCategories[category.id] ? <FaChevronUp /> : <FaChevronDown />}
          </header>
          {openCategories[category.id] && (
            <div className="p-4 space-y-4">
              {category.type !== GuideItemType.METABOLIC
                ? category.items.map(item => renderItem(item, category))
                : (
                  <div className="grid md:grid-cols-2 gap-8">
                    {(category.items[0] as MetabolicActivator).homeopathy.map(subItem => (
                       <div key={subItem.id} className="flex items-center gap-4 p-2 bg-gray-50 rounded-md">
                         <input type="checkbox" {...register(`metabolic_activator.homeopathy.${subItem.id}.selected`)} className="w-5 h-5 accent-primary" />
                         <label className="font-medium text-gray-800">{subItem.name}</label>
                       </div>
                    ))}
                     {(category.items[0] as MetabolicActivator).bachFlowers.map(subItem => (
                       <div key={subItem.id} className="flex items-center gap-4 p-2 bg-gray-50 rounded-md">
                         <input type="checkbox" {...register(`metabolic_activator.bachFlowers.${subItem.id}.selected`)} className="w-5 h-5 accent-primary" />
                         <label className="font-medium text-gray-800">{subItem.name}</label>
                       </div>
                    ))}
                  </div>
                )
              }
            </div>
          )}
        </div>
      ))}
      
      <div className="flex justify-end gap-4 mt-8">
        <button type="button" onClick={() => setIsPreviewOpen(true)} className="btn-secondary flex items-center gap-2"><FaEye /> Vista Previa</button>
        <button type="submit" className="btn-primary flex items-center gap-2"><FaPaperPlane /> Guardar Guía</button>
      </div>

      {isPreviewOpen && <PatientGuidePreview patient={patient} guideData={guideData} formValues={getValues()} onClose={() => setIsPreviewOpen(false)} />}
    </form>
  );
}
