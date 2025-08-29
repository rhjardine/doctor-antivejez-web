'use client';

import React, { useState, useRef } from 'react';
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
import { savePatientGuide, sendPatientGuideByEmail } from '@/lib/actions/guide.actions';
import { useReactToPrint } from 'react-to-print';

// ... [Mantener toda la estructura de datos existente: homeopathicStructure, bachFlowersList, etc.]

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
    items: [{ id: 'rev_1', name: 'Complejo B + Otro' }],
  },
  {
    id: 'cat_nutra_primarios',
    title: 'Nutracéuticos Primarios',
    type: 'STANDARD',
    items: [
      { id: 'nutra_prim_1', name: 'Vitamina C' },
      { id: 'nutra_prim_2', name: 'Vitamina D3' },
      { id: 'nutra_prim_3', name: 'Omega 3' },
      { id: 'nutra_prim_4', name: 'Magnesio' },
      { id: 'nutra_prim_5', name: 'Zinc' },
    ],
  },
  {
    id: 'cat_nutra_secundarios',
    title: 'Nutracéuticos Secundarios',
    type: 'STANDARD',
    items: [
      { id: 'nutra_sec_1', name: 'Coenzima Q10' },
      { id: 'nutra_sec_2', name: 'Resveratrol' },
      { id: 'nutra_sec_3', name: 'Curcumina' },
    ],
  },
  {
    id: 'cat_nutra_complementarios',
    title: 'Nutracéuticos Complementarios',
    type: 'STANDARD',
    items: [
      { id: 'nutra_comp_1', name: 'Probióticos' },
      { id: 'nutra_comp_2', name: 'Enzimas Digestivas' },
    ],
  },
  {
    id: 'cat_cosmeceuticos',
    title: 'Cosmecéuticos',
    type: 'STANDARD',
    items: [
      { id: 'cosme_1', name: 'Crema Antioxidante' },
      { id: 'cosme_2', name: 'Sérum Regenerador' },
    ],
  },
  {
    id: 'cat_activador',
    title: 'Activador Metabólico',
    type: 'METABOLIC',
    items: [{ id: 'am_bioterapico', name: 'Bioterápico + Bach' }],
  },
  {
    id: 'cat_formulas_naturales',
    title: 'Fórmulas Naturales',
    type: 'STANDARD',
    items: [
      { id: 'form_nat_1', name: 'Tintura Hepática' },
      { id: 'form_nat_2', name: 'Jarabe Respiratorio' },
    ],
  },
  {
    id: 'cat_sueros',
    title: 'Sueros - Shot Antivejez',
    type: 'STANDARD',
    items: [
      { id: 'suero_1', name: 'Suero Vitamínico', dose: '1 ampolla IM semanal' },
      { id: 'suero_2', name: 'Cocktail Antioxidante', dose: '2 ampollas IV cada 15 días' },
    ],
  },
  {
    id: 'cat_terapias',
    title: 'Terapias Antienvejecimiento',
    type: 'STANDARD',
    items: [
      { id: 'terapia_1', name: 'Ozonoterapia' },
      { id: 'terapia_2', name: 'Quelación' },
    ],
  },
  {
    id: 'cat_control_terapia',
    title: 'Control de Terapia',
    type: 'STANDARD',
    items: [],
  },
];

const nutraFrequencyOptions = [
  'Una vez al día', 'Dos veces al día', 'Tres veces al día',
  'Una vez cada dos días', 'Dos veces por semana', 'Una vez por semana'
];

const sueroTerapiaFrequencyOptions = [
  'Semanal', 'Cada 15 días', 'Mensual', 'Según indicación médica'
];

interface Props {
  patient: PatientWithDetails;
}

