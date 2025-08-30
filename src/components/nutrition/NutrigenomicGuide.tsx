'use client';

import React, { useState, useTransition } from 'react';
import { PatientWithDetails } from '@/types';
import { DietType, Food, MealType } from '@prisma/client';
import { FullNutritionData, saveFullNutritionPlan } from '@/lib/actions/nutrition.actions';
import { toast } from 'sonner';
import NutritionPlanPreview from './NutritionPlanPreview';
import { FaUtensils, FaExclamationTriangle, FaLightbulb, FaPlus, FaSave, FaEye } from 'react-icons/fa';

// --- Sub-componente para el selector de tipo de alimentación ---
const DietSelector = ({ selected, onChange }: { selected: DietType[], onChange: (diet: DietType) => void }) => {
  const allDiets: { id: DietType, label: string }[] = [
    { id: 'NINO', label: 'Niño' }, { id: 'METABOLICA', label: 'Metabólica' },
    { id: 'ANTIDIABETICA', label: 'Antidiabética' }, { id: 'CITOSTATICA', label: 'Citostática' },
    { id: 'RENAL', label: 'Renal' },
  ];
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {allDiets.map(diet => (
        <label key={diet.id} className="flex items-center space-x-2 cursor-pointer text-sm font-medium text-gray-700 hover:text-primary">
          <input
            type="checkbox"
            checked={selected.includes(diet.id)}
            onChange={() => onChange(diet.id)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span>{diet.label}</span>
        </label>
      ))}
    </div>
  );
};

// --- Componente Principal ---
interface NutrigenomicGuideProps {
  patient: PatientWithDetails;
  initialData: FullNutritionData;
}

