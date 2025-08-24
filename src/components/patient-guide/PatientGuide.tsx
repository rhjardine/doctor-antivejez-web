'use client';

import React, { useState } from 'react';
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
import { FaUser, FaCalendar, FaChevronDown, FaChevronUp, FaPlus, FaEye, FaPaperPlane, FaTrash, FaTimes, FaEnvelope, FaMobileAlt, FaPrint, FaUserMd } from 'react-icons/fa';
import PatientGuidePreview from './PatientGuidePreview';
import { toast } from 'sonner';

// --- Estructura de Datos para el Activador Metabólico Jerárquico ---
export const homeopathicStructure = {
  'Sistemas': ['Inflamación', 'Glicólisis (m)', 'Ciclo Krebs(t)', 'Cadena Resp (n)'],
  'Humorales': ['Excreción', 'Inflamación'],
  'Mesenquimáticos': ['Deposición', 'Impregnación'],
  'Celulares': ['Degeneración', 'Dediferencial'],
  'Nervioso': ['SN Central', 'SN Autónomo', 'Ansiedad', 'Depresión', 'Visión', 'Audición', 'Olfato', 'Gusto'],
  'Endocrino': ['Pineal', 'Hipófisis', 'Tiroides', 'Timo', 'Páncreas', 'Suprarrenal', 'Ovarios', 'Testículos'],
  'Inmunológico': ['Inflam. severa', 'Inflam. media', 'Inflama leve', 'Alérgico', 'Estimula basal', 'Estimula viral', 'Estimula bact', 'Estimula cell'],
  'Cardiovascular': ['Sangre', 'Corazón', 'Circ. arterial', 'Circ. venosa', 'Micro circulatorio'],
  'Digestivo': ['Superior', 'Inferior', 'Hígado', 'Vías biliares', 'Páncreas', 'Bazo'],
  'Óseo Articular': ['Huesos', 'Cartílagos y lig.', 'Discos', 'Occipital', 'Cervical', 'Dorsal', 'Lumbar'],
  'Respiratorio': ['Superior', 'Medio', 'Inferior'],
  'Urinario': ['Riñón', 'Vejiga'],
  'Muscular': ['Inflamatorio', 'Degenerativo'],
  'Linfático Adiposo': ['Congestivo', 'Degenerativo', 'Sobrepeso', 'Obesidad'],
  'Reproductor': ['Femenino', 'Masculino', 'Próstata'],
  'Piel': ['Inflamatorio', 'Degenerativo', 'Cabellos / Uñas'],
  'Especiales': ['Diarrea', 'Fiebre', 'Post Vacuna', 'Bacteriosis', 'Micosis', 'Protozoarios', 'Parasitosis', 'GPDF'],
  'Neuro': ['Leptosomica melanc. joven', 'Leptosomica melanc. mayor', 'Picnica flem. joven', 'Picnica flem. mayor'],
  'Vegetativo': ['Atlética colérica joven', 'Atlética colérica mayor', 'Robusta sang. joven', 'Robusta sang. mayor'],
};

