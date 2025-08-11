// src/components/patient-guide/RevitalizationItem.tsx
import React from 'react';
import { UseFormRegister, FieldValues } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { RevitalizationGuideItem } from '@/types/guide';

interface RevitalizationItemProps {
  item: RevitalizationGuideItem;
  categoryIndex: number;
  itemIndex: number;
  register: UseFormRegister<FieldValues>;
}

// Componente para el item específico de la Fase de Revitalización
export const RevitalizationItem: React.FC<RevitalizationItemProps> = ({
  item,
  categoryIndex,
  itemIndex,
  register,
}) => {
  const fieldNamePrefix = `categories.${categoryIndex}.items.${itemIndex}`;

  return (
    <div className="flex items-center space-x-4 p-2 bg-blue-50/50 rounded-md border border-blue-100">
      <Checkbox
        id={`${fieldNamePrefix}.selected`}
        {...register(`${fieldNamePrefix}.selected`)}
        defaultChecked={item.selected}
      />
      <label htmlFor={`${fieldNamePrefix}.selected`} className="font-medium text-sm text-gray-800 whitespace-nowrap">
        {item.label}:
      </label>
      
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm">Complejo B:</span>
        <Input
          type="text"
          placeholder="cc"
          className="w-20 h-8"
          {...register(`${fieldNamePrefix}.complejoB_cc`)}
          defaultValue={item.complejoB_cc}
        />
        <span className="text-sm">+ Bioquel:</span>
        <Input
          type="text"
          placeholder="cc"
          className="w-20 h-8"
          {...register(`${fieldNamePrefix}.bioquel_cc`)}
          defaultValue={item.bioquel_cc}
        />
        <span className="text-sm">Frecuencia:</span>
        <Input
          type="text"
          placeholder="Ej: 10 dosis"
          className="w-32 h-8"
          {...register(`${fieldNamePrefix}.frequency`)}
          defaultValue={item.frequency}
        />
      </div>
    </div>
  );
};