export default function NutrigenomicGuide({ patient, initialData }: NutrigenomicGuideProps) {
  const [activeTab, setActiveTab] = useState<'plan' | 'guide' | 'keys'>('plan');
  const [isPending, startTransition] = useTransition();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Estados del formulario, inicializados con los datos del servidor
  const [selectedDiets, setSelectedDiets] = useState<DietType[]>(initialData.patientData.selectedDiets);
  const [mealPlan, setMealPlan] = useState<Record<MealType, string[]>>(initialData.patientData.existingPlan || {
    DESAYUNO: [], ALMUERZO: [], CENA: [], MERIENDAS_POSTRES: []
  });
  const [observations, setObservations] = useState(initialData.patientData.observations || '');
  const [customItems, setCustomItems] = useState<Record<MealType, string>>({
    DESAYUNO: '', ALMUERZO: '', CENA: '', MERIENDAS_POSTRES: ''
  });

  const handleDietChange = (diet: DietType) => {
    setSelectedDiets(prev =>
      prev.includes(diet) ? prev.filter(d => d !== diet) : [...prev, diet]
    );
  };
  
  const handleAddItem = (mealType: MealType) => {
    const itemName = customItems[mealType].trim();
    if (!itemName) return;
    
    // NOTA: Esta es una adición temporal solo en la UI.
    // La lógica de negocio real requeriría guardar este nuevo `FoodItem` en la base de datos
    // a través de otra server action si se desea que sea reutilizable.
    const tempId = `custom_${itemName.replace(/\s+/g, '_')}_${Date.now()}`;
    initialData.foodTemplate[mealType].push({ id: tempId, name: itemName, mealType, bloodTypeGroup: 'ALL', isDefault: false, createdAt: new Date() });
    
    setMealPlan(prev => ({...prev, [mealType]: [...(prev[mealType] || []), tempId]}));
    setCustomItems(prev => ({...prev, [mealType]: ''}));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveFullNutritionPlan(patient.id, { selectedDiets, mealPlan, observations });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    });
  };

  const mealTranslations: Record<MealType, string> = {
    DESAYUNO: 'Desayuno',
    ALMUERZO: 'Almuerzo',
    CENA: 'Cena',
    MERIENDAS_POSTRES: 'Meriendas y Postres'
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Perfil del Paciente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Grupo Sanguíneo</label>
            <input type="text" readOnly value={`Compatible con Grupo ${initialData.patientData.bloodTypeGroup.replace('_', ' y ')}`} className="input bg-gray-100 cursor-not-allowed"/>
          </div>
          <div>
            <label className="label">Tipo de Alimentación Aplicada</label>
            <div className="p-2 border rounded-md bg-gray-50">
              <DietSelector selected={selectedDiets} onChange={handleDietChange} />
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200">
          <nav className="flex space-x-2 overflow-x-auto custom-scrollbar-tabs pb-2">
            <button type="button" onClick={() => setActiveTab('plan')} className={`tab-button ${activeTab === 'plan' ? 'active' : ''}`}>Plan Alimentario</button>
            <button type="button" onClick={() => setActiveTab('guide')} className={`tab-button ${activeTab === 'guide' ? 'active' : ''}`}>Guía General</button>
            <button type="button" onClick={() => setActiveTab('keys')} className={`tab-button ${activeTab === 'keys' ? 'active' : ''}`}>Claves de Bienestar</button>
          </nav>
      </div>

      {activeTab === 'plan' && (
        <div className="space-y-4 animate-fadeIn">
          {Object.entries(mealTranslations).map(([mealType, mealLabel]) => (
            <div key={mealType} className="card">
              <h3 className="text-lg font-bold text-primary mb-3 flex items-center gap-2"><FaUtensils /> {mealLabel}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-2">
                {initialData.foodTemplate[mealType as MealType]?.map(item => (
                  <label key={item.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={mealPlan[mealType as MealType]?.includes(item.id)}
                      onChange={(e) => {
                        const currentItems = mealPlan[mealType as MealType] || [];
                        const newItems = e.target.checked ? [...currentItems, item.id] : currentItems.filter(id => id !== item.id);
                        setMealPlan(prev => ({ ...prev, [mealType as MealType]: newItems }));
                      }}
                    />
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2">
                  <input type="text" placeholder={`Añadir otro alimento a ${mealLabel}...`} className="input flex-grow text-sm" value={customItems[mealType as MealType]} onChange={e => setCustomItems(prev => ({...prev, [mealType as MealType]: e.target.value}))} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddItem(mealType as MealType))} />
                  <button type="button" onClick={() => handleAddItem(mealType as MealType)} className="btn-primary py-2 px-3 text-sm flex items-center gap-2"><FaPlus /> Añadir</button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {activeTab === 'guide' && (
        <div className="card animate-fadeIn grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <h3 className="font-semibold text-red-600 flex items-center gap-2 mb-3"><FaExclamationTriangle /> Alimentos a Evitar</h3>
                <ul className="space-y-2 pl-5 list-disc text-slate-700 text-sm">
                    {initialData.generalGuide.AVOID.map((item) => <li key={item.id}>{item.text}</li>)}
                </ul>
            </div>
            <div>
                <h3 className="font-semibold text-green-600 flex items-center gap-2 mb-3"><FaLightbulb /> Sustitutos Recomendados</h3>
                <ul className="space-y-2 pl-5 list-disc text-slate-700 text-sm">
                    {initialData.generalGuide.SUBSTITUTE.map((item) => <li key={item.id}>{item.text}</li>)}
                </ul>
            </div>
        </div>
      )}

      {activeTab === 'keys' && (
         <div className="card animate-fadeIn space-y-5">
            {initialData.wellnessKeys.map((key) => (
                <div key={key.id} className="pl-4 border-l-4 border-primary/70">
                    <p className="font-semibold text-slate-800">{key.title}</p>
                    <p className="text-slate-600 text-sm">{key.description}</p>
                </div>
            ))}
        </div>
      )}

      <div className="card">
        <label className="label">Observaciones Adicionales</label>
        <textarea value={observations} onChange={(e) => setObservations(e.target.value)} rows={4} className="input" placeholder="Escriba aquí notas, recetas o indicaciones personalizadas para el paciente..." />
      </div>

      <div className="flex justify-end items-center gap-4 pt-4 border-t">
        <button type="button" onClick={() => setIsPreviewOpen(true)} className="btn-secondary flex items-center gap-2">
            <FaEye /> Vista Previa
        </button>
        <button type="submit" disabled={isPending} className="btn-primary flex items-center gap-2">
          <FaSave />
          {isPending ? 'Guardando...' : 'Guardar Plan de Bienestar'}
        </button>
      </div>
      
      {isPreviewOpen && (
        <NutritionPlanPreview
          patient={patient}
          planData={{
            bloodType: initialData.patientData.bloodTypeGroup,
            selectedDiets: selectedDiets,
            foodPlan: {
                DESAYUNO: initialData.foodTemplate.DESAYUNO.filter(f => mealPlan.DESAYUNO.includes(f.id)),
                ALMUERZO: initialData.foodTemplate.ALMUERZO.filter(f => mealPlan.ALMUERZO.includes(f.id)),
                CENA: initialData.foodTemplate.CENA.filter(f => mealPlan.CENA.includes(f.id)),
                MERIENDAS_POSTRES: initialData.foodTemplate.MERIENDAS_POSTRES.filter(f => mealPlan.MERIENDAS_POSTRES.includes(f.id)),
            },
            generalGuide: initialData.generalGuide,
            wellnessKeys: initialData.wellnessKeys
          }}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}

      <style jsx>{`
        .tab-button { @apply flex-shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-primary hover:border-primary/50; }
        .tab-button.active { @apply text-primary border-primary; }
      `}</style>
    </form>
  );
}
