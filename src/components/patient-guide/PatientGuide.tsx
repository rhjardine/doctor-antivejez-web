'use client';

import React, { useState, useEffect } from 'react';
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
import { getGuideTemplate, savePatientGuide, sendGuideEmail } from '@/lib/actions/guide.actions';

// --- Estructura de Datos para el Activador Metabólico Jerárquico ---
export const homeopathicStructure = {
  'Evolución': ['Inflamación', 'Degeneración'],
  'Energía': ['Glicólisis (m)', 'Ciclo Krebs (t)', 'Cadena Resp (n)'],
  'Hemotóxico': {
    'Humorales': ['Excreción', 'Inflamación'],
    'Mesenquimáticos': ['Deposición', 'Impregnación'],
    'Celulares': ['Regeneración', 'Dediferenciación'],
  },
  'Sistemas Orgánicos': {
    'Nervioso': ['SN Central', 'SN Autónomo', 'Ansiedad', 'Depresión', 'Visión', 'Audición', 'Olfato', 'Gusto'],
    'Endocrino': ['Pineal', 'Hipófisis', 'Tiroides', 'Timo', 'Páncreas', 'Suprarrenal', 'Ovarios', 'Testículos'],
    'Inmunológico': ['Inflam. severa', 'Inflam. media', 'Inflama leve', 'Alérgico', 'Estímulo basal', 'Estímulo viral', 'Estímulo bact', 'Estímulo cell'],
    'Cardiovascular': ['Sangre', 'Corazón', 'Circ. arterial', 'Circ. venosa', 'Microcirculación'],
    'Respiratorio': ['Superior', 'Medio', 'Inferior'],
    'Linfático Adiposo': ['Congestivo', 'Degenerativo', 'Sobrepeso', 'Obesidad'],
    'Digestivo': ['Superior', 'Inferior', 'Hígado', 'Vías biliares', 'Páncreas', 'Bazo'],
    'Urinario': ['Riñón', 'Vejiga'],
    'Reproductor': ['Femenino', 'Masculino', 'Próstata'],
    'Óseo Articular': ['Huesos', 'Cartílagos y ligamentos', 'Discos', 'Occipital', 'Cervical', 'Dorsal', 'Lumbar'],
    'Muscular': ['Inflamatorio', 'Degenerativo'],
    'Piel': ['Inflamatorio', 'Degenerativo', 'Cabellos/Uñas'],
  },
  'Perfiles Constitucionales': {
    'Neuro': ['Leptosómica melanc. joven', 'Leptosómica melanc. mayor', 'Picnica flem joven', 'Picnica flem mayor'],
    'Vegetativo': ['Atlética colérica joven', 'Atlética colérica mayor', 'Robusta sang joven', 'Robusta sang mayor'],
  },
  'Especiales': ['Diarrea', 'Fiebre', 'Post Vacuna', 'Bacteriosis', 'Micosis', 'Protozoarios', 'Parasitosis', 'GPDF'],
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
        { id: 'ns_7', name: 'Neuro Central (Regenerador cerebral)' },
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
      { id: 'fn_6', name: 'Arnigel' },
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
      { id: 'terapia_17', name: 'Exosómas' },
      { id: 'terapia_18', name: 'Terapia BioCelular' },
    ]
  },
  {
    id: 'cat_control_terapia',
    title: 'Control de Terapia',
    type: 'STANDARD',
    items: []
  }
];

