'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Food, MealType, NutritionGuide } from '@prisma/client';
import { getFoodsByBloodType, GroupedFoods, createOrUpdateNutritionGuide } from '@/lib/actions/nutrition.actions';
import { Patient } from '@/types';
import { toast } from 'sonner';

// --- SUBCOMPONENTES PARA UNA MEJOR ESTRUCTURA ---

// Props para el selector de comidas
interface MealSelectorProps {
  selectedMeal: MealType;
  setSelectedMeal: (meal: MealType) => void;
}

// Componente para los botones de selección de comida (Desayuno, Almuerzo, etc.)
const MealSelector: React.FC<MealSelectorProps> = ({ selectedMeal, setSelectedMeal }) => {
  const meals: MealType[] = ['BREAKFAST', 'LUNCH', 'SNACK', 'DINNER'];
  const mealTranslations: Record<MealType, string> = {
    BREAKFAST: 'Desayuno',
    LUNCH: 'Almuerzo',
    SNACK: 'Merienda',
    DINNER: 'Cena',
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {meals.map((meal) => (
        <button
          key={meal}
          onClick={() => setSelectedMeal(meal)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            selectedMeal === meal
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {mealTranslations[meal]}
        </button>
      ))}
    </div>
  );
};

// Props para el visualizador de alimentos
interface FoodDisplayProps {
  foods: GroupedFoods;
  onFoodSelect: (food: Food) => void;
  selectedFoodIds: Set<string>;
}

// Componente para mostrar las listas de alimentos por categoría y beneficio
const FoodDisplay: React.FC<FoodDisplayProps> = ({ foods, onFoodSelect, selectedFoodIds }) => {
  const [activeCategory, setActiveCategory] = useState(Object.keys(foods)[0] || '');

  const benefitColors = {
    BENEFICIAL: 'border-green-500 bg-green-50',
    NEUTRAL: 'border-yellow-500 bg-yellow-50',
    AVOID: 'border-red-500 bg-red-50 text-gray-500',
  };

  const categoryTranslations: Record<string, string> = {
    PROTEINS: 'Proteínas',
    DAIRY_EGGS: 'Lácteos y Huevos',
    OILS_FATS: 'Aceites y Grasas',
    NUTS_SEEDS: 'Nueces y Semillas',
    LEGUMES: 'Legumbres',
    GRAINS: 'Cereales',
    VEGETABLES: 'Vegetales',
    FRUITS: 'Frutas',
    JUICES: 'Jugos',
    SPICES: 'Especias',
    TEAS: 'Tés',
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex flex-wrap gap-2 border-b mb-4 pb-2">
        {Object.keys(foods).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-3 py-1 text-sm rounded-full ${
              activeCategory === category ? 'bg-gray-800 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {categoryTranslations[category] || category}
          </button>
        ))}
      </div>

      {activeCategory && foods[activeCategory] && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Columna Beneficiosos */}
          <div className={`p-2 rounded-lg border-2 ${benefitColors.BENEFICIAL}`}>
            <h3 className="font-bold text-green-700 mb-2 text-center">Beneficiosos</h3>
            <div className="flex flex-wrap gap-2">
              {foods[activeCategory].BENEFICIAL.map((food) => (
                <button key={food.id} onClick={() => onFoodSelect(food)} className={`px-2 py-1 text-xs rounded-md transition-all ${selectedFoodIds.has(food.id) ? 'bg-green-600 text-white scale-105' : 'bg-white hover:bg-green-100 border'}`}>
                  {food.name}
                </button>
              ))}
            </div>
          </div>
          {/* Columna Neutros */}
          <div className={`p-2 rounded-lg border-2 ${benefitColors.NEUTRAL}`}>
            <h3 className="font-bold text-yellow-700 mb-2 text-center">Neutros</h3>
             <div className="flex flex-wrap gap-2">
              {foods[activeCategory].NEUTRAL.map((food) => (
                <button key={food.id} onClick={() => onFoodSelect(food)} className={`px-2 py-1 text-xs rounded-md transition-all ${selectedFoodIds.has(food.id) ? 'bg-yellow-600 text-white scale-105' : 'bg-white hover:bg-yellow-100 border'}`}>
                  {food.name}
                </button>
              ))}
            </div>
          </div>
          {/* Columna A Evitar */}
          <div className={`p-2 rounded-lg border-2 ${benefitColors.AVOID}`}>
            <h3 className="font-bold text-red-700 mb-2 text-center">A Evitar</h3>
             <div className="flex flex-wrap gap-2">
              {foods[activeCategory].AVOID.map((food) => (
                <div key={food.id} className="px-2 py-1 text-xs rounded-md bg-gray-200 cursor-not-allowed">
                  {food.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

interface NutrigenomicGuideProps {
  patient: Patient;
  guide: NutritionGuide | null;
}

export default function NutrigenomicGuide({ patient, guide }: NutrigenomicGuideProps) {
  const [isPending, startTransition] = useTransition();
  const [foods, setFoods] = useState<GroupedFoods>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState<MealType>('BREAKFAST');
  
  // Estado para almacenar los alimentos seleccionados para cada comida
  const [mealPlan, setMealPlan] = useState<Record<MealType, Food[]>>({
    BREAKFAST: [],
    LUNCH: [],
    SNACK: [],
    DINNER: [],
  });
  
  const [observations, setObservations] = useState('');

  // Efecto para cargar los alimentos según el tipo de sangre al montar el componente
  useEffect(() => {
    const fetchFoods = async () => {
      if (!patient.bloodType) {
        toast.warning('El paciente no tiene un tipo de sangre asignado.');
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const groupedFoods = await getFoodsByBloodType(patient.id);
        setFoods(groupedFoods);
      } catch (error) {
        toast.error('Error al cargar la lista de alimentos.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFoods();
  }, [patient.id, patient.bloodType]);

  // Efecto para inicializar el plan de comidas si ya existe una guía
  useEffect(() => {
    if (guide?.foodPlan?.meals) {
      const initialPlan: Record<MealType, Food[]> = { BREAKFAST: [], LUNCH: [], SNACK: [], DINNER: [] };
      guide.foodPlan.meals.forEach(meal => {
        if (meal.items) {
          initialPlan[meal.type] = meal.items.map(item => item.food);
        }
      });
      setMealPlan(initialPlan);
      setObservations(guide.observations || '');
    }
  }, [guide]);


  // Maneja la selección/deselección de un alimento para la comida activa
  const handleFoodSelect = (food: Food) => {
    setMealPlan(prevPlan => {
      const currentMealFoods = prevPlan[selectedMeal];
      const isSelected = currentMealFoods.some(f => f.id === food.id);
      
      const newMealFoods = isSelected
        ? currentMealFoods.filter(f => f.id !== food.id) // Deseleccionar
        : [...currentMealFoods, food]; // Seleccionar
        
      return { ...prevPlan, [selectedMeal]: newMealFoods };
    });
  };

  // Maneja el guardado del formulario
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const planData = {
        breakfast: { foodIds: mealPlan.BREAKFAST.map(f => f.id) },
        lunch: { foodIds: mealPlan.LUNCH.map(f => f.id) },
        snack: { foodIds: mealPlan.SNACK.map(f => f.id) },
        dinner: { foodIds: mealPlan.DINNER.map(f => f.id) },
      };

      const result = await createOrUpdateNutritionGuide(patient.id, {
        plan: planData,
        observations,
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };
  
  const selectedFoodIdsForCurrentMeal = new Set(mealPlan[selectedMeal].map(f => f.id));
  const mealTranslations: Record<MealType, string> = {
    BREAKFAST: 'Desayuno', LUNCH: 'Almuerzo', SNACK: 'Merienda', DINNER: 'Cena',
  };

  if (isLoading) {
    return <div className="text-center p-8">Cargando guía de alimentos...</div>;
  }

  if (!patient.bloodType) {
    return <div className="text-center p-8 bg-yellow-100 border border-yellow-300 rounded-md">Por favor, asigne un tipo de sangre al paciente para ver las recomendaciones.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800">Guía Nutrigenómica - Tipo de Sangre: {patient.bloodType}</h2>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Seleccione una comida para añadir alimentos:</h3>
        <MealSelector selectedMeal={selectedMeal} setSelectedMeal={setSelectedMeal} />
      </div>

      <FoodDisplay foods={foods} onFoodSelect={handleFoodSelect} selectedFoodIds={selectedFoodIdsForCurrentMeal} />

      {/* Vista previa del plan de comidas */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 border-b pb-2">Plan de Comidas Sugerido</h3>
        {Object.entries(mealPlan).map(([mealType, foods]) => (
          <div key={mealType}>
            <h4 className="font-semibold text-blue-700">{mealTranslations[mealType as MealType]}</h4>
            <div className="flex flex-wrap gap-2 mt-2 p-2 bg-gray-50 rounded-md min-h-[40px]">
              {foods.length > 0 ? (
                foods.map(food => (
                  <span key={food.id} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {food.name}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500">No hay alimentos seleccionados.</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Campo de observaciones */}
      <div>
        <label htmlFor="observations" className="block text-lg font-semibold text-gray-700 mb-2">
          Observaciones
        </label>
        <textarea
          id="observations"
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          rows={4}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="Añadir observaciones o indicaciones adicionales..."
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
        >
          {isPending ? 'Guardando...' : 'Guardar Guía'}
        </button>
      </div>
    </form>
    
  );
}
