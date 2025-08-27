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

// --- Subcomponente para una sección de comida (sin cambios) ---
const MealSection = ({ title, items, onAddItem, onEditItem, onDeleteItem, mealType, selectedIds, onToggleItem }: any) => {
    const [newItemName, setNewItemName] = useState('');
    const handleAddItem = () => {
        if (newItemName.trim()) {
            onAddItem(mealType, newItemName.trim());
            setNewItemName('');
        }
    };
    return (
        <section className="bg-white rounded-lg border border-slate-200">
            <header className="flex items-center gap-3 p-4 bg-sky-500 text-white rounded-t-md">
                <FaUtensils />
                <h3 className="text-lg font-bold capitalize">{title.replace('_', ' ')}</h3>
            </header>
            <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {items.map((food: FoodItem, index: number) => (
                        <div key={food.id || `${mealType}-${index}`} className="flex items-center justify-between bg-slate-50 rounded-md p-2 pl-3 border border-slate-200 text-sm group">
                            <label className="flex items-center gap-3 cursor-pointer flex-grow">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 accent-primary-dark rounded"
                                    checked={selectedIds.has(food.id)}
                                    onChange={() => onToggleItem(food.id)}
                                />
                                <span>{food.name}</span>
                            </label>
                            <div className="flex items-center gap-1 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onEditItem(mealType, index, food.name)} className="p-1 hover:text-primary"><FaEdit /></button>
                                <button onClick={() => onDeleteItem(mealType, index)} className="p-1 hover:text-red-500"><FaTrash /></button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200">
                    <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddItem()} placeholder={`Añadir a ${title.toLowerCase().replace('_', ' ')}...`} className="input flex-grow"/>
                    <button onClick={handleAddItem} className="btn-primary flex items-center gap-2"><FaPlus /><span>Agregar</span></button>
                </div>
            </div>
        </section>
    );
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
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            const result = await getFullNutritionData();
            if (result.success && result.data) {
                setFoodData(result.data.foodTemplate);
                setGeneralGuide(result.data.generalGuide);
                setWellnessKeys(result.data.wellnessKeys);
                const initialPlan = patient.foodPlans?.[0];
                if (initialPlan && initialPlan.items) {
                    setSelectedIds(new Set(initialPlan.items.map(item => item.id)));
                }
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

    const handleToggleItem = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
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
        setSelectedIds(prev => new Set(prev).add(newItem.id)); // Seleccionar automáticamente el nuevo item
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
        const itemToDelete = foodData[mealType][index];
        const updatedMeal = foodData[mealType].filter((_, i) => i !== index);
        setFoodData({ ...foodData, [mealType]: updatedMeal });
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(itemToDelete.id);
            return newSet;
        });
    };

    const handleSavePlan = async () => {
        if (!foodData) return;
        setIsSaving(true);
        
        // ===== SOLUCIÓN: Se envían solo los IDs de los items seleccionados =====
        const result = await savePatientNutritionPlan(patient.id, Array.from(selectedIds), Array.from(selectedDiets));
        
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
                {activeTab === 'plan' && filteredFoodData && (
                    <div className="space-y-6">
                        {Object.entries(filteredFoodData).map(([meal, foods]) => (
                            <MealSection key={meal} title={meal} items={foods} mealType={meal as MealType} selectedIds={selectedIds} onToggleItem={handleToggleItem} onAddItem={handleAddItem} onEditItem={handleEditItem} onDeleteItem={handleDeleteItem} />
                        ))}
                    </div>
                )}
                {activeTab === 'guide' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-white rounded-lg border">
                        <div className="space-y-3">
                            <h3 className="text-xl font-bold text-amber-600 flex items-center gap-2"><FaTimesCircle /> Alimentos a Evitar</h3>
                            <ul className="space-y-2 pl-5 list-disc text-slate-700">
                                {generalGuide.AVOID.map((item) => <li key={item.id}>{item.text}</li>)}
                            </ul>
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-xl font-bold text-emerald-600 flex items-center gap-2"><FaCheckCircle /> Sustitutos Recomendados</h3>
                            <ul className="space-y-2 pl-5 list-disc text-slate-700">
                                {generalGuide.SUBSTITUTE.map((item) => <li key={item.id}>{item.text}</li>)}
                            </ul>
                        </div>
                    </div>
                )}
                {activeTab === 'wellness' && (
                    <div className="space-y-4 p-6 bg-white rounded-lg border">
                        <h3 className="text-xl font-bold text-slate-800">Claves de la Longevidad 5A</h3>
                        <div className="space-y-4">
                            {wellnessKeys.map((key) => (
                                <div key={key.id} className="pl-4 border-l-4 border-sky-500">
                                    <p className="font-semibold text-slate-800">{key.title}</p>
                                    <p className="text-slate-600 text-sm">{key.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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