export const bachFlowersList: MetabolicActivatorItem[] = [
  { id: 'am_bach_1', name: 'Agrimony' }, { id: 'am_bach_2', name: 'Aspen' }, { id: 'am_bach_3', name: 'Beech' }, { id: 'am_bach_4', name: 'Centaury' }, { id: 'am_bach_5', name: 'Cerato' }, { id: 'am_bach_6', name: 'Cherry plum' }, { id: 'am_bach_7', name: 'Chestnut bud' }, { id: 'am_bach_8', name: 'Chicory' }, { id: 'am_bach_9', name: 'Clematis' }, { id: 'am_bach_10', name: 'Crab apple' }, { id: 'am_bach_11', name: 'Elm' }, { id: 'am_bach_12', name: 'Gentian' }, { id: 'am_bach_13', name: 'Gorse' }, { id: 'am_bach_14', name: 'Heather' }, { id: 'am_bach_15', name: 'Holly' }, { id: 'am_bach_16', name: 'Honeysuckle' }, { id: 'am_bach_17', name: 'Hornbeam' }, { id: 'am_bach_18', name: 'Impatiens' }, { id: 'am_bach_19', name: 'Larch' }, { id: 'am_bach_20', name: 'Mimulus' }, { id: 'am_bach_21', name: 'Mustard' }, { id: 'am_bach_22', name: 'Oak' }, { id: 'am_bach_23', name: 'Olive' }, { id: 'am_bach_24', name: 'Pine' }, { id: 'am_bach_25', name: 'Red chestnut' }, { id: 'am_bach_26', name: 'Rock rose' }, { id: 'am_bach_27', name: 'Rock water' }, { id: 'am_bach_28', name: 'Scleranthus' }, { id: 'am_bach_29', name: 'Star of Bethlehem' }, { id: 'am_bach_30', name: 'Sweet chestnut' }, { id: 'am_bach_31', name: 'Vervain' }, { id: 'am_bach_32', name: 'Vine' }, { id: 'am_bach_33', name: 'Walnut' }, { id: 'am_bach_34', name: 'Water violet' }, { id: 'am_bach_35', name: 'White chestnut' }, { id: 'am_bach_36', name: 'Wild oat' }, { id: 'am_bach_37', name: 'Wild rose' }, { id: 'am_bach_38', name: 'Willow' }, { id: 'am_bach_39', name: 'Rescue Remedy' },
];

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
    items: [ { id: 'rev_1', name: 'Complejo B + Otro' } ],
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
        homeopathy: [], // Se renderiza desde homeopathicStructure
        bachFlowers: bachFlowersList,
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
      { id: 'fn_2', name: 'Aceite de Ozono' },
      { id: 'fn_3', name: 'Agua mineral' },
      { id: 'fn_4', name: 'Arcilla Medicinal Bebible' },
      { id: 'fn_5', name: 'Arcilla Medicinal Tópica' },
      { id: 'fn_6', name: 'Amigel' },
      { id: 'fn_7', name: 'Cambiar desodorante por borocanfor y aceites esenciales' },
      { id: 'fn_8', name: 'Cambiar o cubrir las amalgamas por resina fotocurable' },
      { id: 'fn_9', name: 'Cloruro de Magnesio' },
      { id: 'fn_10', name: 'Duchas Vaginales' },
      { id: 'fn_11', name: 'Enema Café' },
      { id: 'fn_12', name: 'Enema Marino' },
      { id: 'fn_13', name: 'Fiebre' },
      { id: 'fn_14', name: 'Gargarismos' },
      { id: 'fn_15', name: 'Jugo de linaza' },
      { id: 'fn_16', name: 'Jugo de Papa Cruda' },
      { id: 'fn_17', name: 'Oligocell' },
      { id: 'fn_18', name: 'Plasma Marino' },
      { id: 'fn_19', name: 'Utilizar tintes sin amoníaco' },
      { id: 'fn_20', name: 'Lavados Nasales' },
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

