'use client';

import { useState, useEffect, useMemo } from 'react';
import { PatientWithDetails } from '@/types';
import { FoodPlanTemplate, FoodItem, MealType, BloodTypeGroup } from '@/types/nutrition';
import { getFoodPlanTemplate, savePatientFoodPlan } from '@/lib/actions/nutrition.actions';
import { toast } from 'sonner';
import { FaUtensils, FaPlus, FaEdit, FaTrash, FaSave, FaPaperPlane, FaPrint } from 'react-icons/fa';

// --- Subcomponente para una sección de comida ---
interface MealSectionProps {
  title: string;
  items: FoodItem[];
  selectedIds: Set<string>;
  onToggleItem: (id: string) => void;
  onAddItem: (mealType: MealType, name: string) => void;
  mealType: MealType;
}

const MealSection = ({ title, items, selectedIds, onToggleItem, onAddItem, mealType }: MealSectionProps) => {
    const [newItemName, setNewItemName] = useState('');

    const handleAddItem = () => {
        if (newItemName.trim()) {
            onAddItem(mealType, newItemName.trim());
            setNewItemName('');
        }
    };

    return (
        <div className="bg-primary p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3"><FaUtensils /> {title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map(item => (
                    <div key={item.id} className="bg-white/90 p-3 rounded-lg flex items-center justify-between text-sm text-gray-800">
                        <label className="flex items-center gap-3 cursor-pointer flex-grow">
                            <input
                                type="checkbox"
                                className="w-5 h-5 accent-primary-dark rounded"
                                checked={selectedIds.has(item.id)}
                                onChange={() => onToggleItem(item.id)}
                            />
                            <span>{item.name}</span>
                        </label>
                        <div className="flex items-center gap-1 text-gray-400">
                            <button className="p-1 hover:text-primary"><FaEdit /></button>
                            <button className="p-1 hover:text-red-500"><FaTrash /></button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 flex gap-2">
                <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={`Nueva opción de ${title.toLowerCase()}`}
                    className="input flex-grow"
                />
                <button onClick={handleAddItem} className="btn-primary-dark flex-shrink-0 flex items-center gap-2"><FaPlus /> Agregar</button>
            </div>
        </div>
    );
};

// --- Componente Principal ---
export default function NutrigenomicGuide({ patient }: { patient: PatientWithDetails }) {
    const [template, setTemplate] = useState<FoodPlanTemplate | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bloodTypeFilter, setBloodTypeFilter] = useState<BloodTypeGroup | 'ALL'>('ALL');
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadTemplate = async () => {
            setLoading(true);
            const result = await getFoodPlanTemplate();
            if (result.success && result.data) {
                setTemplate(result.data);
                // Cargar selecciones iniciales del paciente
                const initialPlan = patient.foodPlans?.[0];
                if (initialPlan && initialPlan.items) {
                    setSelectedIds(new Set(initialPlan.items.map(item => item.id)));
                }
            } else {
                toast.error(result.error || 'Error al cargar la plantilla.');
            }
            setLoading(false);
        };
        loadTemplate();
    }, [patient.foodPlans]);

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
    
    const handleSavePlan = async () => {
        setIsSaving(true);
        const result = await savePatientFoodPlan(patient.id, Array.from(selectedIds));
        if (result.success) {
            toast.success('Plan de alimentación guardado exitosamente.');
        } else {
            toast.error(result.error || 'No se pudo guardar el plan.');
        }
        setIsSaving(false);
    };

    const filteredTemplate = useMemo(() => {
        if (!template) return null;
        if (bloodTypeFilter === 'ALL') return template;

        const filtered = {} as FoodPlanTemplate;
        for (const mealType in template) {
            filtered[mealType as MealType] = template[mealType as MealType].filter(item => 
                item.bloodTypeGroup === 'ALL' || item.bloodTypeGroup === bloodTypeFilter
            );
        }
        return filtered;
    }, [template, bloodTypeFilter]);

    if (loading) {
        return <div className="text-center p-12">Cargando guía de alimentación...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="card">
                <label htmlFor="blood-type-filter" className="label">Seleccionar Tipo Sanguíneo</label>
                <select 
                    id="blood-type-filter" 
                    className="input" 
                    value={bloodTypeFilter}
                    onChange={(e) => setBloodTypeFilter(e.target.value as BloodTypeGroup | 'ALL')}
                >
                    <option value="ALL">Todos</option>
                    <option value="O_B">O o B</option>
                    <option value="A_AB">A o AB</option>
                </select>
            </div>

            {filteredTemplate && (
                <>
                    <MealSection title="Desayuno" mealType="DESAYUNO" items={filteredTemplate.DESAYUNO} selectedIds={selectedIds} onToggleItem={handleToggleItem} onAddItem={() => {}} />
                    <MealSection title="Almuerzo" mealType="ALMUERZO" items={filteredTemplate.ALMUERZO} selectedIds={selectedIds} onToggleItem={handleToggleItem} onAddItem={() => {}} />
                    <MealSection title="Cena" mealType="CENA" items={filteredTemplate.CENA} selectedIds={selectedIds} onToggleItem={handleToggleItem} onAddItem={() => {}} />
                    <MealSection title="Meriendas/Postres" mealType="MERIENDAS_POSTRES" items={filteredTemplate.MERIENDAS_POSTRES} selectedIds={selectedIds} onToggleItem={handleToggleItem} onAddItem={() => {}} />
                </>
            )}
            
            <div className="flex justify-end items-center gap-4 pt-6 border-t">
                <button onClick={handleSavePlan} disabled={isSaving} className="btn-primary flex items-center gap-2">
                    <FaSave /> {isSaving ? 'Guardando...' : 'Guardar Plan Alimentario'}
                </button>
                <button className="btn-secondary flex items-center gap-2"><FaPaperPlane /> Enviar al Paciente</button>
                <button className="btn-secondary flex items-center gap-2"><FaPrint /> Imprimir</button>
            </div>
        </div>
    );
}