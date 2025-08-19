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
import { FaUser, FaCalendar, FaChevronDown, FaChevronUp, FaPlus, FaEye, FaPaperPlane, FaTrash, FaTimes, FaEnvelope, FaMobileAlt, FaPrint } from 'react-icons/fa';
import PatientGuidePreview from './PatientGuidePreview';
import { toast } from 'sonner';

// --- Datos Iniciales Completamente Reestructurados y Completados ---
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
    items: [ { id: 'rev_1', name: 'Complejo B + Bioquel' } ],
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
          // Columna 1
          { id: 'am_hom_1', name: 'Inflamación' }, { id: 'am_hom_2', name: 'Glicólisis (m)' }, { id: 'am_hom_3', name: 'Humorales' }, { id: 'am_hom_4', name: 'Excreción' }, { id: 'am_hom_5', name: 'Nervioso' }, { id: 'am_hom_6', name: 'SN Central' }, { id: 'am_hom_7', name: 'SN Autónomo' }, { id: 'am_hom_8', name: 'Ansiedad' }, { id: 'am_hom_9', name: 'Depresión' }, { id: 'am_hom_10', name: 'Visión' }, { id: 'am_hom_11', name: 'Audición' }, { id: 'am_hom_12', name: 'Olfato' }, { id: 'am_hom_13', name: 'Gusto' }, { id: 'am_hom_14', name: 'Cardiovascular' }, { id: 'am_hom_15', name: 'Sangre' }, { id: 'am_hom_16', name: 'Corazón' }, { id: 'am_hom_17', name: 'Circ. arterial' }, { id: 'am_hom_18', name: 'Circ. venosa' }, { id: 'am_hom_19', name: 'Micro circulatorio' }, { id: 'am_hom_20', name: 'Respiratorio' }, { id: 'am_hom_21', name: 'Superior' }, { id: 'am_hom_22', name: 'Medio' }, { id: 'am_hom_23', name: 'Inferior' }, { id: 'am_hom_24', name: 'Linfático Adiposo' }, { id: 'am_hom_25', name: 'Congestivo' }, { id: 'am_hom_26', name: 'Degenerativo' }, { id: 'am_hom_27', name: 'Sobrepeso' }, { id: 'am_hom_28', name: 'Obesidad' }, { id: 'am_hom_29', name: 'Especiales' }, { id: 'am_hom_30', name: 'Diarrea' }, { id: 'am_hom_31', name: 'Fiebre' }, { id: 'am_hom_32', name: 'Post Vacuna' }, { id: 'am_hom_33', name: 'Bacteriosis' }, { id: 'am_hom_34', name: 'Micosis' }, { id: 'am_hom_35', name: 'Protozoarios' }, { id: 'am_hom_36', name: 'Parasitosis' }, { id: 'am_hom_37', name: 'GPDF' },
          // Columna 2
          { id: 'am_hom_38', name: 'Ciclo Krebs(t)' }, { id: 'am_hom_39', name: 'Mesenquimáticos' }, { id: 'am_hom_40', name: 'Deposición' }, { id: 'am_hom_41', name: 'Impregnación' }, { id: 'am_hom_42', name: 'Endocrino' }, { id: 'am_hom_43', name: 'Pineal' }, { id: 'am_hom_44', name: 'Hipófisis' }, { id: 'am_hom_45', name: 'Tiroides' }, { id: 'am_hom_46', name: 'Timo' }, { id: 'am_hom_47', name: 'Páncreas' }, { id: 'am_hom_48', name: 'Suprarrenal' }, { id: 'am_hom_49', name: 'Ovarios' }, { id: 'am_hom_50', name: 'Testículos' }, { id: 'am_hom_51', name: 'Digestivo' }, { id: 'am_hom_52', name: 'Superior' }, { id: 'am_hom_53', name: 'Inferior' }, { id: 'am_hom_54', name: 'Hígado' }, { id: 'am_hom_55', name: 'Vías biliares' }, { id: 'am_hom_56', name: 'Páncreas' }, { id: 'am_hom_57', name: 'Bazo' }, { id: 'am_hom_58', name: 'Urinario' }, { id: 'am_hom_59', name: 'Riñón' }, { id: 'am_hom_60', name: 'Vejiga' }, { id: 'am_hom_61', name: 'Reproductor' }, { id: 'am_hom_62', name: 'Femenino' }, { id: 'am_hom_63', name: 'Masculino' }, { id: 'am_hom_64', name: 'Próstata' }, { id: 'am_hom_65', name: 'Neuro' }, { id: 'am_hom_66', name: 'Leptosomica melanc. joven' }, { id: 'am_hom_67', name: 'Leptosomica melanc. mayor' }, { id: 'am_hom_68', name: 'Picnica flem. joven' }, { id: 'am_hom_69', name: 'Picnica flem. mayor' },
          // Columna 3
          { id: 'am_hom_70', name: 'Degeneración' }, { id: 'am_hom_71', name: 'Cadena Resp (n)' }, { id: 'am_hom_72', name: 'Celulares' }, { id: 'am_hom_73', name: 'Dediferencial' }, { id: 'am_hom_74', name: 'Inmunológico' }, { id: 'am_hom_75', name: 'Inflam. severa' }, { id: 'am_hom_76', name: 'Inflam. media' }, { id: 'am_hom_77', name: 'Inflama leve' }, { id: 'am_hom_78', name: 'Alérgico' }, { id: 'am_hom_79', name: 'Estimula basal' }, { id: 'am_hom_80', name: 'Estimula viral' }, { id: 'am_hom_81', name: 'Estimula bact' }, { id: 'am_hom_82', name: 'Estimula cell' }, { id: 'am_hom_83', name: 'Óseo Articular' }, { id: 'am_hom_84', name: 'Huesos' }, { id: 'am_hom_85', name: 'Cartílagos y lig.' }, { id: 'am_hom_86', name: 'Discos' }, { id: 'am_hom_87', name: 'Occipital' }, { id: 'am_hom_88', name: 'Cervical' }, { id: 'am_hom_89', name: 'Dorsal' }, { id: 'am_hom_90', name: 'Lumbar' }, { id: 'am_hom_91', name: 'Muscular' }, { id: 'am_hom_92', name: 'Inflamatorio' }, { id: 'am_hom_93', name: 'Degenerativo' }, { id: 'am_hom_94', name: 'Piel' }, { id: 'am_hom_95', name: 'Inflamatorio' }, { id: 'am_hom_96', name: 'Degenerativo' }, { id: 'am_hom_97', name: 'Cabellos / Uñas' }, { id: 'am_hom_98', name: 'Vegetativo' }, { id: 'am_hom_99', name: 'Atlética colérica joven' }, { id: 'am_hom_100', name: 'Atlética colérica mayor' }, { id: 'am_hom_101', name: 'Robusta sang. joven' }, { id: 'am_hom_102', name: 'Robusta sang. mayor' },
        ],
        bachFlowers: [
          { id: 'am_bach_1', name: 'Agrimony' }, { id: 'am_bach_2', name: 'Aspen' }, { id: 'am_bach_3', name: 'Beech' }, { id: 'am_bach_4', name: 'Centaury' }, { id: 'am_bach_5', name: 'Cerato' }, { id: 'am_bach_6', name: 'Cherry plum' }, { id: 'am_bach_7', name: 'Chestnut bud' }, { id: 'am_bach_8', name: 'Chicory' }, { id: 'am_bach_9', name: 'Clematis' }, { id: 'am_bach_10', name: 'Crab apple' }, { id: 'am_bach_11', name: 'Elm' }, { id: 'am_bach_12', name: 'Gentian' }, { id: 'am_bach_13', name: 'Gorse' }, { id: 'am_bach_14', name: 'Heather' }, { id: 'am_bach_15', name: 'Holly' }, { id: 'am_bach_16', name: 'Honeysuckle' }, { id: 'am_bach_17', name: 'Hornbeam' }, { id: 'am_bach_18', name: 'Impatiens' }, { id: 'am_bach_19', name: 'Larch' }, { id: 'am_bach_20', name: 'Mimulus' }, { id: 'am_bach_21', name: 'Mustard' }, { id: 'am_bach_22', name: 'Oak' }, { id: 'am_bach_23', name: 'Olive' }, { id: 'am_bach_24', name: 'Pine' }, { id: 'am_bach_25', name: 'Red chestnut' }, { id: 'am_bach_26', name: 'Rock rose' }, { id: 'am_bach_27', name: 'Rock water' }, { id: 'am_bach_28', name: 'Scleranthus' }, { id: 'am_bach_29', name: 'Star of Bethlehem' }, { id: 'am_bach_30', name: 'Sweet chestnut' }, { id: 'am_bach_31', name: 'Vervain' }, { id: 'am_bach_32', name: 'Vine' }, { id: 'am_bach_33', name: 'Walnut' }, { id: 'am_bach_34', name: 'Water violet' }, { id: 'am_bach_35', name: 'White chestnut' }, { id: 'am_bach_36', name: 'Wild oat' }, { id: 'am_bach_37', name: 'Wild rose' }, { id: 'am_bach_38', name: 'Willow' }, { id: 'am_bach_39', name: 'Rescue Remedy' },
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
    items: [] // Se llena dinámicamente
  },
  {
    id: 'cat_control_terapia',
    title: 'Control de Terapia',
    type: 'STANDARD',
    items: [] // Se llena dinámicamente
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

  const nutraFrequencyOptions = ["Mañana", "Noche", "30 min antes de Desayuno", "30 min antes de Cena", "30 min antes de Desayuno y Cena", "Antes del Ejercicio", "Otros"];
  const sueroTerapiaFrequencyOptions = ["Diaria", "Semanal", "Quincenal", "Mensual"];

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

  const renderMetabolicActivator = (category: GuideCategory) => {
    const selection = selections['am_bioterapico'] as MetabolicFormItem || {};
    const activator = category.items[0] as any; // MetabolicActivator
  
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
                <input type="number" value={selection.gotas || ''} onChange={e => handleSelectionChange('am_bioterapico', 'gotas', parseInt(e.target.value))} className="input text-sm py-1 w-20" placeholder="Gotas"/>
                <span>gotas</span>
                <input type="number" value={selection.vecesAlDia || ''} onChange={e => handleSelectionChange('am_bioterapico', 'vecesAlDia', parseInt(e.target.value))} className="input text-sm py-1 w-20" placeholder="Veces"/>
                <span>veces al día debajo de la lengua 30 minutos antes de:</span>
              </p>
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input type="radio" name="horario_bioterapico" value="Desayuno y Cena" checked={selection.horario === 'Desayuno y Cena'} onChange={e => handleSelectionChange('am_bioterapico', 'horario', e.target.value as any)}/>
                  Desayuno y Cena
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="horario_bioterapico" value="Emergencia" checked={selection.horario === 'Emergencia'} onChange={e => handleSelectionChange('am_bioterapico', 'horario', e.target.value as any)}/>
                  o cada 15 min / 1h en crisis
                </label>
              </div>
            </div>
          )}
        </div>
  
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Homeopatía</h4>
            <div className="space-y-1 max-h-60 overflow-y-auto pr-2">
              {activator.homeopathy.map((item: MetabolicActivatorItem) => renderStandardItem(item, category.id, [], 'homeopathy'))}
            </div>
          </div>
          <div className="lg:col-span-2">
            <h4 className="font-semibold text-gray-700 mb-2">Flores de Bach</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 max-h-60 overflow-y-auto pr-2">
              {activator.bachFlowers.map((item: MetabolicActivatorItem) => renderStandardItem(item, category.id, [], 'bachFlowers'))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStandardItem = (item: StandardGuideItem | MetabolicActivatorItem, categoryId: string, frequencyOptions: string[], subCategory?: 'homeopathy' | 'bachFlowers') => (
    <div key={item.id} className="p-3 bg-gray-50 rounded-md transition-all hover:bg-gray-100">
      <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
        <input type="checkbox" id={item.id} checked={selections[item.id]?.selected || false} onChange={(e) => handleSelectionChange(item.id, 'selected', e.target.checked)} className="w-5 h-5 accent-primary"/>
        <label htmlFor={item.id} className="flex-grow font-medium text-gray-800 text-sm">{item.name}</label>
        {'dose' in item && item.dose && <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded">{item.dose}</span>}
        <button type="button" onClick={() => handleDeleteItem(categoryId, item.id, subCategory)} className="text-gray-400 hover:text-red-500 transition-colors ml-auto"><FaTrash /></button>
      </div>
      {selections[item.id]?.selected && !('dose' in item) && frequencyOptions.length > 0 && (
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
              {category.type === 'REMOCION' && <div className="space-y-4">{(category.items as RemocionItem[]).map(item => renderRemocionItem(item))}</div>}
              {category.type === 'REVITALIZATION' && <div className="space-y-4">{(category.items as RevitalizationGuideItem[]).map(item => renderRevitalizationItem(item))}</div>}
              {category.type === 'METABOLIC' && renderMetabolicActivator(category)}
              {category.type === 'STANDARD' && (
                <div className="space-y-4">
                  {(category.items as StandardGuideItem[]).map(item => {
                    const freqOptions = (['cat_sueros', 'cat_terapias'].includes(category.id)) 
                      ? sueroTerapiaFrequencyOptions 
                      : nutraFrequencyOptions;
                    return renderStandardItem(item, category.id, freqOptions);
                  })}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200 mt-4">
                    <input type="text" placeholder="Añadir nuevo ítem..." value={newItemInputs[category.id] || ''} onChange={(e) => setNewItemInputs(prev => ({ ...prev, [category.id]: e.target.value }))} className="input flex-grow" />
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