'use client';

import { useState } from 'react';
import { PatientWithDetails } from '@/types';
import { 
  GuideCategory, 
  Selections, 
  StandardGuideItem, 
  MetabolicActivatorItem, 
  RevitalizationGuideItem, 
  RemocionItem,
  StandardFormItem, 
  RevitalizationFormItem, 
  MetabolicFormItem,
  RemocionFormItem,
  RemocionAlimentacionType,
  NoniAloeVeraTime
} from '@/types/guide';
import { FaUser, FaCalendar, FaChevronDown, FaChevronUp, FaPlus, FaEye, FaPaperPlane, FaTrash, FaTimes, FaEnvelope, FaMobileAlt } from 'react-icons/fa';
import PatientGuidePreview from './PatientGuidePreview';
import { toast } from 'sonner';

// --- Datos Iniciales Completamente Reestructurados ---
const initialGuideData: GuideCategory[] = [
  {
    id: 'cat_remocion',
    title: 'Fase de Remoción',
    type: 'REMOCION',
    items: [
      { id: 'rem_1', name: 'Aceite de ricino', subType: 'aceite_ricino' },
      { id: 'rem_2', name: 'Leche de magnesia', subType: 'leche_magnesia' },
      { id: 'rem_3', name: 'Detoxificación Alcalina', subType: 'detox_alcalina' },
      { id: 'rem_4', name: 'Noni / Aloe Vera', subType: 'noni_aloe' },
    ],
  },
  {
    id: 'cat_revitalizacion',
    title: 'Fase de Revitalización',
    type: 'REVITALIZATION',
    items: [
        { id: 'rev_1', name: 'Complejo B + Bioquel' }
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
        { id: 'ns_10', name: 'Anti stress'},
        { id: 'ns_11', name: 'Cardiovascular'}
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
        { id: 'nc_7', name: 'Omega 3' },
        { id: 'nc_8', name: 'Vit C c/Zinc' },
        { id: 'nc_9', name: 'Vit E c/Selenio' },
        { id: 'nc_10', name: 'Zinc Quelatado' },
    ]
  },
  {
    id: 'cat_cosmeceuticos',
    title: 'Cosmecéuticos',
    type: 'STANDARD',
    items: [
      { id: 'cos_1', name: 'Conditioner' },
      { id: 'cos_2', name: 'Esencial Oils' },
      { id: 'cos_3', name: 'Exosoma Serum', dose: 'Aplicar en la mañana y noche con la cara limpia' },
      { id: 'cos_4', name: 'Protector Solar MEL 13' },
      { id: 'cos_5', name: 'Shampoo' },
      { id: 'cos_6', name: 'Sheet mask' },
      { id: 'cos_7', name: 'Spa Body Butter' },
      { id: 'cos_8', name: 'Spa Body Scroob' },
      { id: 'cos_9', name: 'Spa Foot' },
      { id: 'cos_10', name: 'Spa Massage' },
    ]
  },
  {
    id: 'cat_formulas_naturales',
    title: 'Fórmulas Naturales',
    type: 'STANDARD',
    items: [
      { id: 'fn_1', name: 'Aceite de Oliva c/Limón' },
      { id: 'fn_2', name: 'Cambiar amalgamas por resinas fotocurables' },
      { id: 'fn_3', name: 'Agua Mineral' },
      { id: 'fn_4', name: 'Enemas de Café' },
      { id: 'fn_5', name: 'Oligocell' },
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
        { id: 'suero_9', name: 'Quelación + Mega Vitamina C' },
        { id: 'suero_10', name: 'Metabólico' },
        { id: 'suero_11', name: 'Osteo Articular' },
        { id: 'suero_12', name: 'Ozono' },
        { id: 'suero_13', name: 'Pre Natal' },
    ]
  },
  {
    id: 'cat_terapias',
    title: 'Terapias Antienvejecimiento',
    type: 'STANDARD',
    items: [
      { id: 'terapia_1', name: 'Autovacuna (Inmunoterapia)' },
      { id: 'terapia_2', name: 'Biorresonancia' },
      { id: 'terapia_3', name: 'Cámara Hiperbárica' },
      { id: 'terapia_4', name: 'Células Madre Adiposa' },
      { id: 'terapia_5', name: 'Células Madre Sistémica' },
      { id: 'terapia_6', name: 'Células Madres Segmentarias' },
      { id: 'terapia_7', name: 'CERAGEN / Masajes' },
      { id: 'terapia_8', name: 'Cosmetología / Estética' },
      { id: 'terapia_9', name: 'Factores Autólogos PRP' },
      { id: 'terapia_10', name: 'Hidroterapia de Colon' },
      { id: 'terapia_11', name: 'Hidroterapia Ionizante' },
      { id: 'terapia_12', name: 'Láser Rojo / Infrarrojo' },
      { id: 'terapia_13', name: 'LEM' },
      { id: 'terapia_14', name: 'Nebulización' },
      { id: 'terapia_15', name: 'Neural' },
      { id: 'terapia_16', name: 'Ozono' },
      { id: 'terapia_17', name: 'Shot Umbilical' },
      { id: 'terapia_18', name: 'Terapia BioCelular' },
    ]
  },
  {
    id: 'cat_terapia_bioneural',
    title: 'Terapia BioNeural',
    type: 'STANDARD',
    items: []
  },
  {
    id: 'cat_control_terapia',
    title: 'Control de Terapia',
    type: 'STANDARD',
    items: []
  }
];

