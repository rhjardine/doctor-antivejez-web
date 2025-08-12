// src/components/patient-guide/PatientGuide.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch, useFieldArray } from 'react-hook-form';
import { PatientWithDetails } from '@/types';
import {
  GuideFormValues,
  GuideCategory,
  GuideItemType,
  MetabolicActivator,
} from '@/types/guide';
import { getGuideTemplate, savePatientGuide } from '@/lib/actions/guide.actions';
import PatientGuidePreview from './PatientGuidePreview';
import { toast } from 'sonner';
import {
  FaUser, FaCalendar, FaChevronDown, FaChevronUp, FaPlus, FaEye, FaPaperPlane, FaTrash,
} from 'react-icons/fa';

export default function PatientGuide({ patient }: { patient: PatientWithDetails }) {
  const [guideTemplate, setGuideTemplate] = useState<GuideCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [newItemInputs, setNewItemInputs] = useState<Record<string, string>>({});

  const { register, handleSubmit, control, getValues, setValue } = useForm<GuideFormValues>({
    defaultValues: {
      guideDate: new Date().toISOString().split('T')[0],
      selections: {},
      metabolic_activator: { homeopathy: {}, bachFlowers: {} },
      customItems: [],
    },
  });

  const { fields: customItems, append, remove } = useFieldArray({
    control,
    name: "customItems",
  });

  // Carga la plantilla de la guía desde la base de datos
  useEffect(() => {
    const loadTemplate = async () => {
      setLoading(true);
      const result = await getGuideTemplate();
      if (result.success && result.data) {
        setGuideTemplate(result.data);
        const initialOpen: Record<string, boolean> = {};
        result.data.slice(0, 2).forEach(cat => {
          initialOpen[cat.id] = true;
        });
        setOpenCategories(initialOpen);
      } else {
        toast.error(result.error || 'Error desconocido al cargar la guía.');
      }
      setLoading(false);
    };
    loadTemplate();
  }, []);

  const onSubmit = async (data: GuideFormValues) => {
    const result = await savePatientGuide(patient.id, data);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.error);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const handleAddNewItem = (categoryId: string) => {
    const newItemName = newItemInputs[categoryId];
    if (!newItemName?.trim()) return;

    append({
      categoryId: categoryId,
      name: newItemName.trim(),
      qty: '',
      freq: '',
      custom: '',
    });

    setNewItemInputs(prev => ({ ...prev, [categoryId]: '' }));
  };

  const frequencyOptions = ["Mañana", "Noche", "30 min antes de Desayuno", "30 min antes de Cena", "Antes del Ejercicio", "Otros"];
  const selections = useWatch({ control, name: 'selections' });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="loader"></div></div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-primary text-white p-4 rounded-lg flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4"><FaUser className="text-xl" /><span className="font-semibold">{patient.firstName} {patient.lastName}</span></div>
        <div className="flex items-center gap-4"><FaCalendar className="text-xl" /><input type="date" {...register('guideDate')} className="bg-white/20 border-none rounded-md p-2 text-sm"/></div>
      </div>

      {guideTemplate.map((category) => (
        <div key={category.id} className="card p-0">
          <header onClick={() => toggleCategory(category.id)} className="w-full flex justify-between items-center p-4 cursor-pointer bg-primary-dark text-white rounded-t-lg">
            <h3 className="font-semibold">{category.title}</h3>
            {openCategories[category.id] ? <FaChevronUp /> : <FaChevronDown />}
          </header>
          {openCategories[category.id] && (
            <div className="p-4 space-y-4">
              {category.items.map(item => {
                const isSelected = selections?.[item.id]?.selected;
                switch (category.type) {
                  case GuideItemType.REVITALIZATION:
                    return (
                      <div key={item.id} className="p-3 bg-blue-50/80 rounded-md border border-blue-200 space-y-3">
                        <div className="flex items-center gap-4"><input type="checkbox" {...register(`selections.${item.id}.selected`)} className="w-5 h-5 accent-primary" /><label className="font-semibold text-blue-800">{item.name}</label></div>
                        {isSelected && <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pl-9"><input {...register(`selections.${item.id}.complejoB_cc`)} placeholder="Complejo B (cc)" className="input text-sm py-1" /><input {...register(`selections.${item.id}.bioquel_cc`)} placeholder="Bioquel (cc)" className="input text-sm py-1" /><input {...register(`selections.${item.id}.frequency`)} placeholder="Frecuencia (ej: 10 dosis)" className="input text-sm py-1" /></div>}
                      </div>
                    );
                  case GuideItemType.METABOLIC:
                    const activator = item as MetabolicActivator;
                    return (
                      <div key={item.id} className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                        <div><h4 className="font-semibold text-gray-700 mb-2">Homeopatía</h4><div className="space-y-2">{activator.homeopathy.map(subItem => (<div key={subItem.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-md"><input type="checkbox" {...register(`metabolic_activator.homeopathy.${subItem.id}.selected`)} className="w-5 h-5 accent-primary" /><label className="font-medium text-gray-800 text-sm">{subItem.name}</label></div>))}</div></div>
                        <div><h4 className="font-semibold text-gray-700 mb-2">Flores de Bach</h4><div className="space-y-2">{activator.bachFlowers.map(subItem => (<div key={subItem.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-md"><input type="checkbox" {...register(`metabolic_activator.bachFlowers.${subItem.id}.selected`)} className="w-5 h-5 accent-primary" /><label className="font-medium text-gray-800 text-sm">{subItem.name}</label></div>))}</div></div>
                      </div>
                    );
                  case GuideItemType.STANDARD:
                  default:
                    return (
                      <div key={item.id} className="p-3 bg-gray-50 rounded-md hover:bg-gray-100">
                        <div className="flex items-center gap-4"><input type="checkbox" {...register(`selections.${item.id}.selected`)} className="w-5 h-5 accent-primary" /><label className="flex-grow font-medium text-gray-800">{item.name}</label>{item.dose && <span className="text-sm text-gray-600 bg-gray-200 px-2 py-1 rounded">{item.dose}</span>}</div>
                        {isSelected && !item.dose && <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 pl-9"><input {...register(`selections.${item.id}.qty`)} placeholder="Cant." className="input text-sm py-1" /><select {...register(`selections.${item.id}.freq`)} className="input text-sm py-1"><option value="">Frecuencia...</option>{frequencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select><input {...register(`selections.${item.id}.custom`)} placeholder="Detalle personalizado" className="input text-sm py-1" /></div>}
                      </div>
                    );
                }
              })}
              {/* Sección para añadir ítems personalizados */}
              {category.type === GuideItemType.STANDARD && (
                <div className="pt-4 border-t border-gray-200 mt-4">
                  {customItems.filter(field => field.categoryId === category.id).map((field, index) => (
                    <div key={field.id} className="p-3 bg-green-50 rounded-md mb-2">
                       <div className="flex items-center gap-4">
                          <input {...register(`customItems.${index}.name`)} className="flex-grow font-medium text-gray-800 bg-transparent border-none focus:ring-0" readOnly/>
                          <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700"><FaTrash /></button>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                          <input {...register(`customItems.${index}.qty`)} placeholder="Cant." className="input text-sm py-1" />
                          <select {...register(`customItems.${index}.freq`)} className="input text-sm py-1"><option value="">Frecuencia...</option>{frequencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
                          <input {...register(`customItems.${index}.custom`)} placeholder="Detalle personalizado" className="input text-sm py-1" />
                       </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <input value={newItemInputs[category.id] || ''} onChange={e => setNewItemInputs(prev => ({ ...prev, [category.id]: e.target.value }))} placeholder="Añadir nuevo ítem..." className="input flex-grow" />
                    <button type="button" onClick={() => handleAddNewItem(category.id)} className="btn-primary py-2 px-4 flex items-center gap-2 text-sm"><FaPlus /> Añadir</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      
      <div className="flex justify-end gap-4 mt-8">
        <button type="button" onClick={() => setIsPreviewOpen(true)} className="btn-secondary flex items-center gap-2"><FaEye /> Vista Previa</button>
        <button type="submit" className="btn-primary flex items-center gap-2"><FaPaperPlane /> Guardar Guía</button>
      </div>

      {isPreviewOpen && <PatientGuidePreview patient={patient} guideData={guideTemplate} formValues={getValues()} onClose={() => setIsPreviewOpen(false)} />}
    </form>
  );
}
