'use client';

import React, { useState, useEffect } from 'react';
import { PatientWithDetails } from '@/types';
import {
  GuideCategory, Selections, StandardGuideItem, MetabolicActivatorItem,
  RevitalizationGuideItem, RemocionItem, StandardFormItem, RevitalizationFormItem,
  MetabolicFormItem, RemocionFormItem, SueroFormItem, BioNeuralFormItem,
  RemocionAlimentacionType, NoniAloeVeraTime, MetabolicHorario
} from '@/types/guide';
import { FaUser, FaCalendar, FaChevronDown, FaChevronUp, FaPlus, FaEye, FaPaperPlane, FaTrash, FaTimes, FaEnvelope, FaMobileAlt, FaPrint } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import PatientGuidePreview from './PatientGuidePreview';
import { toast } from 'sonner';
import { savePatientGuide, sendGuideByEmail, getPatientGuideDetails } from '@/lib/actions/guide.actions';

// --- Activador Metabólico: Estructura Homeopática ---
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
  { id: 'am_bach_1', name: 'Agrimony' }, { id: 'am_bach_2', name: 'Aspen' }, { id: 'am_bach_3', name: 'Beech' },
  { id: 'am_bach_4', name: 'Centaury' }, { id: 'am_bach_5', name: 'Cerato' }, { id: 'am_bach_6', name: 'Cherry plum' },
  { id: 'am_bach_7', name: 'Chestnut bud' }, { id: 'am_bach_8', name: 'Chicory' }, { id: 'am_bach_9', name: 'Clematis' },
  { id: 'am_bach_10', name: 'Crab apple' }, { id: 'am_bach_11', name: 'Elm' }, { id: 'am_bach_12', name: 'Gentian' },
  { id: 'am_bach_13', name: 'Gorse' }, { id: 'am_bach_14', name: 'Heather' }, { id: 'am_bach_15', name: 'Holly' },
  { id: 'am_bach_16', name: 'Honeysuckle' }, { id: 'am_bach_17', name: 'Hornbeam' }, { id: 'am_bach_18', name: 'Impatiens' },
  { id: 'am_bach_19', name: 'Larch' }, { id: 'am_bach_20', name: 'Mimulus' }, { id: 'am_bach_21', name: 'Mustard' },
  { id: 'am_bach_22', name: 'Oak' }, { id: 'am_bach_23', name: 'Olive' }, { id: 'am_bach_24', name: 'Pine' },
  { id: 'am_bach_25', name: 'Red chestnut' }, { id: 'am_bach_26', name: 'Rock rose' }, { id: 'am_bach_27', name: 'Rock water' },
  { id: 'am_bach_28', name: 'Scleranthus' }, { id: 'am_bach_29', name: 'Star of Bethlehem' }, { id: 'am_bach_30', name: 'Sweet chestnut' },
  { id: 'am_bach_31', name: 'Vervain' }, { id: 'am_bach_32', name: 'Vine' }, { id: 'am_bach_33', name: 'Walnut' },
  { id: 'am_bach_34', name: 'Water violet' }, { id: 'am_bach_35', name: 'White chestnut' }, { id: 'am_bach_36', name: 'Wild oat' },
  { id: 'am_bach_37', name: 'Wild rose' }, { id: 'am_bach_38', name: 'Willow' }, { id: 'am_bach_39', name: 'Rescue Remedy' },
];

