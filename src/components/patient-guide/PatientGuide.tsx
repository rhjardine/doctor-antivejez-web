'use client';

import { useState } from 'react';
import { PatientWithDetails } from '@/types';
// Importar los tipos centralizados
import { GuideData, Selections, GuideItem, MetabolicActivatorItem } from '@/types/guide'; 
import { FaUser, FaCalendar, FaChevronDown, FaChevronUp, FaPlus, FaEye, FaPaperPlane, FaPrint, FaTrash, FaTimes, FaEnvelope, FaMobileAlt } from 'react-icons/fa';
import PatientGuidePreview from './PatientGuidePreview';
import { toast } from 'sonner';

// --- DATOS INICIALES ---
// Los datos ahora se adhieren estrictamente a los tipos importados.
const initialGuideData: GuideData = {
  "Fase de Remoción": [
    { id: 'rem_1', name: 'Aceite de ricino', dose: '30 CC (adultos) / 15 CC (niños y ancianos) - Una vez en la noche' },
    { id: 'rem_2', name: 'Leche de magnesia', dose: '30 CC (adultos) / 15 CC (niños y ancianos) - Una vez en la noche' },
  ],
  "Activador Metabólico": {
    homeopathy: [
      { id: 'am_hom_1', name: 'Cardiovascular' },
      { id: 'am_hom_2', name: 'Respiratorio' },
      { id: 'am_hom_3', name: 'Digestivo' },
      { id: 'am_hom_4', name: 'Neuro' },
      { id: 'am_hom_5', name: 'Inmune' },
    ],
    bachFlowers: [
      { id: 'am_bach_1', name: 'Agrimonia' },
      { id: 'am_bach_2', name: 'Brezo' },
      { id: 'am_bach_3', name: 'Aspen' },
      { id: 'am_bach_4', name: 'Acebo' },
      { id: 'am_bach_5', name: 'Haya' },
    ]
  },
  "Nutracéuticos Primarios": [
    { id: 'np_1', name: 'MegaGH4 (Fórmula Antienvejecimiento)' },
    { id: 'np_2', name: 'StemCell Enhancer (Revierte la oxidación)' },
  ],
  "Terapias Antienvejecimiento": [
    { id: 'terapia_1', name: 'Autovacuna (Inmunoterapia)' },
    { id: 'terapia_2', name: 'Ozonoterapia (Oxigenación celular)' },
  ]
};

