'use client';

import { useState } from 'react';
import { PatientWithDetails } from '@/types';
import { FaUser, FaCalendar, FaChevronDown, FaChevronUp, FaPlus, FaEye, FaPaperPlane, FaPrint } from 'react-icons/fa';
import PatientGuidePreview from './PatientGuidePreview';

// Estructura de datos inicial para la guía. Idealmente, esto vendría de la base de datos.
const initialGuideData = {
  "Fase de Remoción": [
    { id: 'rem_1', name: 'Aceite de ricino', dose: '30 CC (adultos) / 15 CC (niños y ancianos) - Una vez en la noche' },
    { id: 'rem_2', name: 'Leche de magnesia', dose: '30 CC (adultos) / 15 CC (niños y ancianos) - Una vez en la noche' },
    { id: 'rem_3', name: 'Sal de higuera o sal de Epson', dose: '30 Grs en 1 litro de agua (adultos) - Una vez en la noche; Evitar en niños y ancianos debilitados' },
  ],
  "Nutracéuticos Primarios": [
    { id: 'np_1', name: 'MegaGH4 (Fórmula Antienvejecimiento)' },
    { id: 'np_2', name: 'StemCell Enhancer (Revierte la oxidación)' },
    { id: 'np_3', name: 'Transfer Tri Factor (Modulador celular)' },
    { id: 'np_4', name: 'Telomeros (Activador de la Telomerasa)' },
  ],
  "Activador Metabólico": [
    { id: 'am_1', name: 'Bioterápico + Bach (gotas, veces al día debajo de la lengua)' },
  ],
  "Nutracéuticos Secundarios": [
    { id: 'ns_1', name: 'Digestivo (Gases / Estreñimiento)' },
    { id: 'ns_2', name: 'Femenino (Precursor hormonal mujer)' },
    { id: 'ns_3', name: 'Osteo Articular (Regenerador Articular)' },
  ],
  "Cosmecéuticos": [],
  "Fórmulas Naturales": [],
  "Sueros - Shot Antivejez": [
    { id: 'suero_1', name: 'Antianémico' },
    { id: 'suero_2', name: 'Pro Vital o Antienvejecimiento' },
  ],
  "Terapias Antienvejecimiento": [
    { id: 'terapia_1', name: 'Autovacuna (Inmunoterapia)' },
    { id: 'terapia_2', name: 'Ozonoterapia (Oxigenación celular)' },
  ]
};

type GuideItem = { id: string; name: string; dose?: string; };
type GuideData = Record<string, GuideItem[]>;
type Selections = Record<string, { selected: boolean; qty?: string; freq?: string; custom?: string; }>;

export default function PatientGuide({ patient }: { patient: PatientWithDetails }) {
  const [guideData, setGuideData] = useState<GuideData>(initialGuideData);
  const [selections, setSelections] = useState<Selections>({});
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    "Fase de Remoción": true,
    "Nutracéuticos Primarios": true,
  });
  const [newItemInputs, setNewItemInputs] = useState<Record<string, string>>({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleSelectionChange = (itemId: string, field: keyof Selections[string], value: any) => {
    setSelections(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const handleAddNewItem = (category: string) => {
    const newItemName = newItemInputs[category];
    if (!newItemName || newItemName.trim() === '') {
      return;
    }
    const newItem: GuideItem = {
      id: `${category.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`,
      name: newItemName.trim(),
    };
    setGuideData(prev => ({
      ...prev,
      [category]: [...prev[category], newItem],
    }));
    setNewItemInputs(prev => ({ ...prev, [category]: '' }));
  };
  
  const frequencyOptions = [
    "Mañana", "Noche", "30 min antes de Desayuno", "30 min antes de Cena",
    "30 min antes Desayuno y Cena", "Antes del Ejercicio", "Después del Ejercicio", "Otros"
  ];

  return (
    <div className="space-y-6">
      <div className="bg-primary text-white p-4 rounded-lg flex justify-between items-center">
        <div className="flex items-center gap-4">
          <FaUser className="text-xl" />
          <span className="font-semibold">{patient.firstName} {patient.lastName}</span>
        </div>
        <div className="flex items-center gap-4">
          <FaCalendar className="text-xl" />
          <input
            type="date"
            defaultValue={new Date().toISOString().split('T')[0]}
            className="bg-white/20 border-none rounded-md p-2 text-sm"
          />
        </div>
      </div>

      {Object.entries(guideData).map(([category, items]) => (
        <div key={category} className="bg-white rounded-lg shadow-sm border border-gray-200">
          <legend
            onClick={() => toggleCategory(category)}
            className="w-full flex justify-between items-center p-4 cursor-pointer bg-primary-dark text-white rounded-t-lg"
          >
            <h3 className="font-semibold">{category}</h3>
            {openCategories[category] ? <FaChevronUp /> : <FaChevronDown />}
          </legend>
          {openCategories[category] && (
            <div className="p-4 space-y-4">
              {items.map(item => (
                <div key={item.id} className="p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center flex-wrap gap-4">
                    <input
                      type="checkbox"
                      id={item.id}
                      checked={selections[item.id]?.selected || false}
                      onChange={(e) => handleSelectionChange(item.id, 'selected', e.target.checked)}
                      className="w-5 h-5 accent-primary"
                    />
                    <label htmlFor={item.id} className="flex-grow font-medium text-gray-800">{item.name}</label>
                    {item.dose && <span className="text-sm text-gray-600 bg-gray-200 px-2 py-1 rounded">{item.dose}</span>}
                  </div>
                  {selections[item.id]?.selected && !item.dose && (
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 pl-7">
                        <input
                           type="text"
                           placeholder="Cant."
                           value={selections[item.id]?.qty || ''}
                           onChange={(e) => handleSelectionChange(item.id, 'qty', e.target.value)}
                           className="input text-sm"
                        />
                        <select
                           value={selections[item.id]?.freq || ''}
                           onChange={(e) => handleSelectionChange(item.id, 'freq', e.target.value)}
                           className="input text-sm"
                        >
                           <option value="">Seleccione frecuencia...</option>
                           {frequencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <input
                           type="text"
                           placeholder="Suplemento personalizado"
                           value={selections[item.id]?.custom || ''}
                           onChange={(e) => handleSelectionChange(item.id, 'custom', e.target.value)}
                           className="input text-sm"
                        />
                     </div>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                <input
                  type="text"
                  placeholder="Nombre del nuevo ítem"
                  value={newItemInputs[category] || ''}
                  onChange={(e) => setNewItemInputs(prev => ({ ...prev, [category]: e.target.value }))}
                  className="input flex-grow"
                />
                <button
                  onClick={() => handleAddNewItem(category)}
                  className="btn-primary py-2 px-4 flex items-center gap-2 text-sm"
                >
                  <FaPlus /> Añadir
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      
      <div className="flex justify-end gap-4 mt-8">
         <button onClick={() => setIsPreviewOpen(true)} className="btn-secondary flex items-center gap-2">
            <FaEye /> Vista Previa
         </button>
         <button className="btn-primary flex items-center gap-2">
            <FaPaperPlane /> Guardar y Enviar
         </button>
      </div>

      {isPreviewOpen && (
         <PatientGuidePreview
            patient={patient}
            selections={selections}
            guideData={guideData}
            onClose={() => setIsPreviewOpen(false)}
         />
      )}
    </div>
  );
}