const initialGuideData: GuideCategory[] = [
  {
    id: 'cat_remocion', title: 'Fase de Remoción', type: 'REMOCION',
    items: [
      { id: 'rem_1', name: 'Aceite de ricino', subType: 'aceite_ricino' },
      { id: 'rem_2', name: 'Leche de magnesia', subType: 'leche_magnesia' },
      { id: 'rem_3', name: 'Detoxificación Alcalina', subType: 'detox_alcalina' },
      { id: 'rem_4', name: 'Noni / Aloe Vera', subType: 'noni_aloe' },
    ],
  },
  {
    id: 'cat_revitalizacion', title: 'Fase de Revitalización', type: 'REVITALIZATION',
    items: [{ id: 'rev_1', name: 'Complejo B + Otro' }],
  },
  {
    id: 'cat_nutra_primarios', title: 'Nutracéuticos Primarios', type: 'STANDARD',
    items: [
      { id: 'np_1', name: 'MegaGH4 (Fórmula Antienvejecimiento)' },
      { id: 'np_2', name: 'StemCell Enhancer (Revierte la oxidación)' },
      { id: 'np_3', name: 'Transfer Tri Factor (Modulador celular)' },
      { id: 'np_4', name: 'Telomeros (Activador de la Telomerasa)' },
    ]
  },
  {
    id: 'cat_activador', title: 'Activador Metabólico', type: 'METABOLIC',
    items: [{ id: 'cat_activador', homeopathy: [], bachFlowers: bachFlowersList }]
  },
  {
    id: 'cat_nutra_secundarios', title: 'Nutracéuticos Secundarios', type: 'STANDARD',
    items: [
      { id: 'ns_10', name: 'Anti stress (Energizante)' },
      { id: 'ns_11', name: 'Cardiovascular (Mejora la circulación)' },
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
    id: 'cat_nutra_complementarios', title: 'Nutracéuticos Complementarios', type: 'STANDARD',
    items: [
      { id: 'nc_1', name: 'Aloe Vera' }, { id: 'nc_2', name: 'Antioxidante (Revierte la oxidación)' },
      { id: 'nc_3', name: 'Colágeno' }, { id: 'nc_4', name: 'Energy' }, { id: 'nc_5', name: 'Immune Spray' },
      { id: 'nc_6', name: 'Magnesio Quelatado' }, { id: 'nc_7', name: 'Omega 3' }, { id: 'nc_8', name: 'Vit C c/Zinc' },
      { id: 'nc_9', name: 'Vit E c/Selenio' }, { id: 'nc_10', name: 'Zinc Quelatado' },
    ]
  },
  {
    id: 'cat_cosmeceuticos', title: 'Cosmecéuticos', type: 'STANDARD',
    items: [
      { id: 'cos_1', name: 'Conditioner' }, { id: 'cos_2', name: 'Esencial Oils' },
      { id: 'cos_3', name: 'Exosoma Serum', dose: 'Aplicar mañana y noche con cara limpia' },
      { id: 'cos_4', name: 'Protector Solar MEL 13' }, { id: 'cos_5', name: 'Shampoo' },
      { id: 'cos_6', name: 'Sheet mask' }, { id: 'cos_7', name: 'Spa Body Butter' },
      { id: 'cos_8', name: 'Spa Body Scroob' }, { id: 'cos_9', name: 'Spa Foot' },
      { id: 'cos_10', name: 'Spa Massage' },
    ]
  },
  {
    id: 'cat_formulas_naturales', title: 'Fórmulas Naturales', type: 'STANDARD',
    items: [
      { id: 'fn_1', name: 'Aceite de Oliva c/Limón', dose: '2 cdas aceite c/zumo de 1 limón en ayunas' },
      { id: 'fn_2', name: 'Aceite de Ozono', dose: 'Aplicar en la zona afectada 2 veces/día' },
      { id: 'fn_3', name: 'Agua mineral', dose: 'Tomar 1 litro c/zumo de limón y pizca bicarbonato' },
      { id: 'fn_4', name: 'Arcilla Medicinal Bebible', dose: '1 cucharadita en vaso de agua 2 veces/día fuera de comidas' },
      { id: 'fn_5', name: 'Arcilla Medicinal Tópica', dose: 'Aplicar en zona afectada' },
      { id: 'fn_6', name: 'Arnigel', dose: 'Aplicar en zona afectada 2 veces/día' },
      { id: 'fn_7', name: 'Cambiar desodorante por borocanfor y aceites esenciales' },
      { id: 'fn_8', name: 'Cambiar o cubrir amalgamas por resina fotocurable' },
      { id: 'fn_9', name: 'Cloruro de Magnesio', dose: 'Diluir sobre en 1 litro agua, tomar tacita en desayuno y cena + pizca bicarbonato' },
      { id: 'fn_10', name: 'Duchas Vaginales', dose: 'Infusión de llantén y manzanilla c/litro agua de vinagre, 10 días, luego quincenal' },
      { id: 'fn_11', name: 'Enema Café', dose: 'Pera rectal café tinto tibio vía rectal; acostado 15 min, veces/semana' },
      { id: 'fn_12', name: 'Enema Marino', dose: 'Pera rectal plasma marino, acostado 15 min' },
      { id: 'fn_13', name: 'Fiebre', dose: 'Baño agua tibia; té Jamaica para rehidratar' },
      { id: 'fn_14', name: 'Gargarismos', dose: '1 cda agua oxigenada en cuarto vaso agua, 3 veces/día' },
      { id: 'fn_15', name: 'Jugo de linaza', dose: 'Remojar semillas en 1 vaso agua overnight; licuar y tomar en ayunas' },
      { id: 'fn_16', name: 'Jugo de Papa Cruda', dose: 'Pelar, trocear, licuar, tomar en dolor estomacal' },
      { id: 'fn_17', name: 'Oligocell', dose: 'gotas en ½ taza de infusión' },
      { id: 'fn_18', name: 'Plasma Marino', dose: 'tacita en ayunas y al acostarse' },
      { id: 'fn_19', name: 'Utilizar tintes sin amoníaco' },
      { id: 'fn_20', name: 'Lavados Nasales', dose: 'Guardar en nevera, entibiar cada noche, aplicar con gotero por fosa nasal' },
    ]
  },
  {
    id: 'cat_sueros', title: 'Sueros — Shot Antivejez', type: 'SUERO',
    items: [
      { id: 'suero_1', name: 'Antianémico' }, { id: 'suero_2', name: 'Antienvejecimiento / Pro Vital' },
      { id: 'suero_3', name: 'Antiviral c/Ozono' }, { id: 'suero_4', name: 'Bioxigenación' },
      { id: 'suero_5', name: 'Cardio Vascular' }, { id: 'suero_6', name: 'Energizante' },
      { id: 'suero_7', name: 'Inmuno Estimulante' }, { id: 'suero_8', name: 'Inmuno Modulador' },
      { id: 'suero_9', name: 'Mega Vitamina C' }, { id: 'suero_10', name: 'Metabólico' },
      { id: 'suero_11', name: 'Osteo Articular' }, { id: 'suero_12', name: 'Ozono' },
      { id: 'suero_13', name: 'Pre Natal' }, { id: 'suero_14', name: 'Quelación' },
    ]
  },
  {
    id: 'cat_terapias', title: 'Terapias Antienvejecimiento', type: 'SUERO',
    items: [
      { id: 'terapia_1', name: 'Autovacuna (Inmunoterapia)' }, { id: 'terapia_2', name: 'Biorresonancia' },
      { id: 'terapia_3', name: 'Cámara Hiperbárica' }, { id: 'terapia_4', name: 'Células Madre Adiposa' },
      { id: 'terapia_5', name: 'Células Madres Sistémica' }, { id: 'terapia_6', name: 'Células Madres Segment.' },
      { id: 'terapia_7', name: 'CERAGEN / Masajes' }, { id: 'terapia_8', name: 'Cosmetología / Estética' },
      { id: 'terapia_9', name: 'Factores Autólogos PRP' }, { id: 'terapia_10', name: 'Hidroterapia de Colon' },
      { id: 'terapia_11', name: 'Hidroterapia Ionizante' }, { id: 'terapia_12', name: 'Láser Rojo / Infrarrojo' },
      { id: 'terapia_13', name: 'LEM' }, { id: 'terapia_14', name: 'Nebulización' },
      { id: 'terapia_15', name: 'Neural' }, { id: 'terapia_16', name: 'Ozono' },
      { id: 'terapia_17', name: 'Exosomas' }, { id: 'terapia_18', name: 'Terapia BioCelular' },
      { id: 'terapia_19', name: 'Shot Umbilical' },
    ]
  },
  {
    id: 'cat_bioneural', title: 'Terapia BioNeural', type: 'BIONEURAL',
    items: [
      { id: 'bn_1', name: 'Adrenales' }, { id: 'bn_2', name: 'Articular' }, { id: 'bn_3', name: 'Cerebro' },
      { id: 'bn_4', name: 'Circulación Arterial' }, { id: 'bn_5', name: 'Circulación Micro' },
      { id: 'bn_6', name: 'Circulación Venosa' }, { id: 'bn_7', name: 'Corazón' },
      { id: 'bn_8', name: 'Disco' }, { id: 'bn_9', name: 'Energética General' },
      { id: 'bn_10', name: 'Gastrointestinal' }, { id: 'bn_11', name: 'Hígado' },
      { id: 'bn_12', name: 'Huesos' }, { id: 'bn_13', name: 'Inmuno Estimulante' },
      { id: 'bn_14', name: 'Inmuno Modulador' }, { id: 'bn_15', name: 'Linfático' },
      { id: 'bn_16', name: 'Médula Espinal' }, { id: 'bn_17', name: 'Médula Ósea' },
      { id: 'bn_18', name: 'Mucosa' }, { id: 'bn_19', name: 'Musculatura' },
      { id: 'bn_20', name: 'Páncreas' }, { id: 'bn_21', name: 'Piel' },
      { id: 'bn_22', name: 'Próstata' }, { id: 'bn_23', name: 'Reproductivo Femenino' },
      { id: 'bn_24', name: 'Reproductivo Masculino' }, { id: 'bn_25', name: 'Respiratorio' },
      { id: 'bn_26', name: 'Riñón' }, { id: 'bn_27', name: 'Sexual Femenina' },
      { id: 'bn_28', name: 'Sexual Masculina' }, { id: 'bn_29', name: 'Tiroides' },
      { id: 'bn_30', name: 'Vacuna Antivejez' }, { id: 'bn_31', name: 'Vejiga' },
      { id: 'bn_32', name: 'Vértigo' }, { id: 'bn_33', name: 'Vías Biliares' },
      { id: 'bn_34', name: 'Visión' }, { id: 'bn_35', name: 'Estreptococo' },
      { id: 'bn_36', name: 'Placenta Embrionaria' }, { id: 'bn_37', name: 'Psicoestabilizante' },
    ]
  },
  { id: 'cat_control_terapia', title: 'Control de Terapia', type: 'STANDARD', items: [] }
];

// --- Sub-components for Metabolic Activator ---
const HomeopathySelector = ({ selections, handleSelectionChange }: { selections: Selections, handleSelectionChange: Function }) => {
  const renderCheckbox = (name: string, category: string, subCategory?: string) => {
    const uniquePrefix = subCategory ? `${category}_${subCategory}` : category;
    const itemId = `am_hom_${uniquePrefix}_${name}`.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    return (
      <label key={itemId} className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary">
        <input type="checkbox" id={itemId} checked={(selections[itemId] as any)?.selected || false}
          onChange={(e) => handleSelectionChange(itemId, 'selected', e.target.checked)}
          className="w-4 h-4 accent-primary" />
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

const BachFlowerSelector = ({ selections, handleSelectionChange }: { selections: Selections, handleSelectionChange: Function }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
    {bachFlowersList.map(item => (
      <label key={item.id} className="flex items-center gap-2 text-sm p-3 bg-gray-50 rounded-lg border cursor-pointer hover:border-primary">
        <input type="checkbox" id={item.id} checked={(selections[item.id] as any)?.selected || false}
          onChange={(e) => handleSelectionChange(item.id, 'selected', e.target.checked)}
          className="w-4 h-4 accent-primary" />
        <span>{item.name}</span>
      </label>
    ))}
  </div>
);

// =============================================
// MAIN COMPONENT
// =============================================
interface PatientGuideProps {
  patient: PatientWithDetails;
  guideIdToLoad?: string | null;
}

export default function PatientGuide({ patient, guideIdToLoad }: PatientGuideProps) {
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
  const [isLoadingGuide, setIsLoadingGuide] = useState(false);

  useEffect(() => {
    if (guideIdToLoad) {
      const loadGuide = async () => {
        setIsLoadingGuide(true);
        const result = await getPatientGuideDetails(guideIdToLoad);
        if (result.success && result.data) {
          setSelections(result.data.selections as Selections);
          setObservaciones(result.data.observations || '');
          setGuideDate(new Date(result.data.createdAt).toISOString().split('T')[0]);
          toast.success("Guía cargada exitosamente.");
        } else {
          toast.error(result.error || "No se pudo cargar la guía.");
        }
        setIsLoadingGuide(false);
      };
      loadGuide();
    }
  }, [guideIdToLoad]);

  const toggleCategory = (categoryId: string) =>
    setOpenCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));

  const handleSelectionChange = (itemId: string, field: string, value: any) => {
    setSelections(prev => {
      const newSel = { ...prev };
      if (!newSel[itemId]) newSel[itemId] = {} as any;
      (newSel[itemId] as any)[field] = value;
      return newSel;
    });
  };

  const handleMetabolicHorarioChange = (horario: MetabolicHorario) => {
    const current = (selections['am_bioterapico'] as MetabolicFormItem) || {};
    const curr = Array.isArray(current.horario) ? current.horario : (current.horario ? [current.horario] : []);
    const next = curr.includes(horario) ? curr.filter(h => h !== horario) : [...curr, horario];
    handleSelectionChange('am_bioterapico', 'horario', next);
  };

  const handleAddNewItem = (categoryId: string) => {
    const name = newItemInputs[categoryId]?.trim();
    if (!name) return;
    const id = `new_${categoryId}_${Date.now()}`;
    setGuideData(prev => prev.map(cat =>
      cat.id === categoryId ? { ...cat, items: [...(cat.items as StandardGuideItem[]), { id, name }] } : cat
    ));
    setNewItemInputs(prev => ({ ...prev, [categoryId]: '' }));
  };

  const handleDeleteItem = (categoryId: string, itemId: string) => {
    setGuideData(prev => prev.map(cat =>
      cat.id === categoryId ? { ...cat, items: (cat.items as StandardGuideItem[]).filter(i => i.id !== itemId) } : cat
    ));
    setSelections(prev => { const s = { ...prev }; delete s[itemId]; return s; });
  };

  const handleSaveAndSend = async () => {
    setIsSaving(true);
    try {
      const result = await savePatientGuide(patient.id, { guideDate, selections, observaciones });
      if (result.success && result.guideId) {
        toast.success(result.message);
        sessionStorage.setItem('lastGuideId', result.guideId);
        setIsSendModalOpen(true);
      } else {
        toast.error(result.error || 'No se pudo guardar la guía.');
      }
    } catch {
      toast.error('Error de conexión al guardar la guía.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendAction = async (action: 'email' | 'whatsapp') => {
    const lastGuideId = sessionStorage.getItem('lastGuideId');
    if (!lastGuideId) { toast.error("No se encontró la guía."); return; }
    if (action === 'email') {
      toast.info("Enviando correo...");
      const r = await sendGuideByEmail(patient.id, lastGuideId);
      r.success ? toast.success(r.message) : toast.error(r.error || "No se pudo enviar.");
    } else {
      const msg = encodeURIComponent(`Hola ${patient.firstName}, su guía de tratamiento ha sido actualizada. Ábrala en la app Rejuvenate.`);
      window.open(`https://wa.me/${patient.phone}?text=${msg}`, '_blank');
    }
    setIsSendModalOpen(false);
    sessionStorage.removeItem('lastGuideId');
  };

  // =============================================
  // RENDERERS
  // =============================================
  const nutraFrequencyOptions = [
    "Mañana", "Noche",
    "30 min antes de Desayuno", "30 min antes de Cena",
    "30 min antes de Desayuno y Cena",
    "Con el Desayuno", "Con la Cena", "Con el Desayuno y la Cena",
    "Antes del Ejercicio", "Otros"
  ];
  const noniAloeTimeOptions: NoniAloeVeraTime[] = [
    '30 minutos antes de Desayuno',
    '30 minutos antes de Desayuno y Cena',
    '30 minutos antes de la Cena'
  ];
  const metabolicHorarioOptions: MetabolicHorario[] = [
    '30 min antes del Desayuno', '30 min antes del Almuerzo',
    '30 min antes de la Cena', '30 min antes del Desayuno y Cena',
    'o cada 15 min durante 1h en crisis'
  ];
  const sueroFrecuenciaOptions = ['Diaria', 'Semanal', 'Quincenal', 'Mensual'] as const;

  const renderRemocionItem = (item: RemocionItem) => {
    const sel = (selections[item.id] as RemocionFormItem) || {};
    const alimentacionOptions: RemocionAlimentacionType[] = ['Niño', 'Antienvejecimiento', 'Antidiabética', 'Metabólica', 'Citostática', 'Renal'];
    return (
      <div key={item.id} className="p-3 bg-gray-50 rounded-md">
        <div className="flex items-center gap-4">
          <input type="checkbox" id={item.id} checked={sel.selected || false}
            onChange={e => handleSelectionChange(item.id, 'selected', e.target.checked)}
            className="w-5 h-5 accent-primary" />
          <label htmlFor={item.id} className="font-medium text-gray-800">{item.name}</label>
        </div>
        {sel.selected && (
          <div className="mt-3 pl-9 space-y-3">
            {(item.subType === 'aceite_ricino' || item.subType === 'leche_magnesia') && (
              <div className="grid grid-cols-2 gap-4">
                <select value={sel.cucharadas ?? ''} onChange={e => handleSelectionChange(item.id, 'cucharadas', e.target.value === '' ? undefined : parseInt(e.target.value))} className="input text-sm py-1">
                  <option value="">Dosis...</option>
                  {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} cucharada(s)</option>)}
                </select>
                <select value={sel.horario ?? ''} onChange={e => handleSelectionChange(item.id, 'horario', e.target.value || undefined)} className="input text-sm py-1">
                  <option value="">Horario...</option>
                  <option value="al acostarse (1 sola vez)">al acostarse (1 sola vez)</option>
                  <option value="en el día">en el día</option>
                  <option value="en la tarde">en la tarde</option>
                </select>
              </div>
            )}
            {item.subType === 'detox_alcalina' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span>Por</span>
                  <input type="number" value={sel.semanas ?? ''} onChange={e => handleSelectionChange(item.id, 'semanas', e.target.value === '' ? undefined : parseInt(e.target.value))} className="input text-sm py-1 w-20" placeholder="N°" />
                  <span>semana(s) y luego:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {alimentacionOptions.map(opt => (
                    <label key={opt} className="flex items-center gap-1 text-sm">
                      <input type="checkbox" checked={sel.alimentacionTipo?.includes(opt) || false}
                        onChange={e => {
                          const curr = sel.alimentacionTipo || [];
                          handleSelectionChange(item.id, 'alimentacionTipo', e.target.checked ? [...curr, opt] : curr.filter(x => x !== opt));
                        }} />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {item.subType === 'noni_aloe' && (
              <div className="grid grid-cols-3 gap-4">
                <input type="number" placeholder="Cant." value={sel.tacita_qty ?? ''} onChange={e => handleSelectionChange(item.id, 'tacita_qty', e.target.value === '' ? undefined : parseInt(e.target.value))} className="input text-sm py-1" />
                <select value={sel.tacita ?? ''} onChange={e => handleSelectionChange(item.id, 'tacita', e.target.value as any)} className="input text-sm py-1">
                  <option value="">Tomar...</option>
                  {noniAloeTimeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <select value={sel.frascos ?? ''} onChange={e => handleSelectionChange(item.id, 'frascos', e.target.value === '' ? undefined : parseInt(e.target.value))} className="input text-sm py-1">
                  <option value="">Frascos...</option>
                  <option value="1">1 Frasco</option>
                  <option value="2">2 Frascos</option>
                  <option value="3">3 Frascos</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderRevitalizationItem = (item: RevitalizationGuideItem) => {
    const sel = (selections[item.id] as RevitalizationFormItem) || {};
    return (
      <div key={item.id} className="p-3 bg-blue-50 rounded-md border border-blue-200">
        <div className="flex items-center gap-4">
          <input type="checkbox" id={item.id} checked={sel.selected || false}
            onChange={e => handleSelectionChange(item.id, 'selected', e.target.checked)}
            className="w-5 h-5 accent-primary" />
          <label htmlFor={item.id} className="flex-grow font-semibold text-blue-800">{item.name}</label>
        </div>
        {sel.selected && (
          <div className="mt-3 pl-9 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Complejo B (cc)</label>
                <input type="text" placeholder="Ej: 3 cc" value={sel.complejoB_cc ?? ''}
                  onChange={e => handleSelectionChange(item.id, 'complejoB_cc', e.target.value)}
                  className="input text-sm py-1 w-full" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Otro medicamento (cc)</label>
                <div className="flex gap-2">
                  <select value={sel.otroMedicamento ?? ''} onChange={e => handleSelectionChange(item.id, 'otroMedicamento', e.target.value)} className="input text-sm py-1 flex-1">
                    <option value="">Seleccionar...</option>
                    <option value="Bioquel">Bioquel</option>
                    <option value="Procaína">Procaína</option>
                    <option value="Otro">Otro...</option>
                  </select>
                  <input type="text" placeholder="cc" value={sel.otro_cc ?? ''}
                    onChange={e => handleSelectionChange(item.id, 'otro_cc', e.target.value)}
                    className="input text-sm py-1 w-16" />
                </div>
                {sel.otroMedicamento === 'Otro' && (
                  <input type="text" placeholder="Especificar medicamento" value={sel.otroMedicamento_custom ?? ''}
                    onChange={e => handleSelectionChange(item.id, 'otroMedicamento_custom', e.target.value)}
                    className="input text-sm py-1 w-full mt-1" />
                )}
              </div>
              <div className="flex items-end gap-1 text-sm italic text-gray-600">
                <span className="font-semibold text-blue-700">intramuscular</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input type="number" min={1} max={7} placeholder="Veces/sem" value={sel.vecesXSemana ?? ''}
                onChange={e => handleSelectionChange(item.id, 'vecesXSemana', e.target.value === '' ? undefined : parseInt(e.target.value))}
                className="input text-sm py-1 w-24" />
              <span className="text-sm text-gray-500">veces por semana por</span>
              <input type="number" min={1} placeholder="N° dosis" value={sel.totalDosis ?? ''}
                onChange={e => handleSelectionChange(item.id, 'totalDosis', e.target.value === '' ? undefined : parseInt(e.target.value))}
                className="input text-sm py-1 w-24" />
              <span className="text-sm text-gray-500">dosis</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMetabolicActivator = () => {
    const sel = (selections['am_bioterapico'] as MetabolicFormItem) || {};
    const currentHorarios = Array.isArray(sel.horario) ? sel.horario : (sel.horario ? [sel.horario] : []);
    return (
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
          <div className="flex items-center gap-4">
            <input type="checkbox" id="am_bioterapico" checked={sel.selected || false}
              onChange={e => handleSelectionChange('am_bioterapico', 'selected', e.target.checked)}
              className="w-5 h-5 accent-primary" />
            <label htmlFor="am_bioterapico" className="font-semibold text-blue-800">Bioterápico + Bach (frasco combinado)</label>
          </div>
          {sel.selected && (
            <div className="mt-3 pl-9 space-y-4">
              <div className="flex items-center flex-wrap gap-3">
                <input type="number" min={1} max={20} value={sel.gotas ?? ''} onChange={e => handleSelectionChange('am_bioterapico', 'gotas', e.target.value === '' ? undefined : parseInt(e.target.value))} className="input text-sm py-1 w-20" placeholder="Gotas" />
                <span className="text-sm">gotas,</span>
                <input type="number" min={1} max={6} value={sel.vecesAlDia ?? ''} onChange={e => handleSelectionChange('am_bioterapico', 'vecesAlDia', e.target.value === '' ? undefined : parseInt(e.target.value))} className="input text-sm py-1 w-20" placeholder="Veces" />
                <span className="text-sm">veces al día, debajo de la lengua</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Horario:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {metabolicHorarioOptions.map(h => (
                    <label key={h} className="flex items-center gap-2 text-sm p-2 bg-white rounded border cursor-pointer hover:border-primary">
                      <input type="checkbox" checked={currentHorarios.includes(h)} onChange={() => handleMetabolicHorarioChange(h)} className="accent-primary" />
                      {h}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1">
            {(['homeopatia', 'bach'] as const).map(tab => (
              <button key={tab} type="button" onClick={() => setActiveMetabolicTab(tab)}
                className={`py-2 px-4 text-sm font-medium rounded-t-lg ${activeMetabolicTab === tab ? 'bg-white border-t border-x border-gray-200 text-primary' : 'text-gray-500 hover:text-gray-700 bg-gray-50'}`}>
                {tab === 'homeopatia' ? 'Homeopatía' : 'Flores de Bach'}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4 border-x border-b border-gray-200 rounded-b-lg -mt-px">
          {activeMetabolicTab === 'homeopatia' && <HomeopathySelector selections={selections} handleSelectionChange={handleSelectionChange} />}
          {activeMetabolicTab === 'bach' && <BachFlowerSelector selections={selections} handleSelectionChange={handleSelectionChange} />}
        </div>
      </div>
    );
  };

  const renderSueroItem = (item: StandardGuideItem, categoryId: string) => {
    const sel = (selections[item.id] as SueroFormItem) || {};
    return (
      <div key={item.id} className="p-3 bg-gray-50 rounded-md flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-1">
          <input type="checkbox" id={item.id} checked={sel.selected || false}
            onChange={e => handleSelectionChange(item.id, 'selected', e.target.checked)}
            className="w-5 h-5 accent-primary" />
          <label htmlFor={item.id} className="font-medium text-gray-800 text-sm">{item.name}</label>
        </div>
        {sel.selected && (
          <div className="pl-8 sm:pl-0 flex flex-wrap gap-2 items-center">
            <input type="text" placeholder="Dosis" value={sel.dosis ?? ''}
              onChange={e => handleSelectionChange(item.id, 'dosis', e.target.value)}
              className="input text-sm py-1 w-24" />
            <div className="flex gap-1">
              {sueroFrecuenciaOptions.map(f => (
                <button key={f} type="button"
                  onClick={() => handleSelectionChange(item.id, 'frecuencia', sel.frecuencia === f ? undefined : f)}
                  className={`px-2 py-1 text-[11px] font-bold rounded border transition-colors ${sel.frecuencia === f ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-200 hover:border-primary'}`}>
                  {f === 'Diaria' ? 'Día' : f === 'Semanal' ? 'Sem' : f === 'Quincenal' ? 'Qui' : 'Mes'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBioNeuralItem = (item: StandardGuideItem) => {
    const sel = (selections[item.id] as BioNeuralFormItem) || {};
    return (
      <div key={item.id} className="p-3 bg-gray-50 rounded-md flex items-center gap-3">
        <input type="checkbox" id={item.id} checked={sel.selected || false}
          onChange={e => handleSelectionChange(item.id, 'selected', e.target.checked)}
          className="w-5 h-5 accent-primary" />
        <label htmlFor={item.id} className="flex-grow font-medium text-gray-800 text-sm">{item.name}</label>
        {sel.selected && (
          <input type="text" placeholder="Dosis" value={sel.dosis ?? ''}
            onChange={e => handleSelectionChange(item.id, 'dosis', e.target.value)}
            className="input text-sm py-1 w-28" />
        )}
      </div>
    );
  };

  const renderStandardItem = (item: StandardGuideItem, categoryId: string) => {
    const sel = (selections[item.id] as StandardFormItem) || {};
    const isNutraceutico = ['cat_nutra_primarios', 'cat_nutra_secundarios', 'cat_nutra_complementarios'].includes(categoryId);
    return (
      <div key={item.id} className={`p-3 rounded-md transition-all ${sel.isClinicalPriority ? 'bg-sky-50 border-l-4 border-primary' : 'bg-gray-50 hover:bg-gray-100'}`}>
        <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
          <input type="checkbox" id={item.id} checked={sel.selected || false}
            onChange={e => handleSelectionChange(item.id, 'selected', e.target.checked)}
            className="w-5 h-5 accent-primary" />
          <label htmlFor={item.id} className="flex-grow font-medium text-gray-800 text-sm flex items-center gap-2">
            {item.name}
            {sel.personalizacion && <span className="text-xs text-primary font-semibold">{sel.personalizacion}</span>}
          </label>
          {'dose' in item && item.dose && (
            <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded">{item.dose}</span>
          )}
          <button type="button" onClick={() => handleDeleteItem(categoryId, item.id)} className="text-gray-300 hover:text-red-500 transition-colors ml-auto">
            <FaTrash size={12} />
          </button>
        </div>
        {sel.selected && (
          <div className="mt-2 pl-9 space-y-2">
            {isNutraceutico ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <input type="number" placeholder="Dosis" value={sel.qty ?? ''} onChange={e => handleSelectionChange(item.id, 'qty', e.target.value)} className="input text-sm py-1" min="1" max="10" />
                <select value={sel.doseType ?? ''} onChange={e => handleSelectionChange(item.id, 'doseType', e.target.value as any)} className="input text-sm py-1">
                  <option value="">Tipo...</option>
                  <option value="Capsulas">Cápsulas</option>
                  <option value="Tabletas">Tabletas</option>
                </select>
                <select value={sel.freq ?? ''} onChange={e => handleSelectionChange(item.id, 'freq', e.target.value)} className="input text-sm py-1">
                  <option value="">Frecuencia...</option>
                  {nutraFrequencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <input type="text" placeholder="Personalización: (5HTP, Saw Palmetto...)" value={sel.personalizacion ?? ''} onChange={e => handleSelectionChange(item.id, 'personalizacion', e.target.value)} className="input text-sm py-1" />
              </div>
            ) : !('dose' in item && item.dose) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input type="text" placeholder="Cant. / Instrucción" value={sel.qty ?? ''} onChange={e => handleSelectionChange(item.id, 'qty', e.target.value)} className="input text-sm py-1" />
                <input type="text" placeholder="Nota adicional" value={sel.custom ?? ''} onChange={e => handleSelectionChange(item.id, 'custom', e.target.value)} className="input text-sm py-1" />
              </div>
            ) : null}
          </div>
        )}
      </div>
    );
  };

  if (isLoadingGuide) {
    return <div className="card flex items-center justify-center min-h-[400px]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-primary text-white p-4 rounded-lg flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4"><FaUser className="text-xl" /><span className="font-semibold">{patient.firstName} {patient.lastName}</span></div>
        <div className="flex items-center gap-4"><FaCalendar className="text-xl" /><input type="date" value={guideDate} onChange={e => setGuideDate(e.target.value)} className="bg-white/20 border-none rounded-md p-2 text-sm text-white" /></div>
      </div>

      {/* Categories */}
      {guideData.map((category) => (
        <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div onClick={() => toggleCategory(category.id)} className="w-full flex justify-between items-center p-4 cursor-pointer bg-primary-dark text-white rounded-t-lg">
            <h3 className="font-semibold">{category.title}</h3>
            {openCategories[category.id] ? <FaChevronUp /> : <FaChevronDown />}
          </div>
          {openCategories[category.id] && (
            <div className="p-4 space-y-3">
              {category.type === 'REMOCION' && (
                <>
                  {(category.items as (RemocionItem | StandardGuideItem)[]).filter((i): i is RemocionItem => 'subType' in i).map(renderRemocionItem)}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200 mt-4">
                    <input type="text" placeholder="Añadir nuevo producto..." value={newItemInputs[category.id] ?? ''} onChange={e => setNewItemInputs(p => ({ ...p, [category.id]: e.target.value }))} className="input flex-grow" />
                    <button type="button" onClick={() => handleAddNewItem(category.id)} className="btn-primary py-2 px-4 flex items-center gap-2 text-sm"><FaPlus /> Añadir</button>
                  </div>
                </>
              )}
              {category.type === 'REVITALIZATION' && (category.items as RevitalizationGuideItem[]).map(renderRevitalizationItem)}
              {category.type === 'METABOLIC' && renderMetabolicActivator()}
              {category.type === 'SUERO' && (
                <>
                  <div className="grid grid-cols-1 gap-2">
                    {(category.items as StandardGuideItem[]).map(item => renderSueroItem(item, category.id))}
                  </div>
                </>
              )}
              {category.type === 'BIONEURAL' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(category.items as StandardGuideItem[]).map(renderBioNeuralItem)}
                </div>
              )}
              {category.type === 'STANDARD' && (
                <>
                  {(category.items as StandardGuideItem[]).map(item => renderStandardItem(item, category.id))}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200 mt-4">
                    <input type="text" placeholder="Añadir nuevo ítem..." value={newItemInputs[category.id] ?? ''} onChange={e => setNewItemInputs(p => ({ ...p, [category.id]: e.target.value }))} className="input flex-grow" />
                    <button type="button" onClick={() => handleAddNewItem(category.id)} className="btn-primary py-2 px-4 flex items-center gap-2 text-sm"><FaPlus /> Añadir</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Observaciones */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-2">Observaciones</h3>
        <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} className="input w-full" rows={4} placeholder="Notas adicionales para el paciente..." />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 mt-8">
        <button type="button" onClick={() => setIsPreviewOpen(true)} className="btn-secondary flex items-center gap-2"><FaEye /> Vista Previa</button>
        <button type="button" onClick={() => { setIsPreviewOpen(true); setTimeout(() => window.print(), 500); }} className="btn-secondary flex items-center gap-2"><FaPrint /> Imprimir / PDF</button>
        <button type="button" onClick={handleSaveAndSend} disabled={isSaving} className="btn-primary flex items-center gap-2">
          <FaPaperPlane /> {isSaving ? 'Guardando...' : 'Guardar y Enviar'}
        </button>
      </div>

      {isPreviewOpen && <PatientGuidePreview patient={patient} formValues={{ guideDate, selections, observaciones }} guideData={guideData} onClose={() => setIsPreviewOpen(false)} />}

      {isSendModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center relative">
            <button onClick={() => setIsSendModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FaTimes size={20} /></button>
            <h3 className="text-xl font-bold text-primary-dark mb-2">¡Guía Enviada a la App!</h3>
            <p className="text-gray-600 mb-6 text-sm">La guía está disponible en la app del paciente. ¿Deseas notificarle también por otro medio?</p>
            <div className="space-y-4">
              <button onClick={() => handleSendAction('email')} className="w-full btn-primary flex items-center justify-center gap-3"><FaEnvelope /> Enviar por Correo</button>
              <button onClick={() => handleSendAction('whatsapp')} className="w-full btn-success flex items-center justify-center gap-3"><FaMobileAlt /> Notificar por WhatsApp</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}