export default function PatientGuide({ patient }: Props) {
  const [guideData, setGuideData] = useState<GuideCategory[]>(initialGuideData);
  const [guideDate, setGuideDate] = useState(new Date().toISOString().split('T')[0]);
  const [selections, setSelections] = useState<Selections>({});
  const [observaciones, setObservaciones] = useState('');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [newItemInputs, setNewItemInputs] = useState<Record<string, string>>({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // Estados para el activador metabólico
  const [activeMetabolicTab, setActiveMetabolicTab] = useState<'homeopatia' | 'bach'>('homeopatia');
  
  // Ref para componente de impresión
  const printComponentRef = useRef<PatientGuidePreview>(null);

  // Hook para manejar impresión con react-to-print
  const handlePrint = useReactToPrint({
    content: () => printComponentRef.current,
    documentTitle: `Guia_Tratamiento_${patient.firstName}_${patient.lastName}_${new Date().toISOString().split('T')[0]}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `,
    onBeforeGetContent: () => {
      return Promise.resolve();
    },
    onAfterPrint: () => {
      toast.success('Guía lista para imprimir/guardar como PDF');
    },
  });

  // Función para crear lista de ítems nuevos dinámicos
  const createNewItemsList = (): { tempId: string; name: string; categoryId: string }[] => {
    const newItems: { tempId: string; name: string; categoryId: string }[] = [];
    
    // Buscar todos los ítems que tienen IDs temporales (empiezan con 'temp_')
    Object.keys(selections).forEach(itemId => {
      if (itemId.startsWith('temp_') && selections[itemId]?.selected) {
        // Extraer información del ID temporal
        const parts = itemId.split('_');
        if (parts.length >= 3) {
          const categoryId = parts.slice(1, -1).join('_'); // Todo excepto 'temp' y el último número
          const tempId = itemId;
          
          // Buscar el nombre del ítem en guideData
          const category = guideData.find(cat => cat.id === categoryId);
          if (category) {
            const item = category.items.find(item => 'id' in item && item.id === itemId);
            if (item && 'name' in item) {
              newItems.push({
                tempId,
                name: item.name,
                categoryId,
              });
            }
          }
        }
      }
    });
    
    return newItems;
  };

  const handleSaveAndSend = async () => {
    if (!patient?.id) {
      toast.error('No se pudo identificar al paciente');
      return;
    }

    setIsSaving(true);

    try {
      const formData = { guideDate, selections, observaciones };
      const newItems = createNewItemsList();
      
      const result = await savePatientGuide(patient.id, formData, newItems);

      if (result.success) {
        toast.success(result.message || 'Guía guardada exitosamente');
        setIsSendModalOpen(true);
      } else {
        toast.error(result.error || 'Error al guardar la guía');
      }
    } catch (error) {
      console.error('Error saving guide:', error);
      toast.error('Ocurrió un error inesperado al guardar la guía');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendAction = async (method: 'email' | 'whatsapp') => {
    if (!patient?.email && method === 'email') {
      toast.error('El paciente no tiene correo electrónico registrado');
      return;
    }

    setIsGeneratingPDF(true);
    
    try {
      if (method === 'email') {
        const formData = { guideDate, selections, observaciones };
        const result = await sendPatientGuideByEmail(patient.id, formData, guideData);
        
        if (result.success) {
          toast.success('Guía enviada por correo exitosamente');
        } else {
          toast.error(result.error || 'Error al enviar el correo');
        }
      } else if (method === 'whatsapp') {
        // Generar URL de WhatsApp con mensaje personalizado
        const message = `Hola ${patient.firstName}, te envío tu Guía de Tratamiento personalizada. Por favor revísala y sigue las indicaciones. Cualquier duda, contáctame.`;
        const whatsappUrl = `https://wa.me/${patient.phoneNumber?.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        toast.success('WhatsApp abierto. Puedes adjuntar la guía manualmente.');
      }
    } catch (error) {
      console.error('Error sending guide:', error);
      toast.error('Error al procesar la solicitud de envío');
    } finally {
      setIsGeneratingPDF(false);
      setIsSendModalOpen(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleSelectionChange = (itemId: string, field: string, value: any) => {
    setSelections(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }));
  };

  const handleAddNewItem = (categoryId: string) => {
    const newItemName = newItemInputs[categoryId]?.trim();
    if (!newItemName) return;

    const tempId = `temp_${categoryId}_${Date.now()}`;
    const newItem: StandardGuideItem = {
      id: tempId,
      name: newItemName
    };

    setGuideData(prevData =>
      prevData.map(category =>
        category.id === categoryId
          ? {
              ...category,
              items: [...category.items, newItem]
            }
          : category
      )
    );

    setSelections(prev => ({
      ...prev,
      [tempId]: { selected: true }
    }));

    setNewItemInputs(prev => ({
      ...prev,
      [categoryId]: ''
    }));

    toast.success('Ítem añadido exitosamente');
  };

  const handleDeleteItem = (categoryId: string, itemId: string) => {
    setGuideData(prevData =>
      prevData.map(category =>
        category.id === categoryId
          ? {
              ...category,
              items: category.items.filter(item => 'id' in item && item.id !== itemId)
            }
          : category
      )
    );

    setSelections(prev => {
      const newSelections = { ...prev };
      delete newSelections[itemId];
      return newSelections;
    });

    toast.success('Ítem eliminado');
  };

  // [Mantener todos los métodos de renderizado existentes: HomeopathySelector, BachFlowerSelector, renderRemocionItem, etc.]

  const HomeopathySelector = () => {
    const renderHomeopathyGroup = (title: string, items: string[] | Record<string, string[]>, parentKey?: string) => {
      if (Array.isArray(items)) {
        return (
          <div key={title} className="mb-4">
            <h5 className="font-medium text-gray-700 mb-2">{title}</h5>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {items.map(item => {
                const uniquePrefix = parentKey ? `${parentKey}_${title}` : title;
                const itemId = `am_hom_${uniquePrefix}_${item}`.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
                return (
                  <label key={itemId} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
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
        );
      } else {
        return (
          <div key={title} className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">{title}</h4>
            {Object.entries(items).map(([subTitle, subItems]) => 
              renderHomeopathyGroup(subTitle, subItems, title)
            )}
          </div>
        );
      }
    };

    return (
      <div className="max-h-96 overflow-y-auto space-y-4">
        {Object.entries(homeopathicStructure).map(([title, items]) => 
          renderHomeopathyGroup(title, items)
        )}
      </div>
    );
  };

  const BachFlowerSelector = ({ selections, handleSelectionChange }: any) => (
    <div className="max-h-96 overflow-y-auto">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
        {bachFlowersList.map(flower => (
          <label key={flower.id} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selections[flower.id]?.selected || false}
              onChange={(e) => handleSelectionChange(flower.id, 'selected', e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span>{flower.name}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderRemocionItem = (item: RemocionItem) => {
    const selection = selections[item.id] as RemocionFormItem || {};

    return (
      <div key={item.id} className="p-3 bg-gray-50 rounded-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id={item.id}
              checked={selection.selected || false}
              onChange={(e) => handleSelectionChange(item.id, 'selected', e.target.checked)}
              className="w-5 h-5 accent-primary"
            />
            <label htmlFor={item.id} className="font-medium text-gray-800">
              {item.name}
            </label>
          </div>
          <button
            type="button"
            onClick={() => handleDeleteItem('cat_remocion', item.id)}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <FaTrash />
          </button>
        </div>

        {selection.selected && (
          <div className="ml-8 space-y-3">
            {(item.subType === 'aceite_ricino' || item.subType === 'leche_magnesia') && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Cucharadas</label>
                  <input
                    type="number"
                    value={selection.cucharadas || ''}
                    onChange={(e) => handleSelectionChange(item.id, 'cucharadas', parseInt(e.target.value))}
                    className="input text-sm py-1 w-full"
                    placeholder="Cantidad"
                    min="1"
                    max="10"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Horario</label>
                  <select
                    value={selection.horario || ''}
                    onChange={(e) => handleSelectionChange(item.id, 'horario', e.target.value as any)}
                    className="input text-sm py-1 w-full"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="en el día">En el día</option>
                    <option value="en la tarde">En la tarde</option>
                    <option value="en la noche al acostarse">En la noche al acostarse</option>
                  </select>
                </div>
              </div>
            )}

            {item.subType === 'detox_alcalina' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Semanas</label>
                  <input
                    type="number"
                    value={selection.semanas || ''}
                    onChange={(e) => handleSelectionChange(item.id, 'semanas', parseInt(e.target.value))}
                    className="input text-sm py-1 w-32"
                    placeholder="Duración"
                    min="1"
                    max="12"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Tipo de Alimentación</label>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {(['Niño', 'Antienvejecimiento', 'Antidiabética', 'Metabólica', 'Citostática', 'Renal'] as RemocionAlimentacionType[]).map(tipo => (
                      <label key={tipo} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={(selection.alimentacionTipo || []).includes(tipo)}
                          onChange={(e) => {
                            const current = selection.alimentacionTipo || [];
                            const updated = e.target.checked
                              ? [...current, tipo]
                              : current.filter(t => t !== tipo);
                            handleSelectionChange(item.id, 'alimentacionTipo', updated);
                          }}
                          className="w-4 h-4 accent-primary"
                        />
                        <span>{tipo}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {item.subType === 'noni_aloe' && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Tacitas</label>
                  <input
                    type="number"
                    value={selection.tacita_qty || ''}
                    onChange={(e) => handleSelectionChange(item.id, 'tacita_qty', parseInt(e.target.value))}
                    className="input text-sm py-1 w-full"
                    placeholder="Cant."
                    min="1"
                    max="5"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Momento</label>
                  <select
                    value={selection.tacita || ''}
                    onChange={(e) => handleSelectionChange(item.id, 'tacita', e.target.value as NoniAloeVeraTime)}
                    className="input text-sm py-1 w-full"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="30 minutos antes de Desayuno">30 min antes Desayuno</option>
                    <option value="30 minutos antes de Desayuno y Cena">30 min antes Desayuno y Cena</option>
                    <option value="30 minutos antes de la Cena">30 min antes Cena</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Frascos</label>
                  <input
                    type="number"
                    value={selection.frascos || ''}
                    onChange={(e) => handleSelectionChange(item.id, 'frascos', parseInt(e.target.value))}
                    className="input text-sm py-1 w-full"
                    placeholder="Total"
                    min="1"
                    max="12"
                  />
                </div>
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
      <div key={item.id} className="p-3 bg-gray-50 rounded-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id={item.id}
              checked={selection.selected || false}
              onChange={(e) => handleSelectionChange(item.id, 'selected', e.target.checked)}
              className="w-5 h-5 accent-primary"
            />
            <label htmlFor={item.id} className="font-medium text-gray-800">
              {item.name}
            </label>
          </div>
          <button
            type="button"
            onClick={() => handleDeleteItem('cat_revitalizacion', item.id)}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <FaTrash />
          </button>
        </div>

        {selection.selected && (
          <div className="ml-8 grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Complejo B (cc)</label>
              <input
                type="text"
                value={selection.complejoB_cc || ''}
                onChange={(e) => handleSelectionChange(item.id, 'complejoB_cc', e.target.value)}
                className="input text-sm py-1 w-full"
                placeholder="3 cc"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Bioquel (cc)</label>
              <input
                type="text"
                value={selection.bioquel_cc || ''}
                onChange={(e) => handleSelectionChange(item.id, 'bioquel_cc', e.target.value)}
                className="input text-sm py-1 w-full"
                placeholder="3 cc"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Frecuencia</label>
              <select
                value={selection.frequency || ''}
                onChange={(e) => handleSelectionChange(item.id, 'frequency', e.target.value as any)}
                className="input text-sm py-1 w-full"
              >
                <option value="">Seleccionar...</option>
                <option value="1 vez por semana por 10 dosis">1 vez/semana x 10</option>
                <option value="2 veces por semana por 10 dosis">2 veces/semana x 10</option>
              </select>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMetabolicActivator = () => {
    const bioTerapicoSelection = selections['am_bioterapico'] as MetabolicFormItem || {};
    const currentHorarios = Array.isArray(bioTerapicoSelection.horario) 
      ? bioTerapicoSelection.horario 
      : bioTerapicoSelection.horario 
        ? [bioTerapicoSelection.horario] 
        : [];

    const handleMetabolicHorarioChange = (horario: 'Desayuno y Cena' | 'Emergencia') => {
      const isSelected = currentHorarios.includes(horario);
      const newHorarios = isSelected
        ? currentHorarios.filter(h => h !== horario)
        : [...currentHorarios, horario];
      
      handleSelectionChange('am_bioterapico', 'horario', newHorarios);
    };

    return (
      <div className="space-y-4">
        <div className="p-3 bg-gray-50 rounded-md">
          <div className="flex items-center gap-3 mb-3">
            <input
              type="checkbox"
              id="am_bioterapico"
              checked={bioTerapicoSelection.selected || false}
              onChange={(e) => handleSelectionChange('am_bioterapico', 'selected', e.target.checked)}
              className="w-5 h-5 accent-primary"
            />
            <label htmlFor="am_bioterapico" className="font-medium text-gray-800">
              Bioterápico + Bach
            </label>
          </div>

          {bioTerapicoSelection.selected && (
            <div className="ml-8 space-y-3">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <input
                  type="number"
                  value={bioTerapicoSelection.gotas || 5}
                  onChange={(e) => handleSelectionChange('am_bioterapico', 'gotas', parseInt(e.target.value))}
                  className="input text-sm py-1 w-16"
                  placeholder="Gotas"
                  min="1"
                  max="20"
                />
                <span>gotas,</span>
                <input
                  type="number"
                  value={bioTerapicoSelection.vecesAlDia || 2}
                  onChange={(e) => handleSelectionChange('am_bioterapico', 'vecesAlDia', parseInt(e.target.value))}
                  className="input text-sm py-1 w-20"
                  placeholder="Veces"
                />
                <span>veces al día debajo de la lengua:</span>
              </p>
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={currentHorarios.includes('Desayuno y Cena')}
                    onChange={() => handleMetabolicHorarioChange('Desayuno y Cena')}
                  />
                  30 min antes de Desayuno y Cena
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={currentHorarios.includes('Emergencia')}
                    onChange={() => handleMetabolicHorarioChange('Emergencia')}
                  />
                  o cada 15 min / 1h en crisis
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex space-x-1">
            <button
              type="button"
              onClick={() => setActiveMetabolicTab('homeopatia')}
              className={`py-2 px-4 text-sm font-medium rounded-t-lg ${
                activeMetabolicTab === 'homeopatia'
                  ? 'bg-white border-t border-x border-gray-200 text-primary'
                  : 'text-gray-500 hover:text-gray-700 bg-gray-50'
              }`}
            >
              Homeopatía
            </button>
            <button
              type="button"
              onClick={() => setActiveMetabolicTab('bach')}
              className={`py-2 px-4 text-sm font-medium rounded-t-lg ${
                activeMetabolicTab === 'bach'
                  ? 'bg-white border-t border-x border-gray-200 text-primary'
                  : 'text-gray-500 hover:text-gray-700 bg-gray-50'
              }`}
            >
              Flores de Bach
            </button>
          </nav>
        </div>
        <div className="p-4 border-x border-b border-gray-200 rounded-b-lg -mt-px">
          {activeMetabolicTab === 'homeopatia' && <HomeopathySelector />}
          {activeMetabolicTab === 'bach' && (
            <BachFlowerSelector
              selections={selections}
              handleSelectionChange={handleSelectionChange}
            />
          )}
        </div>
      </div>
    );
  };

  const renderStandardItem = (item: StandardGuideItem | MetabolicActivatorItem, categoryId: string, frequencyOptions: string[]) => {
    const selection = selections[item.id] as StandardFormItem || {};
    const isNutraceutico = ['cat_nutra_primarios', 'cat_nutra_secundarios', 'cat_nutra_complementarios', 'cat_cosmeceuticos'].includes(categoryId);

    return (
      <div key={item.id} className="p-3 bg-gray-50 rounded-md transition-all hover:bg-gray-100">
        <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
          <input
            type="checkbox"
            id={item.id}
            checked={selection.selected || false}
            onChange={(e) => handleSelectionChange(item.id, 'selected', e.target.checked)}
            className="w-5 h-5 accent-primary"
          />
          <label htmlFor={item.id} className="flex-grow font-medium text-gray-800 text-sm">
            {item.name}
          </label>
          {'dose' in item && item.dose && (
            <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded">
              {item.dose}
            </span>
          )}
          <button
            type="button"
            onClick={() => handleDeleteItem(categoryId, item.id)}
            className="text-gray-400 hover:text-red-500 transition-colors ml-auto"
          >
            <FaTrash />
          </button>
        </div>

        {selection.selected && !('dose' in item) && (
          isNutraceutico ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2 pl-9">
              <input
                type="number"
                placeholder="Dosis"
                value={selection.qty ?? ''}
                onChange={(e) => handleSelectionChange(item.id, 'qty', e.target.value)}
                className="input text-sm py-1"
                min="1"
                max="10"
              />
              <select
                value={selection.doseType ?? ''}
                onChange={(e) => handleSelectionChange(item.id, 'doseType', e.target.value as any)}
                className="input text-sm py-1"
              >
                <option value="">Tipo...</option>
                <option value="Capsulas">Cápsulas</option>
                <option value="Tabletas">Tabletas</option>
                <option value="Cucharaditas">Cucharaditas</option>
              </select>
              <select
                value={selection.freq ?? ''}
                onChange={(e) => handleSelectionChange(item.id, 'freq', e.target.value)}
                className="input text-sm py-1"
              >
                <option value="">Frecuencia...</option>
                {frequencyOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Suplemento personalizado"
                value={selection.custom ?? ''}
                onChange={(e) => handleSelectionChange(item.id, 'custom', e.target.value)}
                className="input text-sm py-1"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 pl-9">
              <input
                type="text"
                placeholder="Cant."
                value={selection.qty ?? ''}
                onChange={(e) => handleSelectionChange(item.id, 'qty', e.target.value)}
                className="input text-sm py-1"
              />
              <select
                value={selection.freq ?? ''}
                onChange={(e) => handleSelectionChange(item.id, 'freq', e.target.value)}
                className="input text-sm py-1"
              >
                <option value="">Frecuencia...</option>
                {frequencyOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Suplemento personalizado"
                value={selection.custom ?? ''}
                onChange={(e) => handleSelectionChange(item.id, 'custom', e.target.value)}
                className="input text-sm py-1"
              />
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-primary text-white p-4 rounded-lg flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <FaUser className="text-xl" />
          <span className="font-semibold">{patient.firstName} {patient.lastName}</span>
        </div>
        <div className="flex items-center gap-4">
          <FaCalendar className="text-xl" />
          <input
            type="date"
            value={guideDate}
            onChange={(e) => setGuideDate(e.target.value)}
            className="bg-white/20 border-none rounded-md p-2 text-sm text-white"
          />
        </div>
      </div>

      {guideData.map((category) => (
        <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div
            onClick={() => toggleCategory(category.id)}
            className="w-full flex justify-between items-center p-4 cursor-pointer bg-primary-dark text-white rounded-t-lg"
          >
            <h3 className="font-semibold">{category.title}</h3>
            {openCategories[category.id] ? <FaChevronUp /> : <FaChevronDown />}
          </div>
          {openCategories[category.id] && (
            <div className="p-4">
              <div className="space-y-4">
                {category.type === 'REMOCION' && (
                  <>
                    {(category.items as (RemocionItem | StandardGuideItem)[])
                      .filter((item): item is RemocionItem => 'subType' in item)
                      .map(item => renderRemocionItem(item))}
                    {(category.items as (RemocionItem | StandardGuideItem)[])
                      .filter((item): item is StandardGuideItem => !('subType' in item))
                      .map(item => renderStandardItem(item, category.id, []))}
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-200 mt-4">
                      <input
                        type="text"
                        placeholder="Añadir nuevo producto de remoción..."
                        value={newItemInputs[category.id] ?? ''}
                        onChange={(e) => setNewItemInputs(prev => ({ ...prev, [category.id]: e.target.value }))}
                        className="input flex-grow"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddNewItem(category.id)}
                        className="btn-primary py-2 px-4 flex items-center gap-2 text-sm"
                      >
                        <FaPlus /> Añadir
                      </button>
                    </div>
                  </>
                )}
                {category.type === 'REVITALIZATION' && 
                  (category.items as RevitalizationGuideItem[]).map(item => renderRevitalizationItem(item))
                }
                {category.type === 'METABOLIC' && renderMetabolicActivator()}
                {category.type === 'STANDARD' && (
                  <>
                    {(category.items as StandardGuideItem[]).map(item => {
                      const freqOptions = (['cat_sueros', 'cat_terapias'].includes(category.id))
                        ? sueroTerapiaFrequencyOptions
                        : nutraFrequencyOptions;
                      return renderStandardItem(item, category.id, freqOptions);
                    })}
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-200 mt-4">
                      <input
                        type="text"
                        placeholder="Añadir nuevo ítem..."
                        value={newItemInputs[category.id] ?? ''}
                        onChange={(e) => setNewItemInputs(prev => ({ ...prev, [category.id]: e.target.value }))}
                        className="input flex-grow"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddNewItem(category.id)}
                        className="btn-primary py-2 px-4 flex items-center gap-2 text-sm"
                      >
                        <FaPlus /> Añadir
                      </button>
                    </div>
                  </>
                )}
              </div>
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
        <button
          type="button"
          onClick={() => setIsPreviewOpen(true)}
          className="btn-secondary flex items-center gap-2"
        >
          <FaEye /> Vista Previa
        </button>
        <button
          type="button"
          onClick={() => {
            setIsPreviewOpen(true);
            setTimeout(() => {
              handlePrint();
            }, 500);
          }}
          className="btn-secondary flex items-center gap-2"
          disabled={isGeneratingPDF}
        >
          <FaPrint /> {isGeneratingPDF ? 'Generando...' : 'Imprimir'}
        </button>
        <button
          type="button"
          onClick={handleSaveAndSend}
          disabled={isSaving}
          className="btn-primary flex items-center gap-2"
        >
          <FaPaperPlane /> {isSaving ? 'Guardando...' : 'Guardar y Enviar'}
        </button>
      </div>

      {isPreviewOpen && (
        <PatientGuidePreview
          ref={printComponentRef}
          patient={patient}
          formValues={{ guideDate, selections, observaciones }}
          guideData={guideData}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}

      {isSendModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center relative animate-slideUp">
            <button
              onClick={() => setIsSendModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <FaTimes size={20} />
            </button>
            <h3 className="text-xl font-bold text-primary-dark mb-2">Guía Guardada</h3>
            <p className="text-gray-600 mb-6">¿Cómo deseas enviar la guía al paciente?</p>
            <div className="space-y-4">
              <button
                onClick={() => handleSendAction('email')}
                disabled={isGeneratingPDF}
                className="w-full btn-primary flex items-center justify-center gap-3"
              >
                <FaEnvelope /> {isGeneratingPDF ? 'Enviando...' : 'Enviar por Correo'}
              </button>
              <button
                onClick={() => handleSendAction('whatsapp')}
                className="w-full btn-success flex items-center justify-center gap-3"
              >
                <FaMobileAlt /> Enviar por WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}