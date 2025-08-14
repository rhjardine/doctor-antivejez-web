'use client';

import { useState } from 'react';
import { PatientWithDetails } from '@/types';
import { GuideCategory, Selections, StandardGuideItem, MetabolicActivatorItem, RevitalizationGuideItem, GuideItemType } from '@/types/guide';
import { FaUser, FaCalendar, FaChevronDown, FaChevronUp, FaPlus, FaEye, FaPaperPlane, FaTrash, FaTimes, FaEnvelope, FaMobileAlt } from 'react-icons/fa';
import PatientGuidePreview from './PatientGuidePreview';
import { toast } from 'sonner';

// --- DATOS INICIALES CORREGIDOS ---
const initialGuideData: GuideCategory[] = [
  {
    id: 'cat_remocion',
    title: 'Fase de Remoción',
    type: 'STANDARD',
    items: [
      { id: 'rem_1', name: 'Aceite de ricino', dose: '03 Cucharadas (adultos) - Una vez en la noche' },
      { id: 'rem_2', name: 'Leche de magnesia', dose: '06 Cucharadas (adultos) - Una vez en la noche' },
      { id: 'rem_3', name: 'Otro(s)', dose: '30 Grs en 1 litro de agua (adultos) - Una vez en la noche; Evitar en niños y ancianos debilitados' },
    ],
  },
  {
    id: 'cat_revitalizacion',
    title: 'Fase de Revitalización',
    type: 'REVITALIZATION',
    items: [
        { 
            id: 'rev_1', 
            name: 'Complejo B + Bioquel',
        }
    ],
  },
  {
    id: 'cat_nutra_primarios',
    title: 'Nutracéuticos Primarios',
    type: 'STANDARD',
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
    type: 'METABOLIC',
    items: [
      {
        id: 'cat_activador',
        homeopathy: [
          { id: 'am_hom_1', name: 'Cardiovascular' }, { id: 'am_hom_2', name: 'Respiratorio' }, { id: 'am_hom_3', name: 'Digestivo' },
          { id: 'am_hom_4', name: 'Neuro' }, { id: 'am_hom_5', name: 'Inmune' }, { id: 'am_hom_6', name: 'Inflamación' },
          { id: 'am_hom_7', name: 'Glicólisis(m)' }, { id: 'am_hom_8', name: 'Ciclo Krebs(t)' }, { id: 'am_hom_9', name: 'Cadena Resp(n)' },
        ],
        bachFlowers: [
          { id: 'am_bach_1', name: 'Agrimonia' }, { id: 'am_bach_2', name: 'Brezo' }, { id: 'am_bach_3', name: 'Aspen' },
          { id: 'am_bach_4', name: 'Acebo' }, { id: 'am_bach_5', name: 'Haya' }, { id: 'am_bach_6', name: 'Madreselva' },
          { id: 'am_bach_7', name: 'Estrella de Belén' }, { id: 'am_bach_8', name: 'Centaura' }, { id: 'am_bach_9', name: 'Carpe' },
        ]
      }
    ]
  },
  {
    id: 'cat_nutra_secundarios',
    title: 'Nutracéuticos Secundarios',
    type: 'STANDARD',
    items: [
        { id: 'ns_1', name: 'Digestivo (Gases / Estreñimiento)' },
        { id: 'ns_2', name: 'Femenino (Precursor hormonal mujer)' },
        { id: 'ns_3', name: 'Osteo Articular (Regenerador Articular)' },
        { id: 'ns_4', name: 'Inmune Booster (Estimula las defensas)' },
        { id: 'ns_5', name: 'Inmune Modulador (Regulador Inflamatorio)' },
        { id: 'ns_6', name: 'Masculino (Precursor hormonal masc)' },
        { id: 'ns_7', name: 'Neuro Central (Regenerador Cerebral)' },
        { id: 'ns_8', name: 'Neuro Emocional (Restaurador Emocional)' },
        { id: 'ns_9', name: 'Próstata (Regenerador prostático)' },
    ]
  },
  {
    id: 'cat_nutra_complementarios',
    title: 'Nutracéuticos Complementarios',
    type: 'STANDARD',
    items: [
        { id: 'nc_1', name: 'Aloe Vera' },
        { id: 'nc_2', name: 'Antioxidante (Revierte la oxidación)' },
        { id: 'nc_3', name: 'Colágeno' },
        { id: 'nc_4', name: 'Energy' },
        { id: 'nc_5', name: 'Immune Spray' },
        { id: 'nc_6', name: 'Magnesio Quelatado' },
        { id: 'nc_7', name: 'Vit C c/Zinc' },
        { id: 'nc_8', name: 'Vit E c/Selenio' },
        { id: 'nc_9', name: 'Zinc Quelatado' },
    ]
  },
  {
    id: 'cat_sueros',
    title: 'Sueros - Shot Antivejez',
    type: 'STANDARD',
    items: [
        { id: 'suero_1', name: 'Antianémico' },
        { id: 'suero_2', name: 'Pro Vital o Antienvejecimiento' },
        { id: 'suero_3', name: 'Antiviral c/Ozono' },
        { id: 'suero_4', name: 'Bioxigenación' },
        { id: 'suero_5', name: 'CardioVascular' },
        { id: 'suero_6', name: 'Energizante' },
        { id: 'suero_7', name: 'Inmuno Estimulante' },
        { id: 'suero_8', name: 'Inmuno Modular' },
        { id: 'suero_9', name: 'Mega Vitamina C' },
        { id: 'suero_10', name: 'Metabólico' },
        { id: 'suero_11', name: 'Osteo Articular' },
        { id: 'suero_12', name: 'Ozono' },
        { id: 'suero_13', name: 'Pre Natal' },
        { id: 'suero_14', name: 'Quelación' },
    ]
  },
  {
    id: 'cat_terapias',
    title: 'Terapias Antienvejecimiento',
    type: 'STANDARD',
    items: [
      { id: 'terapia_1', name: 'Autovacuna (Inmunoterapia)' },
      { id: 'terapia_2', name: 'Ozonoterapia (Oxigenación celular)' },
    ]
  }
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

  // ===== INICIO DE LA CORRECCIÓN =====
  // Se ha hecho el tipo del parámetro 'field' más flexible.
  // Ahora acepta cualquier clave (key) de los posibles tipos de item en Selections.
  const handleSelectionChange = (itemId: string, field: keyof Selections[string], value: any) => {
  // ===== FIN DE LA CORRECCIÓN =====
    setSelections(prev => {
        const newSelections = { ...prev };
        if (!newSelections[itemId]) {
            newSelections[itemId] = {};
        }
        (newSelections[itemId] as any)[field] = value;
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
        const newCat = { ...cat, items: JSON.parse(JSON.stringify(cat.items)) }; // Deep copy
        if (subCategory && newCat.type === 'METABOLIC') {
            const activator = newCat.items[0] as any;
            activator[subCategory].push(newItem);
        } else if (newCat.type === 'STANDARD') {
          (newCat.items as StandardGuideItem[]).push(newItem as StandardGuideItem);
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
        const newCat = { ...cat, items: JSON.parse(JSON.stringify(cat.items)) };
        if (subCategory && newCat.type === 'METABOLIC') {
          const activator = newCat.items[0] as any;
          activator[subCategory] = activator[subCategory].filter((item: any) => item.id !== itemId);
        } else if (newCat.type === 'STANDARD') {
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
                        value={(selections[item.id] as any)?.complejoB_cc || ''} 
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
                        value={(selections[item.id] as any)?.bioquel_cc || ''} 
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
                        value={(selections[item.id] as any)?.frequency || ''} 
                        onChange={(e) => handleSelectionChange(item.id, 'frequency', e.target.value)} 
                        className="input text-sm py-1 w-full" 
                    />
                </div>
            </div>
        )}
    </div>
  );

  const renderItem = (item: StandardGuideItem | MetabolicActivatorItem, categoryId: string, subCategory?: 'homeopathy' | 'bachFlowers') => (
    <div key={item.id} className="p-3 bg-gray-50 rounded-md transition-all hover:bg-gray-100">
      <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
        <input type="checkbox" id={item.id} checked={selections[item.id]?.selected || false} onChange={(e) => handleSelectionChange(item.id, 'selected', e.target.checked)} className="w-5 h-5 accent-primary"/>
        <label htmlFor={item.id} className="flex-grow font-medium text-gray-800">{item.name}</label>
        {'dose' in item && item.dose && <span className="text-sm text-gray-600 bg-gray-200 px-2 py-1 rounded">{item.dose}</span>}
        <button type="button" onClick={() => handleDeleteItem(categoryId, item.id, subCategory)} className="text-gray-400 hover:text-red-500 transition-colors ml-auto"><FaTrash /></button>
      </div>
      {selections[item.id]?.selected && !('dose' in item) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 pl-9">
          <input type="text" placeholder="Cant." value={(selections[item.id] as any)?.qty || ''} onChange={(e) => handleSelectionChange(item.id, 'qty', e.target.value)} className="input text-sm py-1" />
          <select value={(selections[item.id] as any)?.freq || ''} onChange={(e) => handleSelectionChange(item.id, 'freq', e.target.value)} className="input text-sm py-1">
            <option value="">Frecuencia...</option>
            {frequencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <input type="text" placeholder="Suplemento personalizado" value={(selections[item.id] as any)?.custom || ''} onChange={(e) => handleSelectionChange(item.id, 'custom', e.target.value)} className="input text-sm py-1" />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-primary text-white p-4 rounded-lg flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4"><FaUser className="text-xl" /><span className="font-semibold">{patient.firstName} {patient.lastName}</span></div>
        <div className="flex items-center gap-4"><FaCalendar className="text-xl" /><input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="bg-white/20 border-none rounded-md p-2 text-sm text-black"/></div>
      </div>

      {guideData.map((category) => (
        <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div onClick={() => toggleCategory(category.id)} className="w-full flex justify-between items-center p-4 cursor-pointer bg-primary-dark text-white rounded-t-lg">
            <h3 className="font-semibold">{category.title}</h3>
            {openCategories[category.id] ? <FaChevronUp /> : <FaChevronDown />}
          </div>
          {openCategories[category.id] && (
            <div className="p-4">
              {category.type === 'STANDARD' && (
                <div className="space-y-4">
                  {(category.items as StandardGuideItem[]).map(item => renderItem(item, category.id))}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200 mt-4">
                    <input type="text" placeholder="Añadir nuevo ítem..." value={newItemInputs[category.id] || ''} onChange={(e) => setNewItemInputs(prev => ({ ...prev, [category.id]: e.target.value }))} className="input flex-grow" />
                    <button type="button" onClick={() => handleAddNewItem(category.id)} className="btn-primary py-2 px-4 flex items-center gap-2 text-sm"><FaPlus /> Añadir</button>
                  </div>
                </div>
              )}
              {category.type === 'REVITALIZATION' && (
                  <div className="space-y-4">
                      {(category.items as RevitalizationGuideItem[]).map(item => renderRevitalizationItem(item))}
                  </div>
              )}
              {category.type === 'METABOLIC' && (
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Homeopatía</h4>
                    <div className="space-y-3">
                      {((category.items[0] as any).homeopathy as MetabolicActivatorItem[]).map((item: MetabolicActivatorItem) => renderItem(item, category.id, 'homeopathy'))}
                      <div className="flex items-center gap-2 pt-3 border-t"><input type="text" placeholder="Añadir..." value={newItemInputs[`${category.id}-homeopathy`] || ''} onChange={(e) => setNewItemInputs(prev => ({ ...prev, [`${category.id}-homeopathy`]: e.target.value }))} className="input flex-grow text-sm py-1"/><button type="button" onClick={() => handleAddNewItem(category.id, 'homeopathy')} className="btn-primary py-2 px-3 text-sm"><FaPlus /></button></div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Flores de Bach</h4>
                    <div className="space-y-3">
                      {((category.items[0] as any).bachFlowers as MetabolicActivatorItem[]).map((item: MetabolicActivatorItem) => renderItem(item, category.id, 'bachFlowers'))}
                      <div className="flex items-center gap-2 pt-3 border-t"><input type="text" placeholder="Añadir..." value={newItemInputs[`${category.id}-bachFlowers`] || ''} onChange={(e) => setNewItemInputs(prev => ({ ...prev, [`${category.id}-bachFlowers`]: e.target.value }))} className="input flex-grow text-sm py-1"/><button type="button" onClick={() => handleAddNewItem(category.id, 'bachFlowers')} className="btn-primary py-2 px-3 text-sm"><FaPlus /></button></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      
      <div className="flex justify-end gap-4 mt-8">
        <button type="button" onClick={() => setIsPreviewOpen(true)} className="btn-secondary flex items-center gap-2"><FaEye /> Vista Previa</button>
        <button type="button" onClick={() => setIsSendModalOpen(true)} className="btn-primary flex items-center gap-2"><FaPaperPlane /> Guardar y Enviar</button>
      </div>

      {isPreviewOpen && <PatientGuidePreview patient={patient} formValues={{guideDate: new Date().toISOString(), selections: selections}} guideData={guideData} onClose={() => setIsPreviewOpen(false)} />}

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
