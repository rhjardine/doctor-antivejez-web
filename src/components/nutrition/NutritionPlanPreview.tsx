'use client';

import React from 'react';
import Image from 'next/image';
import { PatientWithDetails } from '@/types';
import { 
    FoodPlanTemplate, 
    FoodItem, 
    MealType, 
    GeneralGuideItem, 
    WellnessKey 
} from '@/types/nutrition';
import { FaPrint, FaTimes, FaUtensils, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface NutritionPlanPreviewProps {
  patient: PatientWithDetails;
  foodData: FoodPlanTemplate;
  generalGuide: { AVOID: GeneralGuideItem[], SUBSTITUTE: GeneralGuideItem[] };
  wellnessKeys: WellnessKey[];
  selectedIds: Set<string>;
  onClose: () => void;
}

// --- Subcomponente para los títulos de categoría ---
const CategoryTitle = ({ title, icon }: { title: string, icon: React.ReactNode }) => (
  <div className="flex items-center gap-3 border-b-2 border-gray-200 pb-2 mb-4">
    <div className="text-primary text-2xl">{icon}</div>
    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
  </div>
);

export default function NutritionPlanPreview({
  patient,
  foodData,
  generalGuide,
  wellnessKeys,
  selectedIds,
  onClose,
}: NutritionPlanPreviewProps) {
  
  const handlePrint = () => {
    window.print();
  };

  const selectedFoodsByMeal = React.useMemo(() => {
    const byMeal: { [key in MealType]?: FoodItem[] } = {};
    for (const meal in foodData) {
        const mealType = meal as MealType;
        const selected = foodData[mealType].filter(item => selectedIds.has(item.id));
        if (selected.length > 0) {
            byMeal[mealType] = selected;
        }
    }
    return byMeal;
  }, [foodData, selectedIds]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn no-print">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Vista Previa del Plan Nutricional</h2>
          <div className="flex items-center gap-4">
            <button onClick={handlePrint} className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
              <FaPrint /> Imprimir / Guardar PDF
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
              <FaTimes />
            </button>
          </div>
        </div>

        <style jsx global>{`
          @media print {
            body * { visibility: hidden; }
            #printable-guide, #printable-guide * { visibility: visible; }
            #printable-guide { position: absolute; left: 0; top: 0; width: 100%; height: auto; overflow: visible; }
            .no-print { display: none; }
          }
        `}</style>

        <div id="printable-guide" className="p-8 lg:p-12 overflow-y-auto bg-white">
          <header className="flex justify-between items-start mb-10 border-b-2 border-primary pb-6">
            <div className="w-40">
              <Image src="/images/logo.png" alt="Logo Doctor Antivejez" width={160} height={40} priority />
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-bold text-primary-dark">Plan de Bienestar Nutrigenómico</h1>
              <p className="text-gray-500 text-lg">Personalizado</p>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-8 mb-10 border-b border-gray-200 pb-6">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wider">Paciente</p>
              <p className="font-bold text-xl text-gray-800">{patient.firstName} {patient.lastName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 uppercase tracking-wider">Fecha de Emisión</p>
              <p className="font-bold text-xl text-gray-800">{new Date().toLocaleDateString('es-VE')}</p>
            </div>
          </div>

          <main className="space-y-10">
            {Object.keys(selectedFoodsByMeal).length > 0 && (
                <div className="break-inside-avoid">
                    <CategoryTitle title="Plan Alimentario Sugerido" icon={<FaUtensils />} />
                    <div className="space-y-6 pl-4">
                        {Object.entries(selectedFoodsByMeal).map(([mealType, items]) => (
                            <div key={mealType}>
                                <h4 className="font-semibold text-primary-dark capitalize mb-2">{mealType.toLowerCase().replace('_', ' ')}</h4>
                                <ul className="list-disc list-inside space-y-1 text-gray-700 columns-2">
                                    {items.map(item => <li key={item.id}>{item.name}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="break-inside-avoid">
                <CategoryTitle title="Guía General de Alimentación" icon={<FaUtensils />} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pl-4">
                    <div className="space-y-2">
                        <h4 className="font-semibold text-red-600 flex items-center gap-2"><FaTimesCircle /> Alimentos a Evitar</h4>
                        <ul className="list-disc list-inside text-gray-700 space-y-1">
                            {generalGuide.AVOID.map(item => <li key={item.id}>{item.text}</li>)}
                        </ul>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-semibold text-green-600 flex items-center gap-2"><FaCheckCircle /> Sustitutos Recomendados</h4>
                        <ul className="list-disc list-inside text-gray-700 space-y-1">
                            {generalGuide.SUBSTITUTE.map(item => <li key={item.id}>{item.text}</li>)}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="break-inside-avoid">
                <CategoryTitle title="Claves de Bienestar" icon={<FaUtensils />} />
                <div className="space-y-4 pl-4">
                    {wellnessKeys.map(key => (
                        <div key={key.id}>
                            <p className="font-semibold text-primary-dark">{key.title}</p>
                            <p className="text-gray-600 text-sm">{key.description}</p>
                        </div>
                    ))}
                </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