// --- COMPONENTE PRINCIPAL ---
export default function PatientGuide({ patient }: { patient: PatientWithDetails }) {
  const [guideData, setGuideData] = useState<GuideData>(initialGuideData);
  const [selections, setSelections] = useState<Selections>({});
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({ "Fase de Remoción": true });
  const [newItemInputs, setNewItemInputs] = useState<Record<string, string>>({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

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

  const handleAddNewItem = (category: string, subCategory?: 'homeopathy' | 'bachFlowers') => {
    const newItemName = newItemInputs[subCategory ? `${category}-${subCategory}` : category];
    if (!newItemName || newItemName.trim() === '') return;

    const newItem: GuideItem | MetabolicActivatorItem = {
      id: `${category.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`,
      name: newItemName.trim(),
    };

    setGuideData(prev => {
      const newGuideData = JSON.parse(JSON.stringify(prev)); // Deep copy para evitar mutaciones
      if (subCategory) {
        (newGuideData[category] as any)[subCategory].push(newItem);
      } else {
        (newGuideData[category] as GuideItem[]).push(newItem as GuideItem);
      }
      return newGuideData;
    });
    setNewItemInputs(prev => ({ ...prev, [subCategory ? `${category}-${subCategory}` : category]: '' }));
  };
  
  const handleDeleteItem = (category: string, itemId: string, subCategory?: 'homeopathy' | 'bachFlowers') => {
     setGuideData(prev => {
       const newGuideData = JSON.parse(JSON.stringify(prev)); // Deep copy
       if (subCategory) {
         let subCatArray = (newGuideData[category] as any)[subCategory] as GuideItem[];
         (newGuideData[category] as any)[subCategory] = subCatArray.filter(item => item.id !== itemId);
       } else {
         let catArray = newGuideData[category] as GuideItem[];
         newGuideData[category] = catArray.filter(item => item.id !== itemId);
       }
       return newGuideData;
     });
     setSelections(prev => {
       const newSelections = {...prev};
       delete newSelections[itemId];
       return newSelections;
     });
  };

  const handleSendAction = (action: 'email' | 'app') => {
      if (action === 'email') {
          toast.success("Guía enviada por correo electrónico (simulación).");
      } else {
          toast.info("La integración con la App del Paciente estará disponible pronto.");
      }
      setIsSendModalOpen(false);
  }

  const frequencyOptions = ["Mañana", "Noche", "30 min antes de Desayuno", "30 min antes de Cena", "Antes del Ejercicio", "Otros"];

  const renderItem = (item: GuideItem | MetabolicActivatorItem, category: string, subCategory?: 'homeopathy' | 'bachFlowers') => (
    <div key={item.id} className="p-3 bg-gray-50 rounded-md transition-all hover:bg-gray-100">
      <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
        <input
          type="checkbox"
          id={item.id}
          checked={selections[item.id]?.selected || false}
          onChange={(e) => handleSelectionChange(item.id, 'selected', e.target.checked)}
          className="w-5 h-5 accent-primary"
        />
        <label htmlFor={item.id} className="flex-grow font-medium text-gray-800">{item.name}</label>
        {'dose' in item && item.dose && <span className="text-sm text-gray-600 bg-gray-200 px-2 py-1 rounded">{item.dose}</span>}
        <button onClick={() => handleDeleteItem(category, item.id, subCategory)} className="text-gray-400 hover:text-red-500 transition-colors ml-auto">
            <FaTrash />
        </button>
      </div>
      {selections[item.id]?.selected && !('dose' in item) && (
         <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 pl-9">
            <input type="text" placeholder="Cant." value={selections[item.id]?.qty || ''} onChange={(e) => handleSelectionChange(item.id, 'qty', e.target.value)} className="input text-sm py-1" />
            <select value={selections[item.id]?.freq || ''} onChange={(e) => handleSelectionChange(item.id, 'freq', e.target.value)} className="input text-sm py-1">
               <option value="">Frecuencia...</option>
               {frequencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <input type="text" placeholder="Suplemento personalizado" value={selections[item.id]?.custom || ''} onChange={(e) => handleSelectionChange(item.id, 'custom', e.target.value)} className="input text-sm py-1" />
         </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-primary text-white p-4 rounded-lg flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <FaUser className="text-xl" />
          <span className="font-semibold">{patient.firstName} {patient.lastName}</span>
        </div>
        <div className="flex items-center gap-4">
          <FaCalendar className="text-xl" />
          <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="bg-white/20 border-none rounded-md p-2 text-sm"/>
        </div>
      </div>

      {Object.entries(guideData).map(([category, content]) => (
        <div key={category} className="bg-white rounded-lg shadow-sm border border-gray-200">
          <legend onClick={() => toggleCategory(category)} className="w-full flex justify-between items-center p-4 cursor-pointer bg-primary-dark text-white rounded-t-lg">
            <h3 className="font-semibold">{category}</h3>
            {openCategories[category] ? <FaChevronUp /> : <FaChevronDown />}
          </legend>
          {openCategories[category] && (
            <div className="p-4">
              {Array.isArray(content) ? (
                <div className="space-y-4">
                  {content.map(item => renderItem(item, category))}
                   <div className="flex items-center gap-2 pt-4 border-t border-gray-200 mt-4">
                      <input type="text" placeholder="Añadir nuevo ítem..." value={newItemInputs[category] || ''} onChange={(e) => setNewItemInputs(prev => ({ ...prev, [category]: e.target.value }))} className="input flex-grow" />
                      <button onClick={() => handleAddNewItem(category)} className="btn-primary py-2 px-4 flex items-center gap-2 text-sm"><FaPlus /> Añadir</button>
                   </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Homeopatía</h4>
                    <div className="space-y-3">
                      {content.homeopathy.map(item => renderItem(item, category, 'homeopathy'))}
                      <div className="flex items-center gap-2 pt-3 border-t">
                        <input type="text" placeholder="Añadir homeopatía..." value={newItemInputs[`${category}-homeopathy`] || ''} onChange={(e) => setNewItemInputs(prev => ({ ...prev, [`${category}-homeopathy`]: e.target.value }))} className="input flex-grow text-sm py-1"/>
                        <button onClick={() => handleAddNewItem(category, 'homeopathy')} className="btn-primary py-2 px-3 text-sm"><FaPlus /></button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Flores de Bach</h4>
                    <div className="space-y-3">
                      {content.bachFlowers.map(item => renderItem(item, category, 'bachFlowers'))}
                       <div className="flex items-center gap-2 pt-3 border-t">
                        <input type="text" placeholder="Añadir flor de Bach..." value={newItemInputs[`${category}-bachFlowers`] || ''} onChange={(e) => setNewItemInputs(prev => ({ ...prev, [`${category}-bachFlowers`]: e.target.value }))} className="input flex-grow text-sm py-1"/>
                        <button onClick={() => handleAddNewItem(category, 'bachFlowers')} className="btn-primary py-2 px-3 text-sm"><FaPlus /></button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      
      <div className="flex justify-end gap-4 mt-8">
         <button onClick={() => setIsPreviewOpen(true)} className="btn-secondary flex items-center gap-2">
            <FaEye /> Vista Previa
         </button>
         <button onClick={() => setIsSendModalOpen(true)} className="btn-primary flex items-center gap-2">
            <FaPaperPlane /> Guardar y Enviar
         </button>
      </div>

      {isPreviewOpen && <PatientGuidePreview patient={patient} selections={selections} guideData={guideData} onClose={() => setIsPreviewOpen(false)} />}

      {isSendModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center relative animate-slideUp">
                <button onClick={() => setIsSendModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FaTimes size={20}/></button>
                <h3 className="text-xl font-bold text-primary-dark mb-6">Enviar Guía al Paciente</h3>
                <div className="space-y-4">
                    <button onClick={() => handleSendAction('email')} className="w-full btn-primary flex items-center justify-center gap-3">
                        <FaEnvelope /> Enviar por Correo Electrónico
                    </button>
                    <button onClick={() => handleSendAction('app')} className="w-full btn-secondary flex items-center justify-center gap-3">
                        <FaMobileAlt /> Enviar a la App del Paciente
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
