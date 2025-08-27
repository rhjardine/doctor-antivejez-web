'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PatientWithDetails } from '@/types';
import { 
    FoodPlanTemplate, 
    FoodItem, 
    MealType, 
    BloodTypeGroup, 
    DietType,
    type DietTypeEnum,
    GeneralGuideItem, 
    WellnessKey,
    FullNutritionData
} from '@/types/nutrition';
import { getFullNutritionData, savePatientNutritionPlan } from '@/lib/actions/nutrition.actions';
import { toast } from 'sonner';
import { FaUtensils, FaPlus, FaEdit, FaTrash, FaSave, FaPaperPlane, FaPrint, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

// ... (Subcomponente MealSection sin cambios) ...

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
                const initialTemplate = result.data.foodTemplate;
                const patientPlan = patient.foodPlans?.[0];
                
                if (patientPlan && patientPlan.items) {
                    const patientItems = patientPlan.items;
                    const patientItemNames = new Set(patientItems.map(i => i.name));
                    
                    // Añadir los items guardados del paciente a la plantilla si no existen
                    patientItems.forEach(item => {
                        if (!initialTemplate[item.mealType].some(tItem => tItem.name === item.name)) {
                            initialTemplate[item.mealType].push(item);
                        }
                    });
                }
                setFoodData(initialTemplate);
                setGeneralGuide(result.data.generalGuide);
                setWellnessKeys(result.data.wellnessKeys);
            } else {
                toast.error(result.error || 'Error al cargar los datos de la guía.');
            }
            setLoading(false);
        };
        loadInitialData();
    }, [patient]);

    const handleDietToggle = (diet: DietTypeEnum) => {
        setSelectedDiets(prev => {
            const newSet = new Set(prev);
            if (newSet.has(diet)) newSet.delete(diet);
            else newSet.add(diet);
            return newSet;
        });
    };

    const handleAddItem = (mealType: MealType, name: string) => {
        if (!foodData) return;
        const newItem: FoodItem = {
            id: `temp_${Date.now()}`,
            name,
            mealType,
            bloodTypeGroup: bloodType,
            isDefault: false,
            createdAt: new Date(),
        };
        const updatedMeal = [...foodData[mealType], newItem];
        setFoodData({ ...foodData, [mealType]: updatedMeal });
    };

    const handleEditItem = (mealType: MealType, index: number, currentName: string) => {
        if (!foodData) return;
        const newName = prompt('Editar alimento:', currentName);
        if (newName && newName.trim() && newName.trim() !== currentName) {
            const updatedMeal = [...foodData[mealType]];
            updatedMeal[index] = { ...updatedMeal[index], name: newName.trim() };
            setFoodData({ ...foodData, [mealType]: updatedMeal });
        }
    };

    const handleDeleteItem = (mealType: MealType, index: number) => {
        if (!foodData) return;
        const updatedMeal = foodData[mealType].filter((_, i) => i !== index);
        setFoodData({ ...foodData, [mealType]: updatedMeal });
    };

    // ===== AJUSTE: Se extraen los IDs antes de llamar a la action =====
    const handleSavePlan = async () => {
        if (!foodData) return;
        setIsSaving(true);
        
        // 1. Aplanar todos los items de comida del estado actual
        const allItems = Object.values(foodData).flat();
        
        // 2. Mapear para obtener solo los IDs
        const allItemIds = allItems.map(item => item.id);

        // 3. Llamar a la action con el array de IDs (string[])
        const result = await savePatientNutritionPlan(patient.id, allItemIds, Array.from(selectedDiets));
        
        if (result.success) {
            toast.success('Plan de bienestar guardado exitosamente.');
        } else {
            toast.error(result.error || 'No se pudo guardar el plan.');
        }
        setIsSaving(false);
    };
    // =================================================================

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
            {/* ... (resto del JSX sin cambios) ... */}
        </div>
    );
}