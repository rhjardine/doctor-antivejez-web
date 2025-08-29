'use client';

import { PatientWithDetails } from '@/types';
import { 
    FullNutritionData, 
    MealType,
    FoodPlanTemplate,
    GeneralGuideItem,
    WellnessKey,
    BloodTypeGroup,
    DietTypeEnum
} from '@/types/nutrition';
import { FaPrint, FaTimes, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import Image from 'next/image';

// ===== SOLUCIÓN: Se define la estructura de la prop 'planData' =====
interface NutritionPlanPreviewProps {
  patient: PatientWithDetails;
  planData: {
    bloodType: BloodTypeGroup;
    selectedDiets: DietTypeEnum[];
    foodPlan: FoodPlanTemplate;
    generalGuide: {
      AVOID: GeneralGuideItem[];
      SUBSTITUTE: GeneralGuideItem[];
    };
    wellnessKeys: WellnessKey[];
  };
  onClose: () => void;
}
// =================================================================

const mealTitles: Record<MealType, string> = {
    DESAYUNO: 'Desayuno',
    ALMUERZO: 'Almuerzo',
    CENA: 'Cena',
    MERIENDAS_POSTRES: 'Meriendas y Postres'
};

export default function NutritionPlanPreview({ patient, planData, onClose }: NutritionPlanPreviewProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn no-print">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Vista Previa del Plan de Bienestar</h2>
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
            @page { size: A4; margin: 15mm; }
            body * { visibility: hidden; }
            #printable-plan, #printable-plan * { visibility: visible; }
            #printable-plan { position: absolute; left: 0; top: 0; width: 100%; height: auto; overflow: visible; }
            .no-print { display: none; }
          }
        `}</style>
        <div id="printable-plan" className="p-8 lg:p-10 overflow-y-auto bg-white">
          <header className="flex justify-between items-start mb-8 border-b-2 border-primary pb-5">
            <div className="w-40">
              <Image src="/images/logo.png" alt="Logo Doctor Antivejez" width={160} height={40} priority />
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold text-primary-dark">Plan de Bienestar</h1>
              <p className="text-gray-500 text-lg">Personalizado</p>
            </div>
          </header>

          <section className="mb-8 p-4 bg-slate-50 rounded-lg border">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Paciente</p>
                    <p className="font-bold text-lg text-gray-800">{patient.firstName} {patient.lastName}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Grupo Sanguíneo</p>
                    <p className="font-bold text-lg text-gray-800">{planData.bloodType.replace('_', ' o ')}</p>
                </div>
                {planData.selectedDiets.length > 0 && (
                    <div className="col-span-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Tipo de Alimentación</p>
                        <p className="font-bold text-lg text-gray-800">{planData.selectedDiets.map(d => d.charAt(0) + d.slice(1).toLowerCase()).join(', ')}</p>
                    </div>
                )}
            </div>
          </section>

          <main className="space-y-8">
            <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Plan Alimentario Sugerido</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(planData.foodPlan).map(([mealType, items]) => {
                        if (items.length === 0) return null;
                        return (
                            <div key={mealType} className="break-inside-avoid">
                                <h3 className="font-bold text-sky-600 mb-2">{mealTitles[mealType as MealType]}</h3>
                                <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                                    {items.map(item => <li key={item.id}>{item.name}</li>)}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="break-inside-avoid">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Guía General</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-semibold text-amber-600 flex items-center gap-2 mb-2"><FaTimesCircle /> Alimentos a Evitar</h3>
                        <ul className="space-y-2 pl-5 list-disc text-slate-700 text-sm">
                            {planData.generalGuide.AVOID.map((item) => <li key={item.id}>{item.text}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-emerald-600 flex items-center gap-2 mb-2"><FaCheckCircle /> Sustitutos Recomendados</h3>
                        <ul className="space-y-2 pl-5 list-disc text-slate-700 text-sm">
                            {planData.generalGuide.SUBSTITUTE.map((item) => <li key={item.id}>{item.text}</li>)}
                        </ul>
                    </div>
                </div>
            </section>
            
            <section className="break-inside-avoid">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Claves de la Longevidad 5A</h2>
                <div className="space-y-4">
                    {planData.wellnessKeys.map((key) => (
                        <div key={key.id} className="pl-4 border-l-4 border-sky-500">
                            <p className="font-semibold text-slate-800">{key.title}</p>
                            <p className="text-slate-600 text-sm">{key.description}</p>
                        </div>
                    ))}
                </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}