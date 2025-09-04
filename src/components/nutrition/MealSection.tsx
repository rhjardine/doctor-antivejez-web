'use client';

import React, { useState } from 'react';
import { FoodItem, MealType } from '@/types/nutrition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Trash2, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ===== CORRECCIÓN =====
// Se define la interfaz de props para este componente.
// El error ocurría porque la prop 'title' no estaba definida aquí.
// Ahora la incluimos explícitamente.
export interface MealSectionProps {
  title: string;
  items: FoodItem[];
  mealType: MealType;
  onAddItem: (mealType: MealType, name: string) => void;
  onEditItem: (mealType: MealType, index: number, currentName: string) => void;
  onDeleteItem: (mealType: MealType, index: number) => void;
}

export default function MealSection({
  title, // Se recibe la prop 'title'
  items,
  mealType,
  onAddItem,
  onEditItem,
  onDeleteItem
}: MealSectionProps) {
  const [newItemName, setNewItemName] = useState('');

  const handleAddClick = () => {
    if (newItemName.trim()) {
      onAddItem(mealType, newItemName.trim());
      setNewItemName('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddClick();
    }
  };

  return (
    <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        {/* Se utiliza la prop 'title' para renderizar el título de la tarjeta */}
        <CardTitle className="text-xl font-bold text-gray-700 capitalize">
          {title.toLowerCase().replace('_', ' ')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 mb-4">
          <AnimatePresence>
            {items.map((item, index) => (
              <motion.li
                key={item.id || index}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <span className="text-gray-800">{item.name}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:text-blue-600"
                    onClick={() => onEditItem(mealType, index, item.name)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:text-red-600"
                    onClick={() => onDeleteItem(mealType, index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200">
          <Input
            type="text"
            placeholder="Añadir nuevo alimento..."
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-grow"
          />
          <Button onClick={handleAddClick} className="bg-primary hover:bg-primary/90 text-white">
            <PlusCircle className="w-4 h-4 mr-2" />
            Añadir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}