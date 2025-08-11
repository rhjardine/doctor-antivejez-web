// src/components/patient-guide/PatientGuide.tsx
'use client';

import { useState } from 'react';
import { PatientWithDetails } from '@/types';
import { GuideCategory, Selections, StandardGuideItem, MetabolicActivatorItem, RevitalizationGuideItem } from '@/types/guide';
import { FaUser, FaCalendar, FaChevronDown, FaChevronUp, FaPlus, FaEye, FaPaperPlane, FaTrash, FaTimes, FaEnvelope, FaMobileAlt } from 'react-icons/fa';
import PatientGuidePreview from './PatientGuidePreview';
import { toast } from 'sonner';

// --- DATOS INICIALES CON LA NUEVA FASE DE REVITALIZACIÓN ---
const initialGuideData: GuideCategory[] = [
  {
    id: 'cat_remocion',
    title: 'Fase de Remoción',
    type: 'standard',
    items: [
      { id: 'rem_1', name: 'Aceite de ricino', dose: '30 CC (adultos) / 15 CC (niños y ancianos) - Una vez en la noche' },
      { id: 'rem_2', name: 'Leche de magnesia', dose: '30 CC (adultos) / 15 CC (niños y ancianos) - Una vez en la noche' },
      { id: 'rem_3', name: 'Sal de higuera o sal de Epson', dose: '30 Grs en 1 litro de agua (adultos) - Una vez en la noche; Evitar en niños y ancianos debilitados' },
    ],
  },
  // --- INICIO: NUEVA CATEGORÍA AÑADIDA ---
  {
    id: 'cat_revitalizacion',
    title: 'Fase de Revitalización',
    type: 'revitalization', // Tipo especial para esta categoría
    items: [
        { 
            id: 'rev_1', 
            name: 'Complejo B + Bioquel',
            // No necesita 'dose' aquí, los campos estarán en la UI
        }
    ],
  },
  // --- FIN: NUEVA CATEGORÍA AÑADIDA ---
  {
    id: 'cat_nutra_primarios',
    title: 'Nutracéuticos Primarios',
    type: 'standard',
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
    type: 'metabolic',
    items: {
      homeopathy: [
        { id: 'am_hom_1', name: 'Cardiovascular' }, { id: 'am_hom_2', name: 'Respiratorio' }, { id: 'am_hom_3', name: 'Digestivo' },
      ],
      bachFlowers: [
        { id: 'am_bach_1', name: 'Agrimonia' }, { id: 'am_bach_2', name: 'Brezo' }, { id: 'am_bach_3', name: 'Aspen' },
      ]
    }
  },
    // ... (resto de categorías sin cambios)
];