const HomeopathySelector = ({ selections, handleSelectionChange }: { selections: Selections, handleSelectionChange: Function }) => {
  return (
    <div className="space-y-4">
      {Object.entries(homeopathicStructure).map(([category, items]) => (
        <div key={category} className="p-3 bg-gray-100 rounded-md">
          <h5 className="font-semibold text-gray-800 mb-2">{category}</h5>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
            {items.map(item => {
              const itemId = `am_hom_${item.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
              return (
                <label key={itemId} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    id={itemId}
                    checked={selections[itemId]?.selected || false}
                    onChange={(e) => handleSelectionChange(itemId, 'selected', e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span>{item}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

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

  const handleSelectionChange = (
    itemId: string,
    field: keyof StandardFormItem | keyof RevitalizationFormItem | keyof MetabolicFormItem | keyof RemocionFormItem,
    value: any
  ) => {
    setSelections(prev => {
        const newSelections = { ...prev };
        if (!newSelections[itemId]) {
            newSelections[itemId] = {};
        }
        (newSelections[itemId] as any)[field] = value;
        return newSelections;
    });
  };

  const handleMetabolicHorarioChange = (horario: 'Desayuno y Cena' | 'Emergencia') => {
    const currentSelection = selections['am_bioterapico'] as MetabolicFormItem || {};
    const currentHorarios = Array.isArray(currentSelection.horario) ? currentSelection.horario : (currentSelection.horario ? [currentSelection.horario] : []);
    
    let newHorarios;
    if (currentHorarios.includes(horario)) {
      newHorarios = currentHorarios.filter(h => h !== horario);
    } else {
      newHorarios = [...currentHorarios, horario];
    }
    handleSelectionChange('am_bioterapico', 'horario', newHorarios);
  };

  const handleAddNewItem = (categoryId: string) => {
    const newItemName = newItemInputs[categoryId];
    if (!newItemName?.trim()) return;

    const newItem = {
      id: `${categoryId}_${Date.now()}`,
      name: newItemName.trim(),
    };

    setGuideData(prevData => prevData.map(cat => {
      if (cat.id === categoryId) {
        const newItems = [...(cat.items as StandardGuideItem[]), newItem];
        return { ...cat, items: newItems };
      }
      return cat;
    }));
    setNewItemInputs(prev => ({ ...prev, [categoryId]: '' }));
  };

  const handleDeleteItem = (categoryId: string, itemId: string) => {
    setGuideData(prevData => prevData.map(cat => {
      if (cat.id === categoryId) {
        const newItems = (cat.items as StandardGuideItem[]).filter(item => item.id !== itemId);
        return { ...cat, items: newItems };
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

  const nutraFrequencyOptions = ["Mañana", "Noche", "30 min antes de Desayuno", "30 min antes de Cena", "30 min antes de Desayuno y Cena", "Antes del Ejercicio", "Otros"];
  const sueroTerapiaFrequencyOptions = ["Diaria", "Semanal", "Quincenal", "Mensual"];
  const noniAloeTimeOptions: NoniAloeVeraTime[] = [
    '30 minutos antes de Desayuno', 
    '30 minutos antes de Desayuno y Cena',
    '30 minutos antes de la Cena'
  ];

  const renderRemocionItem = (item: RemocionItem) => {
    const selection = selections[item.id] as RemocionFormItem || {};
    const alimentacionOptions: RemocionAlimentacionType[] = ['Niño', 'Antienvejecimiento', 'Antidiabética', 'Metabólica', 'Citostática', 'Renal'];

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
                {/* ===== AJUSTE 1: Cambio en el selector de cucharadas ===== */}
                <select 
                  value={selection.cucharadas ?? ''}
                  onChange={e => handleSelectionChange(item.id, 'cucharadas', e.target.value === '' ? undefined : parseInt(e.target.value))} 
                  className="input text-sm py-1"
                >
                  <option value="">Seleccione dosis...</option>
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{`${n} cucharada(s)`}</option>)}
                </select>
                <select 
                  value={selection.horario ?? ''}
                  onChange={e => handleSelectionChange(item.id, 'horario', e.target.value === '' ? undefined : e.target.value as any)} 
                  className="input text-sm py-1"
                >
                  <option value="">Horario...</option>
                  <option value="en el día">en el día</option>
                  <option value="en la tarde">en la tarde</option>
                  <option value="en la noche al acostarse">en la noche al acostarse</option>
                </select>
              </div>
            )}
            { item.subType === 'detox_alcalina' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span>Por</span>
                  <input type="number" value={selection.semanas ?? ''} onChange={e => handleSelectionChange(item.id, 'semanas', e.target.value === '' ? undefined : parseInt(e.target.value))} className="input text-sm py-1 w-20" placeholder="N°"/>
                  <span>semana(s)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {alimentacionOptions.map(opt => (
                    <label key={opt} className="flex items-center gap-1 text-sm">
                      <input type="checkbox" checked={selection.alimentacionTipo?.includes(opt) || false} onChange={e => {
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
                 <select value={selection.tacita ?? ''} onChange={e => handleSelectionChange(item.id, 'tacita', e.target.value as any)} className="input text-sm py-1">
                  <option value="">Tomar...</option>
                  {noniAloeTimeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <select value={selection.frascos ?? ''} onChange={e => handleSelectionChange(item.id, 'frascos', e.target.value === '' ? undefined : parseInt(e.target.value))} className="input text-sm py-1">
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
                  {/* ===== AJUSTE 2: Cambio en los placeholders de Revitalización ===== */}
                  <input 
                      type="text" 
                      placeholder="Complejo B 3 cc" 
                      value={selection.complejoB_cc ?? ''} 
                      onChange={(e) => handleSelectionChange(item.id, 'complejoB_cc', e.target.value)} 
                      className="input text-sm py-1" 
                  />
                  <input 
                      type="text" 
                      placeholder="Otro medicamento 3 cc" 
                      value={selection.bioquel_cc ?? ''} 
                      onChange={(e) => handleSelectionChange(item.id, 'bioquel_cc', e.target.value)} 
                      className="input text-sm py-1" 
                  />
                  <select value={selection.frequency ?? ''} onChange={e => handleSelectionChange(item.id, 'frequency', e.target.value as any)} className="input text-sm py-1">
                    <option value="">Frecuencia...</option>
                    <option value="1 vez por semana por 10 dosis">1 vez/sem por 10 dosis</option>
                    <option value="2 veces por semana por 10 dosis">2 veces/sem por 10 dosis</option>
                  </select>
              </div>
          )}
      </div>
    );
  };

  const renderMetabolicActivator = () => {
    const [activeSubTab, setActiveSubTab] = useState<'homeopatia' | 'bach'>('homeopatia');
    const selection = selections['am_bioterapico'] as MetabolicFormItem || {};
    const currentHorarios = Array.isArray(selection.horario) ? selection.horario : (selection.horario ? [selection.horario] : []);

    return (
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
          <div className="flex items-center gap-4">
            <input 
              type="checkbox" 
              id="am_bioterapico" 
              checked={selection.selected || false} 
              onChange={(e) => handleSelectionChange('am_bioterapico', 'selected', e.target.checked)} 
              className="w-5 h-5 accent-primary"
            />
            <label htmlFor="am_bioterapico" className="font-semibold text-blue-800">Bioterápico + Bach</label>
          </div>
          {selection.selected && (
            <div className="mt-3 pl-9 space-y-3">
              <p className="text-sm text-gray-600 flex items-center flex-wrap gap-2">
                <input type="number" value={selection.gotas ?? ''} onChange={e => handleSelectionChange('am_bioterapico', 'gotas', e.target.value === '' ? undefined : parseInt(e.target.value))} className="input text-sm py-1 w-20" placeholder="Gotas"/>
                <span>gotas</span>
                <input type="number" value={selection.vecesAlDia ?? ''} onChange={e => handleSelectionChange('am_bioterapico', 'vecesAlDia', e.target.value === '' ? undefined : parseInt(e.target.value))} className="input text-sm py-1 w-20" placeholder="Veces"/>
                <span>veces al día debajo de la lengua:</span>
              </p>
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={currentHorarios.includes('Desayuno y Cena')} onChange={() => handleMetabolicHorarioChange('Desayuno y Cena')}/>
                  30 min antes de Desayuno y Cena
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={currentHorarios.includes('Emergencia')} onChange={() => handleMetabolicHorarioChange('Emergencia')}/>
                  o cada 15 min / 1h en crisis
                </label>
              </div>
            </div>
          )}
        </div>
        
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4">
            <button type="button" onClick={() => setActiveSubTab('homeopatia')} className={`py-2 px-4 text-sm font-medium ${activeSubTab === 'homeopatia' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}>
              Homeopatía
            </button>
            <button type="button" onClick={() => setActiveSubTab('bach')} className={`py-2 px-4 text-sm font-medium ${activeSubTab === 'bach' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}>
              Flores de Bach
            </button>
          </nav>
        </div>

        {activeSubTab === 'homeopatia' && <HomeopathySelector selections={selections} handleSelectionChange={handleSelectionChange} />}
        
        {activeSubTab === 'bach' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {bachFlowersList.map(item => (
              <label key={item.id} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded-md">
                <input
                  type="checkbox"
                  id={item.id}
                  checked={selections[item.id]?.selected || false}
                  onChange={(e) => handleSelectionChange(item.id, 'selected', e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <span>{item.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderStandardItem = (item: StandardGuideItem | MetabolicActivatorItem, categoryId: string, frequencyOptions: string[]) => (
    <div key={item.id} className="p-3 bg-gray-50 rounded-md transition-all hover:bg-gray-100">
      <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
        <input type="checkbox" id={item.id} checked={selections[item.id]?.selected || false} onChange={(e) => handleSelectionChange(item.id, 'selected', e.target.checked)} className="w-5 h-5 accent-primary"/>
        <label htmlFor={item.id} className="flex-grow font-medium text-gray-800 text-sm">{item.name}</label>
        {'dose' in item && item.dose && <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded">{item.dose}</span>}
        <button type="button" onClick={() => handleDeleteItem(categoryId, item.id)} className="text-gray-400 hover:text-red-500 transition-colors ml-auto"><FaTrash /></button>
      </div>
      {selections[item.id]?.selected && !('dose' in item) && frequencyOptions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 pl-9">
          <input type="text" placeholder="Cant." value={(selections[item.id] as StandardFormItem)?.qty ?? ''} onChange={(e) => handleSelectionChange(item.id, 'qty', e.target.value)} className="input text-sm py-1" />
          <select value={(selections[item.id] as StandardFormItem)?.freq ?? ''} onChange={(e) => handleSelectionChange(item.id, 'freq', e.target.value)} className="input text-sm py-1">
            <option value="">Frecuencia...</option>
            {frequencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <input type="text" placeholder="Suplemento personalizado" value={(selections[item.id] as StandardFormItem)?.custom ?? ''} onChange={(e) => handleSelectionChange(item.id, 'custom', e.target.value)} className="input text-sm py-1" />
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
              {category.type === 'REMOCION' && <div className="space-y-4">{(category.items as RemocionItem[]).map(item => renderRemocionItem(item))}</div>}
              {category.type === 'REVITALIZATION' && <div className="space-y-4">{(category.items as RevitalizationGuideItem[]).map(item => renderRevitalizationItem(item))}</div>}
              {category.type === 'METABOLIC' && renderMetabolicActivator()}
              {category.type === 'STANDARD' && (
                <div className="space-y-4">
                  {(category.items as StandardGuideItem[]).map(item => {
                    const freqOptions = (['cat_sueros', 'cat_terapias'].includes(category.id)) 
                      ? sueroTerapiaFrequencyOptions 
                      : nutraFrequencyOptions;
                    return renderStandardItem(item, category.id, freqOptions);
                  })}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200 mt-4">
                    <input type="text" placeholder="Añadir nuevo ítem..." value={newItemInputs[category.id] ?? ''} onChange={(e) => setNewItemInputs(prev => ({ ...prev, [category.id]: e.target.value }))} className="input flex-grow" />
                    <button type="button" onClick={() => handleAddNewItem(category.id)} className="btn-primary py-2 px-4 flex items-center gap-2 text-sm"><FaPlus /> Añadir</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-2">Observaciones</h3>
        <textarea 
          value={observaciones} 
          onChange={(e) => setObservaciones(e.target.value)}
          className="input w-full"
          rows={4}
          placeholder="Añadir observaciones, notas o instrucciones adicionales para el paciente..."
        />
      </div>

      <div className="flex justify-end gap-4 mt-8">
        <button type="button" onClick={() => setIsPreviewOpen(true)} className="btn-secondary flex items-center gap-2"><FaEye /> Vista Previa</button>
        <button type="button" onClick={() => window.print()} className="btn-secondary flex items-center gap-2"><FaPrint /> Imprimir</button>
        <button type="button" onClick={() => setIsSendModalOpen(true)} className="btn-primary flex items-center gap-2"><FaPaperPlane /> Guardar y Enviar</button>
      </div>

      {isPreviewOpen && <PatientGuidePreview patient={patient} formValues={{guideDate: new Date().toISOString(), selections, observaciones}} guideData={guideData} onClose={() => setIsPreviewOpen(false)} />}

      {isSendModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center relative animate-slideUp">
            <button onClick={() => setIsSendModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FaTimes size={20}/></button>
            <h3 className="text-xl font-bold text-primary-dark mb-6">Enviar Guía al Paciente</h3>
            <p className="text-gray-600 mb-6">¿A quién deseas enviar esta guía?</p>
            <div className="space-y-4">
              <button onClick={() => handleSendAction('email')} className="w-full btn-primary flex items-center justify-center gap-3"><FaEnvelope /> Enviar al Paciente</button>
              <button onClick={() => handleSendAction('app')} className="w-full btn-secondary flex items-center justify-center gap-3"><FaUserMd /> Enviar al Coach/Admin</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}