'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Printer, CheckCircle, XCircle } from 'lucide-react';
import { PatientWithDetails } from '@/types';
import { FullNutritionData, MealType, DietTypeEnum } from '@/types/nutrition';
import Image from 'next/image';

const mealTitles: Record<MealType, string> = {
  DESAYUNO: 'Desayuno',
  ALMUERZO: 'Almuerzo',
  CENA: 'Cena',
  MERIENDAS_POSTRES: 'Meriendas y Postres'
};

const dietLabels: Record<DietTypeEnum, string> = {
  NINO: 'Niño',
  METABOLICA: 'Metabólica', 
  ANTIDIABETICA: 'Antidiabética',
  CITOSTATICA: 'Citostática',
  RENAL: 'Renal'
};

interface NutritionPlanPreviewProps {
  patient: PatientWithDetails;
  planData: {
    bloodType: string;
    selectedDiets: DietTypeEnum[];
    foodPlan: FullNutritionData['foodTemplate'];
    generalGuide: FullNutritionData['generalGuide'];
    wellnessKeys: FullNutritionData['wellnessKeys'];
  };
  onClose: () => void;
}

export default function NutritionPlanPreview({ patient, planData, onClose }: NutritionPlanPreviewProps) {
  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-100 rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col"
      >
        <div className="p-4 border-b bg-white rounded-t-xl flex justify-between items-center no-print">
          <h2 className="text-xl font-bold text-gray-800">
            Vista Previa del Plan de Bienestar
          </h2>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handlePrint} 
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir / Guardar PDF
            </Button>
            <Button 
              onClick={onClose} 
              variant="ghost" 
              size="icon" 
              className="text-gray-500 hover:bg-gray-200"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div 
            id="printable-content" 
            className="bg-white shadow-lg mx-auto p-8" 
            style={{width: '210mm', minHeight: '297mm'}}
          >
            <style jsx global>{`
              @media print {
                @page {
                  size: A4;
                  margin: 15mm;
                }
                body {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .no-print {
                  display: none !important;
                }
                #printable-content {
                  position: static !important;
                  width: 100% !important;
                  height: auto !important;
                  box-shadow: none !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                body * {
                  visibility: hidden;
                }
                #printable-content, 
                #printable-content * {
                  visibility: visible !important;
                }
                #printable-content {
                  position: absolute;
                  left: 0;
                  top: 0;
                }
              }
            `}</style>

            <header className="flex justify-between items-start mb-8 border-b-2 border-sky-500 pb-6">
              <div className="w-48">
                <Image src="/images/logo.png" alt="Logo Doctor Antivejez" width={160} height={40} priority />
              </div>
              <div className="text-right">
                <h1 className="text-2xl font-bold text-sky-600">Plan de Bienestar Nutrigenómico</h1>
                <p className="text-gray-500">Personalizado para {patient.firstName} {patient.lastName}</p>
                <p className="text-sm text-gray-400 mt-1">Fecha: {new Date().toLocaleDateString('es-ES')}</p>
              </div>
            </header>

            <section className="mb-8 p-4 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Paciente</p>
                      <p className="font-bold text-lg text-gray-800">{patient.firstName} {patient.lastName}</p>
                  </div>
                  <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">ID</p>
                      <p className="font-bold text-lg text-gray-800">{patient.identification}</p>
                  </div>
                  <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Grupo Sanguíneo</p>
                      <p className="font-bold text-lg text-gray-800">{planData.bloodType.replace('_', ' y ')}</p>
                  </div>
                  <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Edad</p>
                      <p className="font-bold text-lg text-gray-800">{patient.chronologicalAge} años</p>
                  </div>
                  {planData.selectedDiets.length > 0 && (
                      <div className="col-span-full mt-2">
                          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Tipo de Alimentación</p>
                           <div className="flex flex-wrap gap-2">
                              {planData.selectedDiets.map(diet => (
                                <Badge key={diet} className="bg-sky-100 text-sky-800 text-sm font-medium">
                                  {dietLabels[diet]}
                                </Badge>
                              ))}
                            </div>
                      </div>
                  )}
              </div>
            </section>
            
            <main className="space-y-8">
              <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">Plan Alimentario Sugerido</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      {Object.entries(planData.foodPlan).map(([mealType, items]) => {
                          if (items.length === 0) return null;
                          return (
                              <div key={mealType} className="break-inside-avoid">
                                  <h3 className="font-bold text-sky-600 mb-3 text-lg">{mealTitles[mealType as MealType]}</h3>
                                  <ul className="list-disc list-inside space-y-1.5 text-gray-700 text-sm">
                                      {items.map(item => <li key={item.id}>{item.name}</li>)}
                                  </ul>
                              </div>
                          );
                      })}
                  </div>
              </section>

              <section className="break-inside-avoid">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">Guía General</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                          <h3 className="font-semibold text-red-600 flex items-center gap-2 mb-3"><XCircle className="w-5 h-5" /> Alimentos a Evitar</h3>
                          <ul className="space-y-1 pl-5 list-disc text-gray-700 text-sm">
                              {planData.generalGuide.AVOID.map((item) => <li key={item.id}>{item.text}</li>)}
                          </ul>
                      </div>
                      <div>
                          <h3 className="font-semibold text-green-600 flex items-center gap-2 mb-3"><CheckCircle className="w-5 h-5" /> Sustitutos Recomendados</h3>
                          <ul className="space-y-1 pl-5 list-disc text-gray-700 text-sm">
                              {planData.generalGuide.SUBSTITUTE.map((item) => <li key={item.id}>{item.text}</li>)}
                          </ul>
                      </div>
                  </div>
              </section>
              
              <section className="break-inside-avoid">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">Claves de la Longevidad 5A</h2>
                  <div className="space-y-4">
                      {planData.wellnessKeys.map((key, index) => (
                          <div key={key.id} className="pl-4 border-l-4 border-sky-500">
                              <div className="flex items-start gap-2 mb-1">
                                <Badge variant="outline" className="text-sky-600 border-sky-200 font-bold text-xs">
                                  {index + 1}
                                </Badge>
                                <h4 className="font-semibold text-gray-800 text-base">{key.title}</h4>
                              </div>
                              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap pl-8">{key.description}</p>
                          </div>
                      ))}
                  </div>
              </section>

              <footer className="text-center text-gray-500 text-sm mt-12 pt-6 border-t border-gray-200">
                <p>© Doctor AntiVejez - Plan de Bienestar Personalizado</p>
                <p>Generado el {new Date().toLocaleString('es-ES')}</p>
              </footer>
            </main>
          </div>
        </div>
      </motion.div>
    </div>
  );
}