export default function PatientGuide({ patient }: { patient: PatientWithDetails }) {
  const [guideData, setGuideData] = useState<GuideCategory[]>(initialGuideData);
  const [selections, setSelections] = useState<Selections>({});
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({ 'cat_remocion': true, 'cat_revitalizacion': true });
  const [newItemInputs, setNewItemInputs] = useState<Record<string, string>>({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const handleSelectionChange = (itemId: string, field: keyof Selections[string], value: any) => {
    setSelections(prev => {
        const newSelections = { ...prev };
        if (!newSelections[itemId]) {
            newSelections[itemId] = {};
        }
        newSelections[itemId][field] = value;
        return newSelections;
    });
  };

  const handleAddNewItem = (categoryId: string, subCategory?: 'homeopathy' | 'bachFlowers') => {
    const inputKey = subCategory ? `${categoryId}-${subCategory}` : categoryId;
    const newItemName = newItemInputs[inputKey];
    if (!newItemName?.trim()) return;

    const newItem = {
      id: `${categoryId}_${Date.now()}`,
      name: newItemName.trim(),
    };

    setGuideData(prevData => prevData.map(cat => {
      if (cat.id === categoryId) {
        const newCat = { ...cat };
        if (subCategory && newCat.type === 'metabolic') {
          (newCat.items as any)[subCategory].push(newItem);
        } else if (newCat.type === 'standard') {
          (newCat.items as StandardGuideItem[]).push(newItem);
        }
        return newCat;
      }
      return cat;
    }));
    setNewItemInputs(prev => ({ ...prev, [inputKey]: '' }));
  };

  const handleDeleteItem = (categoryId: string, itemId: string, subCategory?: 'homeopathy' | 'bachFlowers') => {
      setGuideData(prevData => prevData.map(cat => {
      if (cat.id === categoryId) {
        const newCat = { ...cat, items: JSON.parse(JSON.stringify(cat.items)) }; // Deep copy
        if (subCategory && newCat.type === 'metabolic') {
          (newCat.items as any)[subCategory] = (newCat.items as any)[subCategory].filter((item: any) => item.id !== itemId);
        } else if (newCat.type === 'standard') {
          newCat.items = (newCat.items as StandardGuideItem[]).filter(item => item.id !== itemId);
        }
        return newCat;
      }
      return cat;
    }));
    setSelections(prev => {
      const newSelections = { ...prev };
      delete newSelections[itemId];
      return newSelections;
    });
  };

  const handleSendAction = (action: 'email' | 'app') => {
      toast.info(`Funcionalidad para enviar por ${action} en desarrollo.`);
      setIsSendModalOpen(false);
  };

  const frequencyOptions = ["Mañana", "Noche", "30 min antes de Desayuno", "30 min antes de Cena", "Antes del Ejercicio", "Otros"];
  
  // --- INICIO: RENDERIZADO PARA ITEM DE REVITALIZACIÓN ---
  const renderRevitalizationItem = (item: RevitalizationGuideItem) => (
    <div key={item.id} className="p-3 bg-blue-50 rounded-md transition-all border border-blue-200">
        <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
            <input 
                type="checkbox" 
                id={item.id} 
                checked={selections[item.id]?.selected || false} 
                onChange={(e) => handleSelectionChange(item.id, 'selected', e.target.checked)} 
                className="w-5 h-5 accent-primary"
            />
            <label htmlFor={item.id} className="flex-grow font-semibold text-blue-800">{item.name}</label>
        </div>
        {selections[item.id]?.selected && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pl-9">
                <div className="flex items-center gap-2">
                    <label htmlFor={`${item.id}_complejoB`} className="text-sm font-medium text-gray-700">Complejo B:</label>
                    <input 
                        id={`${item.id}_complejoB`}
                        type="text" 
                        placeholder="cc" 
                        value={selections[item.id]?.complejoB_cc || ''} 
                        onChange={(e) => handleSelectionChange(item.id, 'complejoB_cc', e.target.value)} 
                        className="input text-sm py-1 w-full" 
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor={`${item.id}_bioquel`} className="text-sm font-medium text-gray-700">Bioquel:</label>
                    <input 
                        id={`${item.id}_bioquel`}
                        type="text" 
                        placeholder="cc" 
                        value={selections[item.id]?.bioquel_cc || ''} 
                        onChange={(e) => handleSelectionChange(item.id, 'bioquel_cc', e.target.value)} 
                        className="input text-sm py-1 w-full" 
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor={`${item.id}_frequency`} className="text-sm font-medium text-gray-700">Frecuencia:</label>
                    <input 
                        id={`${item.id}_frequency`}
                        type="text" 
                        placeholder="Ej: 10 dosis" 
                        value={selections[item.id]?.frequency || ''} 
                        onChange={(e) => handleSelectionChange(item.id, 'frequency', e.target.value)} 
                        className="input text-sm py-1 w-full" 
                    />
                </div>
            </div>
        )}
    </div>
  );
  // --- FIN: RENDERIZADO PARA ITEM DE REVITALIZACIÓN ---

  const renderItem = (item: StandardGuideItem | MetabolicActivatorItem, categoryId: string, subCategory?: 'homeopathy' | 'bachFlowers') => (
    <div key={item.id} className="p-3 bg-gray-50 rounded-md transition-all hover:bg-gray-100">
      <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
        <input type="checkbox" id={item.id} checked={selections[item.id]?.selected || false} onChange={(e) => handleSelectionChange(item.id, 'selected', e.target.checked)} className="w-5 h-5 accent-primary"/>
        <label htmlFor={item.id} className="flex-grow font-medium text-gray-800">{item.name}</label>
        {'dose' in item && item.dose && <span className="text-sm text-gray-600 bg-gray-200 px-2 py-1 rounded">{item.dose}</span>}
        <button onClick={() => handleDeleteItem(categoryId, item.id, subCategory)} className="text-gray-400 hover:text-red-500 transition-colors ml-auto"><FaTrash /></button>
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
        <div className="flex items-center gap-4"><FaUser className="text-xl" /><span className="font-semibold">{patient.firstName} {patient.lastName}</span></div>
        <div className="flex items-center gap-4"><FaCalendar className="text-xl" /><input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="bg-white/20 border-none rounded-md p-2 text-sm"/></div>
      </div>

      {guideData.map((category) => (
        <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
          <legend onClick={() => toggleCategory(category.id)} className="w-full flex justify-between items-center p-4 cursor-pointer bg-primary-dark text-white rounded-t-lg">
            <h3 className="font-semibold">{category.title}</h3>
            {openCategories[category.id] ? <FaChevronUp /> : <FaChevronDown />}
          </legend>
          {openCategories[category.id] && (
            <div className="p-4">
              {/* --- INICIO: LÓGICA DE RENDERIZADO POR TIPO --- */}
              {category.type === 'standard' && (
                <div className="space-y-4">
                  {(category.items as StandardGuideItem[]).map(item => renderItem(item, category.id))}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200 mt-4">
                    <input type="text" placeholder="Añadir nuevo ítem..." value={newItemInputs[category.id] || ''} onChange={(e) => setNewItemInputs(prev => ({ ...prev, [category.id]: e.target.value }))} className="input flex-grow" />
                    <button onClick={() => handleAddNewItem(category.id)} className="btn-primary py-2 px-4 flex items-center gap-2 text-sm"><FaPlus /> Añadir</button>
                  </div>
                </div>
              )}
              {category.type === 'revitalization' && (
                  <div className="space-y-4">
                      {(category.items as RevitalizationGuideItem[]).map(item => renderRevitalizationItem(item))}
                      {/* Opcional: Si se quisiera añadir más items de revitalización dinámicamente, aquí iría el formulario */}
                  </div>
              )}
              {category.type === 'metabolic' && (
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Homeopatía</h4>
                    <div className="space-y-3">
                      {(category.items as any).homeopathy.map((item: MetabolicActivatorItem) => renderItem(item, category.id, 'homeopathy'))}
                      <div className="flex items-center gap-2 pt-3 border-t"><input type="text" placeholder="Añadir..." value={newItemInputs[`${category.id}-homeopathy`] || ''} onChange={(e) => setNewItemInputs(prev => ({ ...prev, [`${category.id}-homeopathy`]: e.target.value }))} className="input flex-grow text-sm py-1"/><button onClick={() => handleAddNewItem(category.id, 'homeopathy')} className="btn-primary py-2 px-3 text-sm"><FaPlus /></button></div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Flores de Bach</h4>
                    <div className="space-y-3">
                      {(category.items as any).bachFlowers.map((item: MetabolicActivatorItem) => renderItem(item, category.id, 'bachFlowers'))}
                      <div className="flex items-center gap-2 pt-3 border-t"><input type="text" placeholder="Añadir..." value={newItemInputs[`${category.id}-bachFlowers`] || ''} onChange={(e) => setNewItemInputs(prev => ({ ...prev, [`${category.id}-bachFlowers`]: e.target.value }))} className="input flex-grow text-sm py-1"/><button onClick={() => handleAddNewItem(category.id, 'bachFlowers')} className="btn-primary py-2 px-3 text-sm"><FaPlus /></button></div>
                    </div>
                  </div>
                </div>
              )}
              {/* --- FIN: LÓGICA DE RENDERIZADO POR TIPO --- */}
            </div>
          )}
        </div>
      ))}
      
      <div className="flex justify-end gap-4 mt-8">
        <button onClick={() => setIsPreviewOpen(true)} className="btn-secondary flex items-center gap-2"><FaEye /> Vista Previa</button>
        <button onClick={() => setIsSendModalOpen(true)} className="btn-primary flex items-center gap-2"><FaPaperPlane /> Guardar y Enviar</button>
      </div>

      {isPreviewOpen && <PatientGuidePreview patient={patient} selections={selections} guideData={guideData} onClose={() => setIsPreviewOpen(false)} />}

      {isSendModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center relative animate-slideUp">
            <button onClick={() => setIsSendModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FaTimes size={20}/></button>
            <h3 className="text-xl font-bold text-primary-dark mb-6">Enviar Guía al Paciente</h3>
            <div className="space-y-4">
              <button onClick={() => handleSendAction('email')} className="w-full btn-primary flex items-center justify-center gap-3"><FaEnvelope /> Enviar por Correo Electrónico</button>
              <button onClick={() => handleSendAction('app')} className="w-full btn-secondary flex items-center justify-center gap-3"><FaMobileAlt /> Enviar a la App del Paciente</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
