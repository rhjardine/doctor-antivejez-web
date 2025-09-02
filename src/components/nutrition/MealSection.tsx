// src/components/nutrition/MealSection.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit2, Trash2, Utensils } from 'lucide-react';
import { FoodItem, MealType } from '@/types/nutrition';

const mealIcons: Record<MealType, string> = {
  DESAYUNO: '🌅',
  ALMUERZO: '☀️',
  CENA: '🌙',
  MERIENDAS_POSTRES: '🍯'
};

const mealTitles: Record<MealType, string> = {
  DESAYUNO: 'Desayuno',
  ALMUERZO: 'Almuerzo',
  CENA: 'Cena',
  MERIENDAS_POSTRES: 'Meriendas y Postres'
};

interface MealSectionProps {
  items: FoodItem[];
  mealType: MealType;
  onAddItem: (mealType: MealType, name: string) => void;
  onEditItem: (mealType: MealType, index: number, currentName: string) => void;
  onDeleteItem: (mealType: MealType, index: number) => void;
}

export default function MealSection({ items, mealType, onAddItem, onEditItem, onDeleteItem }: MealSectionProps) {
  const [newItemName, setNewItemName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddItem = () => {
    if (newItemName.trim()) {
      onAddItem(mealType, newItemName.trim());
      setNewItemName('');
      setIsAdding(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddItem();
    } else if (e.key === 'Escape') {
      setNewItemName('');
      setIsAdding(false);
    }
  };

  const displayTitle = mealTitles[mealType] || mealType;
  const icon = mealIcons[mealType] || '🍽️';

  return (
    <Card className="shadow-lg border-0 overflow-hidden bg-white">
      <CardHeader className="bg-gradient-to-r from-sky-500 to-sky-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <h3 className="text-xl font-bold">{displayTitle}</h3>
              <p className="text-sky-100 text-sm">
                {items?.length || 0} alimento{(items?.length || 0) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsAdding(true)}
            variant="outline"
            size="sm"
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          <AnimatePresence>
            {items?.map((food, index) => (
              <motion.div
                key={food.id || `${mealType}-${index}`}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative"
              >
                <div className="backdrop-blur-sm bg-gray-100/70 rounded-lg p-3 border border-gray-200/50 hover:bg-gray-100/90 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-800 font-medium flex-grow text-sm leading-tight">
                      {food.name}
                    </span>
                    <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button
                        onClick={(e) => { e.stopPropagation(); onEditItem(mealType, index, food.name); }}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteItem(mealType, index); }}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-200 pt-4"
            >
              <div className="flex items-center gap-3">
                <Input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={`Nuevo alimento para ${displayTitle.toLowerCase()}...`}
                  className="flex-grow focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  autoFocus
                />
                <Button onClick={handleAddItem} disabled={!newItemName.trim()} className="bg-sky-500 hover:bg-sky-600 text-white px-4">
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </Button>
                <Button onClick={() => { setNewItemName(''); setIsAdding(false); }} variant="outline" className="px-4">
                  Cancelar
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {(!items || items.length === 0) && !isAdding && (
          <div className="text-center py-8 text-gray-500">
            <Utensils className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No hay alimentos agregados aún.</p>
            <Button onClick={() => setIsAdding(true)} variant="outline" size="sm" className="mt-3">
              <Plus className="w-4 h-4 mr-2" />
              Agregar primer alimento
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}