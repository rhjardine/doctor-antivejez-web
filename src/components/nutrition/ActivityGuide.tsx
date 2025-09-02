// src/components/nutrition/ActivityGuide.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, Clock } from 'lucide-react';

const ActivityGuide = () => {
  return (
    <Card className="shadow-lg bg-white">
      <CardHeader>
        <CardTitle className="text-2xl text-gray-800 flex items-center gap-3">
          <Dumbbell className="text-sky-500" />
          Actividad Física Regular
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 text-gray-700 space-y-4">
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border">
          <Clock className="w-8 h-8 text-sky-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-gray-800">
              ACTIVIDAD FÍSICA 3 a 6 veces por semana
            </h4>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
              <li>1-2 horas/día: 10 min. calentamiento, 50 min cardiovascular</li>
              <li>Ejercicios para bajar de peso en la mañana, para ganar masa muscular en la tarde</li>
              <li>Frecuencia cardíaca de ENTRENAMIENTO 220 - edad x 60-80%</li>
            </ul>
          </div>
        </div>
        
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border">
          <Dumbbell className="w-8 h-8 text-sky-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-gray-800">
              (MAÑANA) 30 minutos antes del ejercicio (TARDE)
            </h4>
            <p className="text-sm">Antes, durante o después del ejercicio</p>
            <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
              <div>
                <p className="font-bold underline">TERMO</p>
                <ul className="list-disc pl-5">
                  <li>Café té o cacao</li>
                  <li>2 capsulas de Fat Burner</li>
                  <li>1 cucharadita de aceite TRIOIKY</li>
                </ul>
              </div>
              <div>
                <p className="font-bold underline">TERMO</p>
                <ul className="list-disc pl-5">
                  <li>Whey protein / Vegan Protein</li>
                  <li>2 capsulas MBI 6 H.L.</li>
                  <li>Café</li>
                  <li>Te verde</li>
                  <li>Agua de limón</li>
                  <li>Agua vinagre de manzana</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityGuide;