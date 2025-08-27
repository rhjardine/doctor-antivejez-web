'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PatientWithDetails } from '@/types';
import { 
    FoodPlanTemplate, 
    FoodItem, 
    MealType, 
    BloodTypeGroup, 
    DietType, // Ahora importamos el OBJETO
    type DietTypeEnum, // Importamos el TIPO con un alias
    GeneralGuideItem, 
    WellnessKey,
    FullNutritionData
} from '@/types/nutrition';
import { getFullNutritionData, savePatientNutritionPlan } from '@/lib/actions/nutrition.actions';
import { toast } from 'sonner';
import { FaUtensils, FaPlus, FaEdit, FaTrash, FaSave, FaPaperPlane, FaPrint, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

// --- Subcomponente para una sección de comida (sin cambios) ---
const MealSection = ({ title, items, onAddItem, onEditItem, onDeleteItem, mealType }: any) => {
    // ... (código sin cambios)
};

// --- Componente Principal ---
export default function NutrigenomicGuide({ patient }: { patient: PatientWithDetails }) {
    const [activeTab, setActiveTab] = useState('plan');
    const [bloodType, setBloodType] = useState<BloodTypeGroup>('O_B');
    const [selectedDiets, setSelectedDiets] = useState<Set<DietTypeEnum>>(new Set(patient.selectedDiets || []));
    const [foodData, setFoodData] = useState<FoodPlanTemplate | null>(null);
    const [generalGuide, setGeneralGuide] = useState<{ AVOID: GeneralGuideItem[], SUBSTITUTE: GeneralGuideItem[] }>({ AVOID: [], SUBSTITUTE: [] });
    const [wellnessKeys, setWellnessKeys] = useState<WellnessKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            const result = await getFullNutritionData();
            if (result.success && result.data) {
                setFoodData(result.data.foodTemplate);
                setGeneralGuide(result.data.generalGuide);
                setWellnessKeys(result.data.wellnessKeys);
            } else {
                toast.error(result.error || 'Error al cargar los datos de la guía.');
            }
            setLoading(false);
        };
        loadInitialData();
    }, []);

    const handleDietToggle = (diet: DietTypeEnum) => {
        setSelectedDiets(prev => {
            const newSet = new Set(prev);
            if (newSet.has(diet)) newSet.delete(diet);
            else newSet.add(diet);
            return newSet;
        });
    };

    const handleSavePlan = async () => {
        if (!foodData) return;
        setIsSaving(true);
        const result = await savePatientNutritionPlan(patient.id, Object.values(foodData).flat(), Array.from(selectedDiets));
        if (result.success) {
            toast.success('Plan de bienestar guardado exitosamente.');
        } else {
            toast.error(result.error || 'No se pudo guardar el plan.');
        }
        setIsSaving(false);
    };

    const filteredFoodData = useMemo(() => {
        if (!foodData) return null;
        const filtered = {} as FoodPlanTemplate;
        for (const key in foodData) {
            const mealType = key as MealType;
            filtered[mealType] = foodData[mealType].filter(item => item.bloodTypeGroup === 'ALL' || item.bloodTypeGroup === bloodType);
        }
        return filtered;
    }, [foodData, bloodType]);

    const TabButton = ({ id, label }: { id: string, label: string }) => (
        <button onClick={() => setActiveTab(id)} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === id ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
            {label}
        </button>
    );

    if (loading) return <div className="flex justify-center items-center p-12"><div className="loader"></div></div>;

    return (
        <div className="bg-slate-50 p-4 sm:p-6 rounded-xl shadow-sm">
            <section className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-bold text-slate-700 mb-4">Perfil del Paciente</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="blood-type-select" className="label">Grupo Sanguíneo</label>
                        <select id="blood-type-select" value={bloodType} onChange={(e) => setBloodType(e.target.value as BloodTypeGroup)} className="input w-full">
                            <option value="O_B">Grupo O y B</option>
                            <option value="A_AB">Grupo A y AB</option>
                        </select>
                    </div>
                    <div>
                        <label className="label mb-2">Tipo de Alimentación</label>
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                            {/* ===== SOLUCIÓN: Se itera sobre el OBJETO DietType ===== */}
                            {(Object.values(DietType)).map(diet => (
                                <label key={diet} className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" checked={selectedDiets.has(diet)} onChange={() => handleDietToggle(diet)} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary-dark"/>
                                    <span className="text-sm text-slate-600 capitalize">{diet.toLowerCase().replace('_', ' ')}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <nav className="flex space-x-2 border-b border-slate-200 mb-6">
                <TabButton id="plan" label="Plan Alimentario" />
                <TabButton id="guide" label="Guía General" />
                <TabButton id="wellness" label="Claves de Bienestar" />
            </nav>

            <main>
                {/* ... (resto del JSX sin cambios) ... */}
            </main>
            
            <footer className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
                <button onClick={handleSavePlan} disabled={isSaving} className="btn-primary flex items-center justify-center gap-2">
                    <FaSave /><span>{isSaving ? 'Guardando...' : 'Guardar Plan'}</span>
                </button>
                <button className="btn-secondary flex items-center justify-center gap-2"><FaPaperPlane /><span>Enviar al Paciente</span></button>
                <button className="btn-secondary flex items-center justify-center gap-2"><FaPrint /><span>Imprimir</span></button>
            </footer>
        </div>
    );
}