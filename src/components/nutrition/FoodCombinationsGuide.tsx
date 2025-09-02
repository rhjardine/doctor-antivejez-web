// src/components/nutrition/FoodCombinationsGuide.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Utensils } from 'lucide-react';

const FoodCombinationsGuide = () => {
  return (
    <Card className="shadow-lg bg-white">
      <CardHeader>
        <CardTitle className="text-2xl text-gray-800 flex items-center gap-3">
          <Utensils className="text-sky-500" />
          Combinaciones de Alimentos
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="border-l-4 border-sky-500 pl-4">
          <h4 className="font-bold text-lg text-gray-800 mb-3">DESAYUNO</h4>
          <div className="space-y-2 text-sm text-gray-700">
            <p><span className="font-semibold">Frutas:</span> Granola, Lácteos de cabra o semilla, Huevos, Casabe, Concha, Arepa Integral, Tortillas de maíz o arroz</p>
          </div>
        </div>

        <div className="border-l-4 border-amber-500 pl-4">
          <h4 className="font-bold text-lg text-gray-800 mb-3">ALMUERZO</h4>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <span className="font-semibold text-red-600">Proteínas ←←← EVITAR MEZCLAR CON →→→</span>
              <span className="font-semibold text-blue-600"> Carbohidratos Integrales</span>
            </div>
            <div>
              <span className="font-semibold">Carnes</span> (blancas, rojas), huevos, quesos cabra, soya + 
              <span className="font-semibold"> ACEITE DE COCO, AGUACATE</span> | 
              arroz, maíz, plátano, yuca, batata + 
              <span className="font-semibold"> OLIVA EXTRAVIRGEN, TRIOIL</span>
            </div>
            <div>
              <span className="font-semibold">COMBINAR CON →→→</span> Granos, Vegetales frescos ←←← 
              <span className="font-semibold">COMBINAR CON</span>
            </div>
            <div>
              Arroz o Plasta sin gluten: maíz, arroz, quinoa, lenteja, garbanzo
            </div>
          </div>
        </div>

        <div className="border-l-4 border-purple-500 pl-4">
          <h4 className="font-bold text-lg text-gray-800 mb-3">CENA</h4>
          <div className="space-y-2 text-sm text-gray-700">
            <p><span className="font-semibold">Ensaladas y proteínas:</span> Puede incluir sardinas, salmón, cangrejo, huevos sancochados o quesos cabra, antipasto, ceviche, sushi, carpaccio</p>
          </div>
        </div>

        <div className="bg-sky-50 rounded-lg p-4 border border-sky-200">
          <h4 className="font-bold text-sky-800 mb-2">Claves Importantes:</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• <span className="font-semibold">Frutas de Bajo Índice Glicémico</span> (exclusivamente en el desayuno): manzana, pera, cerezas, fresas, moras, uvas, ciruela, kiwi, grapefruit, toronja, naranja</li>
            <li>• <span className="font-semibold">Ayuno intermitente:</span> Como temprano y tome un termo té, café (con aceite TRIOIL) hasta el mediodía del siguiente día (2-3 veces por semana)</li>
            <li>• <span className="font-semibold">Hidratación:</span> Tomar de 6-8 vasos de agua de limón o infusiones fuera de las comidas (con agua mineral)</li>
            <li>• <span className="font-semibold">Merienda:</span> 1 merienda 3 media tarde y media noche</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default FoodCombinationsGuide;