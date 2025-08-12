// src/components/orthomolecular/OrthomolecularTestView.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { orthomolecularTestSchema, OrthomolecularTestFormValues } from '@/types/orthomolecular';
import { PatientWithDetails } from '@/types';
import { FaFlask, FaSave, FaChartLine } from 'react-icons/fa';
import { toast } from 'sonner';

// Lista de elementos a medir, separados por categoría
const elementGroups = {
  toxicMetals: [
    { id: 'aluminio', name: 'Aluminio' }, { id: 'antimonio', name: 'Antimonio' },
    { id: 'arsenico', name: 'Arsénico' }, { id: 'bario', name: 'Bario' },
    { id: 'berilio', name: 'Berilio' }, { id: 'bismuto', name: 'Bismuto' },
    { id: 'cadmio', name: 'Cadmio' }, { id: 'mercurio', name: 'Mercurio' },
    { id: 'niquel', name: 'Níquel' }, { id: 'plata', name: 'Plata' },
    { id: 'platino', name: 'Platino' }, { id: 'plomo', name: 'Plomo' },
    { id: 'talio', name: 'Talio' }, { id: 'tinio', name: 'Tinio' },
    { id: 'titanio', name: 'Titanio' }, { id: 'torio', name: 'Torio' },
    { id: 'uranio', name: 'Uranio' },
  ],
  minerals: [
    { id: 'calcio', name: 'Calcio' }, { id: 'magnesio', name: 'Magnesio' },
    { id: 'sodio', name: 'Sodio' }, { id: 'potasio', name: 'Potasio' },
    { id: 'cobre', name: 'Cobre' }, { id: 'zinc', name: 'Zinc' },
    { id: 'manganeso', name: 'Manganeso' }, { id: 'cromo', name: 'Cromo' },
    { id: 'vanadio', name: 'Vanadio' }, { id: 'molibdeno', name: 'Molibdeno' },
    { id: 'boro', name: 'Boro' }, { id: 'yodo', name: 'Yodo' },
    { id: 'litio', name: 'Litio' }, { id: 'phosphoro', name: 'Phosphoro' },
    { id: 'selenio', name: 'Selenio' }, { id: 'estronio', name: 'Estronio' },
    { id: 'azufre', name: 'Azufre' }, { id: 'cobalto', name: 'Cobalto' },
    { id: 'hierro', name: 'Hierro' }, { id: 'germanio', name: 'Germanio' },
    { id: 'rubidio', name: 'Rubidio' }, { id: 'zirconio', name: 'Zirconio' },
  ],
};

// --- FUNCIÓN DE CÁLCULO DE EDAD ORTHOMOLECULAR (PLACEHOLDER) ---
// IMPORTANTE: Reemplazar esta lógica con las fórmulas reales.
const calculateOrthomolecularAge = (values: OrthomolecularTestFormValues['elements'], chronologicalAge: number): number => {
  if (!values || Object.keys(values).length === 0) return 0;
  
  let score = 0;
  // Ejemplo: Sumar 0.1 años por cada punto de plomo
  score += (values.plomo || 0) * 0.1;
  // Ejemplo: Restar 0.05 años por cada punto de zinc
  score -= (values.zinc || 0) * 0.05;

  const calculatedAge = chronologicalAge + score;
  return Math.round(calculatedAge * 10) / 10; // Redondear a 1 decimal
};


export default function OrthomolecularTestView({ patient }: { patient: PatientWithDetails }) {
  const form = useForm<OrthomolecularTestFormValues>({
    resolver: zodResolver(orthomolecularTestSchema),
    defaultValues: {
      elements: {},
    },
  });

  const watchedElements = form.watch('elements');
  const chronologicalAge = patient.age; // Asumiendo que 'age' existe en el tipo PatientWithDetails

  const orthomolecularAge = useMemo(
    () => calculateOrthomolecularAge(watchedElements, chronologicalAge),
    [watchedElements, chronologicalAge]
  );

  const differentialAge = useMemo(
    () => (orthomolecularAge > 0 ? chronologicalAge - orthomolecularAge : 0),
    [chronologicalAge, orthomolecularAge]
  );

  const onSubmit = (data: OrthomolecularTestFormValues) => {
    console.log({ ...data, orthomolecularAge });
    toast.success('Test Orthomolecular guardado exitosamente (simulado).');
    // Aquí iría la llamada a la Server Action para guardar en la base de datos.
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* --- SECCIÓN DE ENTRADA DE DATOS --- */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold text-primary-dark mb-6 flex items-center gap-3">
          <FaFlask />
          Test Orthomolecular
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          {/* Columna de Metales Tóxicos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-red-600 border-b-2 border-red-200 pb-2">Metales Tóxicos</h3>
            {elementGroups.toxicMetals.map(({ id, name }) => (
              <div key={id} className="grid grid-cols-2 items-center gap-4">
                <label htmlFor={id} className="font-medium text-gray-700">{name}</label>
                <input
                  id={id}
                  type="number"
                  step="any"
                  {...form.register(`elements.${id}`)}
                  className="input text-center"
                  placeholder="Resultado"
                />
              </div>
            ))}
          </div>
          {/* Columna de Minerales y Oligoelementos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-600 border-b-2 border-green-200 pb-2">Minerales y Oligoelementos</h3>
            {elementGroups.minerals.map(({ id, name }) => (
              <div key={id} className="grid grid-cols-2 items-center gap-4">
                <label htmlFor={id} className="font-medium text-gray-700">{name}</label>
                <input
                  id={id}
                  type="number"
                  step="any"
                  {...form.register(`elements.${id}`)}
                  className="input text-center"
                  placeholder="Resultado"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- SECCIÓN DE RESULTADOS --- */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold text-primary-dark mb-6 flex items-center gap-3">
          <FaChartLine />
          Resultados del Análisis
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-600 mb-1">Edad Cronológica</h4>
            <p className="text-3xl font-bold text-gray-800">{chronologicalAge}</p>
          </div>
          <div className="bg-blue-100 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-800 mb-1">Edad Orthomolecular</h4>
            <p className="text-3xl font-bold text-blue-600">{orthomolecularAge.toFixed(1)}</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-green-800 mb-1">Edad Diferencial</h4>
            <p className="text-3xl font-bold text-green-600">{differentialAge.toFixed(1)}</p>
          </div>
        </div>
      </div>

      {/* --- BOTÓN DE ACCIÓN --- */}
      <div className="flex justify-end">
        <button type="submit" className="btn-primary flex items-center gap-2">
          <FaSave />
          Guardar Resultados
        </button>
      </div>
    </form>
  );
}