// --- Componente Principal ---
export default function PatientGuide({ patient }: { patient: PatientWithDetails }) {
  const [guideData, setGuideData] = useState<GuideCategory[]>(initialGuideData);
  const [selections, setSelections] = useState<Selections>({});
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({ 'cat_remocion': true });
  const [newItemInputs, setNewItemInputs] = useState<Record<string, string>>({});
  const [observaciones, setObservaciones] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  // ===== SOLUCIÓN: Se actualiza la firma de la función para incluir todas las claves posibles =====
  const handleSelectionChange = (
    itemId: string,
    field: keyof StandardFormItem | keyof RevitalizationFormItem | keyof MetabolicFormItem | keyof RemocionFormItem,
    value: any
  ) => {
  // ==========================================================================================
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
    // ... (lógica sin cambios)
  };

  const handleDeleteItem = (categoryId: string, itemId: string, subCategory?: 'homeopathy' | 'bachFlowers') => {
    // ... (lógica sin cambios)
  };

  const handleSendAction = (action: 'email' | 'app') => {
      toast.info(`Funcionalidad para enviar por ${action} en desarrollo.`);
      setIsSendModalOpen(false);
  };

  // --- Opciones para los Selects ---
  const nutraFrequencyOptions = ["Mañana", "Noche", "30 min antes de Desayuno", "30 min antes de Cena", "30 min antes de Desayuno y Cena", "Antes del Ejercicio", "Otros"];
  const sueroTerapiaFrequencyOptions = ["Diaria", "Semanal", "Quincenal", "Mensual"];

  // --- Render Functions Específicas ---

  const renderRemocionItem = (item: RemocionItem) => {
    const selection = selections[item.id] as RemocionFormItem || {};
    const alimentacionOptions: RemocionAlimentacionType[] = ['Niño', 'Antienvejecimiento', 'Antidiabética', 'Metabólica', 'Citostática', 'Renal'];
    const noniAloeTimeOptions: NoniAloeVeraTime[] = ['30 minutos antes de Desayuno', 'Desayuno y Cena', 'Cena'];

    return (
      <div key={item.id} className="p-3 bg-gray-50 rounded-md">
        <div className="flex items-center gap-4">
          <input 
            type="checkbox" 
            id={item.id} 
            checked={selection.selected || false} 
            onChange={(e) => handleSelectionChange(item.id, 'selected', e.target.checked)} 
            className="w-5 h-5 accent-primary"
          />
          <label htmlFor={item.id} className="font-medium text-gray-800">{item.name}</label>
        </div>
        {selection.selected && (
          <div className="mt-3 pl-9 space-y-3">
            { (item.subType === 'aceite_ricino' || item.subType === 'leche_magnesia') && (
              <div className="grid grid-cols-2 gap-4">
                <select value={selection.cucharadas || ''} onChange={e => handleSelectionChange(item.id, 'cucharadas', parseInt(e.target.value))} className="input text-sm py-1">
                  <option value="">Cucharadas...</option>
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <select value={selection.horario || ''} onChange={e => handleSelectionChange(item.id, 'horario', e.target.value as any)} className="input text-sm py-1">
                  <option value="">Horario...</option>
                  <option value="Dia">Día</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noche">Noche</option>
                </select>
              </div>
            )}
            { item.subType === 'detox_alcalina' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span>Por</span>
                  <input type="number" value={selection.semanas || ''} onChange={e => handleSelectionChange(item.id, 'semanas', parseInt(e.target.value))} className="input text-sm py-1 w-20" placeholder="N°"/>
                  <span>semana(s)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {alimentacionOptions.map(opt => (
                    <label key={opt} className="flex items-center gap-1 text-sm">
                      <input type="checkbox" checked={selection.alimentacionTipo?.includes(opt)} onChange={e => {
                        const current = selection.alimentacionTipo || [];
                        const newSelection = e.target.checked ? [...current, opt] : current.filter(x => x !== opt);
                        handleSelectionChange(item.id, 'alimentacionTipo', newSelection);
                      }}/>
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            )}
            { item.subType === 'noni_aloe' && (
              <div className="grid grid-cols-2 gap-4">
                 <select value={selection.tacita || ''} onChange={e => handleSelectionChange(item.id, 'tacita', e.target.value as any)} className="input text-sm py-1">
                  <option value="">Tomar...</option>
                  {noniAloeTimeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <select value={selection.frascos || ''} onChange={e => handleSelectionChange(item.id, 'frascos', parseInt(e.target.value))} className="input text-sm py-1">
                  <option value="">Frascos...</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderRevitalizationItem = (item: RevitalizationGuideItem) => {
    const selection = selections[item.id] as RevitalizationFormItem || {};
    return (
      <div key={item.id} className="p-3 bg-blue-50 rounded-md border border-blue-200">
          <div className="flex items-center gap-4">
              <input 
                  type="checkbox" 
                  id={item.id} 
                  checked={selection.selected || false} 
                  onChange={(e) => handleSelectionChange(item.id, 'selected', e.target.checked)} 
                  className="w-5 h-5 accent-primary"
              />
              <label htmlFor={item.id} className="flex-grow font-semibold text-blue-800">{item.name}</label>
          </div>
          {selection.selected && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pl-9">
                  <input 
                      type="text" 
                      placeholder="Complejo B (cc)" 
                      value={selection.complejoB_cc || ''} 
                      onChange={(e) => handleSelectionChange(item.id, 'complejoB_cc', e.target.value)} 
                      className="input text-sm py-1" 
                  />
                  <input 
                      type="text" 
                      placeholder="Bioquel (cc)" 
                      value={selection.bioquel_cc || ''} 
                      onChange={(e) => handleSelectionChange(item.id, 'bioquel_cc', e.target.value)} 
                      className="input text-sm py-1" 
                  />
                  <select value={selection.frequency || ''} onChange={e => handleSelectionChange(item.id, 'frequency', e.target.value as any)} className="input text-sm py-1">
                    <option value="">Frecuencia...</option>
                    <option value="1 vez por semana por 10 dosis">1 vez/sem por 10 dosis</option>
                    <option value="2 veces por semana por 10 dosis">2 veces/sem por 10 dosis</option>
                  </select>
              </div>
          )}
      </div>
    );
  };

  const renderStandardItem = (item: StandardGuideItem, categoryId: string, frequencyOptions: string[]) => (
    <div key={item.id} className="p-3 bg-gray-50 rounded-md transition-all hover:bg-gray-100">
      <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
        <input type="checkbox" id={item.id} checked={selections[item.id]?.selected || false} onChange={(e) => handleSelectionChange(item.id, 'selected', e.target.checked)} className="w-5 h-5 accent-primary"/>
        <label htmlFor={item.id} className="flex-grow font-medium text-gray-800">{item.name}</label>
        {item.dose && <span className="text-sm text-gray-600 bg-gray-200 px-2 py-1 rounded">{item.dose}</span>}
        <button type="button" onClick={() => handleDeleteItem(categoryId, item.id)} className="text-gray-400 hover:text-red-500 transition-colors ml-auto"><FaTrash /></button>
      </div>
      {selections[item.id]?.selected && !item.dose && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 pl-9">
          <input type="text" placeholder="Cant." value={(selections[item.id] as StandardFormItem)?.qty || ''} onChange={(e) => handleSelectionChange(item.id, 'qty', e.target.value)} className="input text-sm py-1" />
          <select value={(selections[item.id] as StandardFormItem)?.freq || ''} onChange={(e) => handleSelectionChange(item.id, 'freq', e.target.value)} className="input text-sm py-1">
            <option value="">Frecuencia...</option>
            {frequencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <input type="text" placeholder="Suplemento personalizado" value={(selections[item.id] as StandardFormItem)?.custom || ''} onChange={(e) => handleSelectionChange(item.id, 'custom', e.target.value)} className="input text-sm py-1" />
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
              {category.type === 'REMOCION' && (
                <div className="space-y-4">
                  {(category.items as RemocionItem[]).map(item => renderRemocionItem(item))}
                </div>
              )}
              {category.type === 'REVITALIZATION' && (
                  <div className="space-y-4">
                      {(category.items as RevitalizationGuideItem[]).map(item => renderRevitalizationItem(item))}
                  </div>
              )}
              {category.type === 'STANDARD' && (
                <div className="space-y-4">
                  {(category.items as StandardGuideItem[]).map(item => {
                    const freqOptions = (category.id === 'cat_sueros' || category.id === 'cat_terapias') 
                      ? sueroTerapiaFrequencyOptions 
                      : nutraFrequencyOptions;
                    return renderStandardItem(item, category.id, freqOptions);
                  })}
                  {/* ... Lógica para añadir nuevos items ... */}
                </div>
              )}
              {/* ... Render para METABOLIC ... */}
            </div>
          )}
        </div>
      ))}
      
      {/* ... Nuevas secciones y botones ... */}
    </div>
  );
}