const HomeopathySelector = ({ selections, handleSelectionChange }: { selections: Selections, handleSelectionChange: Function }) => {
  const renderCheckbox = (name: string, category: string, subCategory?: string) => {
    const uniquePrefix = subCategory ? `${category}_${subCategory}` : category;
    const itemId = `am_hom_${uniquePrefix}_${name}`.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    
    return (
      <label key={itemId} className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary">
        <input
          type="checkbox"
          id={itemId}
          checked={selections[itemId]?.selected || false}
          onChange={(e) => handleSelectionChange(itemId, 'selected', e.target.checked)}
          className="w-4 h-4 accent-primary"
        />
        <span>{name}</span>
      </label>
    );
  };

  return (
    <div className="space-y-4">
      {Object.entries(homeopathicStructure).map(([category, subItems]) => (
        <div key={category} className="p-4 bg-gray-50 rounded-lg border">
          <h5 className="font-bold text-gray-800 mb-3">{category}</h5>
          {Array.isArray(subItems) ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2">
              {subItems.map(item => renderCheckbox(item, category))}
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(subItems).map(([subCategory, items]) => (
                <div key={subCategory}>
                  <h6 className="font-semibold text-gray-600 mb-2">{subCategory}</h6>
                  <div className="pl-4 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                    {items.map(item => renderCheckbox(item, category, subCategory))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const BachFlowerSelector = ({ selections, handleSelectionChange }: { selections: Selections, handleSelectionChange: Function }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {bachFlowersList.map(item => (
        <label key={item.id} className="flex items-center gap-2 text-sm p-3 bg-gray-50 rounded-lg border cursor-pointer hover:border-primary">
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
  const [activeMetabolicTab, setActiveMetabolicTab] = useState<'homeopatia' | 'bach'>('homeopatia');
  const [isSaving, setIsSaving] = useState(false);
  const [guideDate, setGuideDate] = useState(new Date().toISOString().split('T')[0]);
  const [newlyAddedItems, setNewlyAddedItems] = useState<{ tempId: string; name: string; categoryId: string }[]>([]);
  const [savedGuideId, setSavedGuideId] = useState<string | null>(null); // Nuevo: Para tracking de guía guardada

  // Carga dinámica de template desde BD al montar
  useEffect(() => {
    async function loadTemplate() {
      const response = await getGuideTemplate(patient.id);
      if (response.success) {
        // Fusiona con initialGuideData si es necesario
        setGuideData(prev => [...prev, ...response.data.categories]); // Ejemplo de fusión
      } else {
        toast.error(response.error);
      }
    }
    loadTemplate();
  }, [patient.id]);

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

    const tempId = `new_${categoryId}_${Date.now()}`;
    const newItem: StandardGuideItem = {
      id: tempId,
      name: newItemName.trim(),
    };

    setGuideData(prevData => prevData.map(cat => {
      if (cat.id === categoryId) {
        const newItems = [...(cat.items as (StandardGuideItem | RemocionItem)[]), newItem];
        return { ...cat, items: newItems };
      }
      return cat;
    }));
    
    setNewlyAddedItems(prev => [...prev, { tempId, name: newItem.name, categoryId }]);
    setNewItemInputs(prev => ({ ...prev, [categoryId]: '' }));
  };

  const handleDeleteItem = (categoryId: string, itemId: string) => {
    setGuideData(prevData => prevData.map(cat => {
      if (cat.id === categoryId) {
        const newItems = (cat.items as (StandardGuideItem | RemocionItem)[]).filter(item => item.id !== itemId);
        return { ...cat, items: newItems };
      }
      return cat;
    }));
    setSelections(prev => {
      const newSelections = { ...prev };
      delete newSelections[itemId];
      return newSelections;
    });
    setNewlyAddedItems(prev => prev.filter(item => item.tempId !== itemId));
  };

  const handleSaveAndSend = async () => {
    setIsSaving(true);
    try {
      const formData: GuideFormValues = {
        guideDate,
        selections,
        observaciones,
      };
      const result = await savePatientGuide(patient.id, formData, newlyAddedItems);

      if (result.success) {
        setSavedGuideId(result.data.id); // Guardar ID para envío
        toast.success(result.message);
        setNewlyAddedItems([]); // Limpiar los items nuevos después de guardar
        setIsSendModalOpen(true);
      } else {
        toast.error(result.error || 'No se pudo guardar la guía.');
      }
    } catch (error) {
      toast.error('Error de conexión al guardar la guía.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendAction = async (action: 'email' | 'whatsapp') => {
    if (!savedGuideId) {
      toast.error('No hay guía guardada para enviar.');
      return;
    }

    setIsSendModalOpen(false);

    if (action === 'email') {
      const result = await sendGuideEmail(savedGuideId);
      if (result.success) {
        toast.success('Guía enviada por email.');
      } else {
        toast.error(result.error || 'Error al enviar por email.');
      }
    } else if (action === 'whatsapp') {
      // Placeholder para WhatsApp (e.g., integra Twilio en futuro server action)
      const message = encodeURIComponent(`Hola ${patient.firstName}, su guía de tratamiento personalizada ha sido generada. Por favor, revise su correo electrónico o el portal de pacientes para verla.`);
      window.open(`https://wa.me/${patient.phone}?text=${message}`, '_blank');
      toast.success('Enlace de WhatsApp abierto.');
    }
  };

  const nutraFrequencyOptions = [
    "Mañana", "Noche", "30 min antes de Desayuno", "30 min antes de Cena", 
    "30 min antes de Desayuno y Cena", "Con el Desayuno", "Con la Cena", 
    "Con el Desayuno y la Cena", "Antes del Ejercicio", "Otros"
  ];
  
  const sueroTerapiaFrequencyOptions = ["Diaria", "Semanal", "Quincenal", "Mensual"];
  const noniAloeTimeOptions: NoniAloeVeraTime[] = [
    '30 minutos antes de Desayuno', '30 minutos antes de Desayuno y Cena', '30 minutos antes de la Cena'
  ];

  const renderRemocionItem = (item: RemocionItem) => {
    const selection = selections[item.id] as RemocionFormItem || {};
    const alimentacionOptions: RemocionAlimentacionType[] = ['Niño', 'Antienvejecimiento', 'Antidiabética', 'Metabólica', 'Citostática', 'Renal'];

    return (
      <div key={item.id} className="p-3 bg-gray-50 rounded-md">
        <div className="flex items-center gap-4">
          <input type="checkbox" id={item.id} checked={selection.selected || false} onChange={(e) => handleSelectionChange(item.id, 'selected', e.target.checked)} className="w-5 h-5 accent-primary"/>
          <label htmlFor={item.id} className="font-medium text-gray-800">{item.name}</label>
        </div>
        {selection.selected && (
          <div className="mt-3 pl-9 space-y-3">
            { (item.subType === 'aceite_ricino' || item.subType === 'leche_magnesia') && (
              <div className="grid grid-cols-2 gap-4">
                <select value={selection.cucharadas ?? ''} onChange={e => handleSelectionChange(item.id, 'cucharadas', e.target.value === '' ? undefined : parseInt(e.target.value))} className="input text-sm py-1">
                  <option value="">Seleccione dosis...</option>
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{`${n} cucharada(s)`}</option>)}
                </select>
                <select value={selection.horario ?? ''} onChange={e => handleSelectionChange(item.id, 'horario', e.target.value === '' ? undefined : e.target.value as any)} className="input text-sm py-1">
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
              <div className="grid grid-cols-3 gap-4">
                 <input type="number" placeholder="Cant." value={selection.tacita_qty ?? ''} onChange={e => handleSelectionChange(item.id, 'tacita_qty', e.target.value === '' ? undefined : parseInt(e.target.value))} className="input text-sm py-1"/>
                 <select value={selection.tacita ?? ''} onChange={e => handleSelectionChange(item.id, 'tacita', e.target.value as any)} className="input text-sm py-1">
                  <option value="">Tomar...</option>
                  {noniAloeTimeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <select value={selection.frascos ?? ''} onChange={e => handleSelectionChange(item.id, 'frascos', e.target.value === '' ? undefined : parseInt(e.target.value))} className="input text-sm py-1">
                  <option value="">Frascos...</option>
                  <option value="1">1 Frasco</option>
                  <option value="2">2 Frascos</option>
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
              <input type="checkbox" id={item.id} checked={selection.selected || false} onChange={(e) => handleSelectionChange(item.id, 'selected', e.target.checked)} className="w-5 h-5 accent-primary"/>
              <label htmlFor={item.id} className="flex-grow font-semibold text-blue-800">{item.name}</label>
          </div>
          {selection.selected && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pl-9">
                  <input type="text" placeholder="Complejo B 3 cc" value={selection.complejoB_cc ?? ''} onChange={(e) => handleSelectionChange(item.id, 'complejoB_cc', e.target.value)} className="input text-sm py-1"/>
                  <input type="text" placeholder="Otro medicamento 3 cc" value={selection.bioquel_cc ?? ''} onChange={(e) => handleSelectionChange(item.id, 'bioquel_cc', e.target.value)} className="input text-sm py-1"/>
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
    const selection = selections['am_bioterapico'] as MetabolicFormItem || {};
    const currentHorarios = Array.isArray(selection.horario) ? selection.horario : (selection.horario ? [selection.horario] : []);

    return (
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
          <div className="flex items-center gap-4">
            <input type="checkbox" id="am_bioterapico" checked={selection.selected || false} onChange={(e) => handleSelectionChange('am_bioterapico', 'selected', e.target.checked)} className="w-5 h-5 accent-primary"/>
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
          <nav className="flex space-x-1">
            <button type="button" onClick={() => setActiveMetabolicTab('homeopatia')} className={`py-2 px-4 text-sm font-medium rounded-t-lg ${activeMetabolicTab === 'homeopatia' ? 'bg-white border-t border-x border-gray-200 text-primary' : 'text-gray-500 hover:text-gray-700 bg-gray-50'}`}>Homeopatía</button>
            <button type="button" onClick={() => setActiveMetabolicTab('bach')} className={`py-2 px-4 text-sm font-medium rounded-t-lg ${activeMetabolicTab === 'bach' ? 'bg-white border-t border-x border-gray-200 text-primary' : 'text-gray-500 hover:text-gray-700 bg-gray-50'}`}>Flores de Bach</button>
          </nav>
        </div>
        <div className="p-4 border-x