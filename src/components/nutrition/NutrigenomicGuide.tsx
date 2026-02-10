'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PatientWithDetails } from '@/types';
// ===== ANÁLISIS Y CORRECCIÓN ESTRATÉGICA =====
// La importación se simplifica. 'DietType' ahora es el enum oficial de Prisma.
// Ya no se necesita un 'DietTypeEnum' separado.
import {
    FoodPlanTemplate,
    FoodItem,
    MealType,
    BloodTypeGroup,
    DietType, // Se utiliza el enum unificado.
    GeneralGuideItem,
    WellnessKey
} from '@/types/nutrition';
// ===========================================
import { getFullNutritionData, savePatientNutritionPlan } from '@/lib/actions/nutrition.actions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Mail, Printer, History, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MealSection from './MealSection';
import NutritionPlanPreview from './NutritionPlanPreview';
import FoodCombinationsGuide from './FoodCombinationsGuide';
import ActivityGuide from './ActivityGuide';

export default function NutrigenomicGuide({ patient }: { patient: PatientWithDetails }) {
    const [activeTab, setActiveTab] = useState('plan');
    // Mapeo lógico de Grupo Sanguíneo a Categoría Nutrigenómica
    const getInitialBloodGroup = (bt: string): BloodTypeGroup => {
        const type = bt.toUpperCase();
        if (type.includes('O') || type.includes('B')) return 'O_B';
        if (type.includes('A')) return 'A_AB'; // A y AB
        return 'ALL';
    };

    const [bloodType, setBloodType] = useState<BloodTypeGroup>(getInitialBloodGroup(patient.bloodType || 'O'));
    // ===== ANÁLISIS Y CORRECCIÓN ESTRATÉGICA =====
    // El estado se tipa directamente con el enum 'DietType'.
    // El error de tipo desaparece porque `patient.selectedDiets` (que es DietType[]
    // desde la base de datos) es 100% compatible con `Set<DietType>`.
    const [selectedDiets, setSelectedDiets] = useState<Set<DietType>>(new Set(patient.selectedDiets || []));
    // ===========================================
    const [foodData, setFoodData] = useState<FoodPlanTemplate | null>(null);
    const [generalGuide, setGeneralGuide] = useState<{ AVOID: GeneralGuideItem[], SUBSTITUTE: GeneralGuideItem[] }>({ AVOID: [], SUBSTITUTE: [] });
    const [wellnessKeys, setWellnessKeys] = useState<WellnessKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const hasSavedPlans = useMemo(() => patient.foodPlans && patient.foodPlans.length > 0, [patient.foodPlans]);

    const loadInitialData = useCallback(async () => {
        setLoading(true);
        const result = await getFullNutritionData();
        if (result.success && result.data) {
            const initialTemplate = result.data.foodTemplate;
            const patientPlan = patient.foodPlans?.[0];

            if (patientPlan && patientPlan.items) {
                const patientItems = patientPlan.items;
                patientItems.forEach(item => {
                    if (!initialTemplate[item.mealType].some(tItem => tItem.name === item.name)) {
                        initialTemplate[item.mealType].push(item as FoodItem);
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
    }, [patient.foodPlans]);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    const handleDietToggle = (diet: DietType) => {
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
            id: `temp_${Date.now()}`, name, mealType, bloodTypeGroup: 'ALL', isDefault: false, createdAt: new Date(), updatedAt: new Date(), foodPlanId: null
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
        if (window.confirm('¿Estás seguro de que quieres eliminar este alimento?')) {
            const updatedMeal = foodData[mealType].filter((_, i) => i !== index);
            setFoodData({ ...foodData, [mealType]: updatedMeal });
        }
    };

    const handleSavePlan = async () => {
        if (!foodData) return;
        setIsSaving(true);
        const result = await savePatientNutritionPlan(patient.id, foodData, Array.from(selectedDiets));
        if (result.success) {
            toast.success('Plan de bienestar guardado exitosamente.');
        } else {
            toast.error(result.error || 'No se pudo guardar el plan.');
        }
        setIsSaving(false);
    };

    const filteredFoodData = useMemo(() => {
        const emptyPlan: FoodPlanTemplate = {
            DESAYUNO: [], ALMUERZO: [], CENA: [], MERIENDAS_POSTRES: []
        };
        if (!foodData) return emptyPlan;
        const filtered = { ...emptyPlan };
        for (const key in foodData) {
            const mealType = key as MealType;
            if (Object.prototype.hasOwnProperty.call(filtered, mealType)) {
                filtered[mealType] = (foodData[mealType] || []).filter(item =>
                    item.bloodTypeGroup === 'ALL' || item.bloodTypeGroup === bloodType
                );
            }
        }
        return filtered;
    }, [foodData, bloodType]);

    const TabButton = ({ id, label }: { id: string, label: string }) => (
        <button onClick={() => setActiveTab(id)} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === id ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
            {label}
        </button>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 bg-primary-dark rounded-xl">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-sky-400 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    return (
        <>
            {isPreviewOpen && foodData && (
                <NutritionPlanPreview
                    patient={patient}
                    planData={{
                        bloodType,
                        selectedDiets: Array.from(selectedDiets),
                        foodPlan: filteredFoodData,
                        generalGuide,
                        wellnessKeys
                    }}
                    onClose={() => setIsPreviewOpen(false)}
                />
            )}

            <div className="bg-slate-50 p-4 sm:p-6 rounded-xl shadow-sm">
                <section className="bg-primary-dark rounded-xl p-6 mb-6 shadow-lg border border-white/20">
                    <h2 className="text-2xl font-bold mb-4 text-white">Perfil del Paciente</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Grupo Sanguíneo</label>
                            <Select value={bloodType} onValueChange={(value: BloodTypeGroup) => setBloodType(value)}>
                                <SelectTrigger className="bg-white/10 border-white/30 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="O_B">Grupo O y B</SelectItem>
                                    <SelectItem value="A_AB">Grupo A y AB</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Tipos de Alimentación</label>
                            <div className="flex flex-wrap gap-x-4 gap-y-2">
                                {Object.values(DietType).map(diet => (
                                    <label key={diet} className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={selectedDiets.has(diet)} onChange={() => handleDietToggle(diet)} className="w-4 h-4 text-sky-400 bg-white/20 border-gray-500 rounded focus:ring-sky-500" />
                                        <span className="text-sm text-gray-200 font-medium capitalize">{diet.toLowerCase().replace('_', ' ')}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <nav className="flex gap-2 mb-6 overflow-x-auto">
                    <TabButton id="plan" label="Plan Alimentario" />
                    <TabButton id="guide" label="Guía General" />
                    <TabButton id="wellness" label="Claves de Bienestar" />
                </nav>

                <main>
                    <AnimatePresence mode="wait">
                        {activeTab === 'plan' && (
                            <motion.div key="plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                {Object.entries(filteredFoodData).map(([meal, foods]) => (
                                    <MealSection key={meal} title={meal} items={foods || []} mealType={meal as MealType} onAddItem={handleAddItem} onEditItem={handleEditItem} onDeleteItem={handleDeleteItem} />
                                ))}
                            </motion.div>
                        )}
                        {activeTab === 'guide' && (
                            <motion.div key="guide" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                                <Card className="shadow-lg">
                                    <CardHeader><CardTitle className="text-2xl text-gray-800">Guía General de Alimentación</CardTitle></CardHeader>
                                    <CardContent className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div>
                                            <h3 className="text-xl font-bold text-red-600 flex items-center gap-2 mb-4"><XCircle className="w-5 h-5" />Alimentos a Evitar</h3>
                                            <ul className="space-y-2 pl-5 list-disc text-gray-700">
                                                {generalGuide.AVOID.map((item) => <li key={item.id}>{item.text}</li>)}
                                            </ul>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-green-600 flex items-center gap-2 mb-4"><CheckCircle className="w-5 h-5" />Sustitutos Recomendados</h3>
                                            <ul className="space-y-2 pl-5 list-disc text-gray-700">
                                                {generalGuide.SUBSTITUTE.map((item) => <li key={item.id}>{item.text}</li>)}
                                            </ul>
                                        </div>
                                    </CardContent>
                                </Card>
                                <FoodCombinationsGuide />
                                <ActivityGuide />
                            </motion.div>
                        )}
                        {activeTab === 'wellness' && (
                            <motion.div key="wellness" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <Card className="shadow-lg">
                                    <CardHeader><CardTitle className="text-2xl text-gray-800">Claves de la Longevidad 5A</CardTitle></CardHeader>
                                    <CardContent className="space-y-6 p-6">
                                        {wellnessKeys.map((key, index) => (
                                            <div key={key.id} className="border-l-4 border-sky-500 pl-6 py-2">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="text-sky-600 border-sky-200 border rounded px-2 py-1 text-xs">{index + 1}</div>
                                                    <h4 className="font-semibold text-lg text-gray-800">{key.title}</h4>
                                                </div>
                                                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{key.description}</p>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>

                <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-end gap-4">
                    <Button variant="outline" disabled={!hasSavedPlans} className={!hasSavedPlans ? 'opacity-50 cursor-not-allowed' : ''}>
                        <History className="w-4 h-4 mr-2" />
                        Histórico
                    </Button>
                    <Button onClick={handleSavePlan} disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white">
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Guardando...' : 'Guardar Plan'}
                    </Button>
                    <Button className="bg-sky-500 hover:bg-sky-600 text-white">
                        <Mail className="w-4 h-4 mr-2" />
                        Enviar al Paciente
                    </Button>
                    <Button onClick={() => setIsPreviewOpen(true)} className="bg-primary-dark hover:bg-gray-800 text-white">
                        <Printer className="w-4 h-4 mr-2" />
                        Vista Previa / Imprimir
                    </Button>
                </motion.footer>
            </div>
        </>
    );
}