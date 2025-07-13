'use client';

import { useState } from 'react';
import { Patient } from '@/types';
import { toast } from 'sonner';
import { FaArrowLeft, FaSave, FaEdit, FaUndo, FaChartBar } from 'react-icons/fa';

interface EdadBioquimicaTestViewProps {
  patient: Patient;
  onBack: () => void;
}

// Lista de ítems para el formulario bioquímico
const BIOCHEMISTRY_ITEMS = [
  { key: 'somatomedin', label: 'Somatomedina C (IGF-1) (ng/mL)' },
  { key: 'hba1c', label: 'Hb Glicosilada: %' },
  { key: 'insulin', label: 'insulina Basal' },
  { key: 'postPrandial', label: 'Post Prandial (mui/mL)' },
  { key: 'tgHdlRatio', label: 'Relación TG: mg/dl - HDL' },
  { key: 'dhea', label: 'DHEA-S: ug/dl' },
  { key: 'homocysteine', label: 'Homocisteina (umol/L)' },
  { key: 'psa', label: 'PSA Total / Libre (%)' },
  { key: 'fsh', label: 'FSH UI/L' },
  { key: 'boneDensitometry', label: 'Densitometría ósea: F' },
];

export default function EdadBioquimicaTestView({ patient, onBack }: EdadBioquimicaTestViewProps) {
  const [formValues, setFormValues] = useState<Record<string, string | number>>({});
  const [processing, setProcessing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Placeholder para manejar cambios en los inputs
  const handleInputChange = (key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
    setIsSaved(false); // Si se edita, se debe volver a guardar
  };

  // Placeholder para la lógica de cálculo y guardado
  const handleCalculateAndSave = () => {
    setProcessing(true);
    toast.info('La funcionalidad de cálculo y guardado se implementará próximamente.');
    setTimeout(() => {
      setIsSaved(true);
      setProcessing(false);
    }, 1000);
  };
  
  // Placeholder para habilitar la edición
  const handleEdit = () => {
    setIsSaved(false);
    toast.info("El formulario ha sido habilitado para edición.");
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Columna del Formulario */}
      <div className="w-full md:w-1/2 bg-primary-dark rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
          >
            <FaArrowLeft />
            <span>Volver</span>
          </button>
          <div className="text-right">
            <h2 className="text-xl font-bold">
              {patient.firstName} {patient.lastName}
            </h2>
            <p className="text-sm opacity-80">
              Edad: {patient.chronologicalAge} años
            </p>
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-4">Test de Edad Bioquímica</h3>

        <div className="space-y-4 pr-2">
          {BIOCHEMISTRY_ITEMS.map(item => (
            <div key={item.key} className="bg-white/10 rounded-lg p-4">
              <label className="block text-sm font-medium mb-2">
                {item.label}
              </label>
              <input 
                type="number" 
                step="any" 
                value={formValues[item.key] ?? ''} 
                onChange={e => handleInputChange(item.key, e.target.value)} 
                className="input w-full" 
                disabled={isSaved || processing}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Columna de Resultados y Gráficos */}
      <div className="w-full md:w-1/2 space-y-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultados</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Edad Cronológica</p>
              <p className="text-3xl font-bold text-gray-900">
                {patient.chronologicalAge}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Edad Bioquímica</p>
              <p className="text-3xl font-bold text-primary">--</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Diferencial</p>
              <p className="text-3xl font-bold text-gray-900">--</p>
            </div>
          </div>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Gráficos de Evolución</h3>
          <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <FaChartBar className="mx-auto text-4xl mb-2" />
              <p>Gráficos de resultados próximamente.</p>
            </div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={handleCalculateAndSave}
            disabled={processing || isSaved}
            className="w-full bg-primary text-white font-medium py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <FaSave />
            <span>{processing ? 'Procesando...' : 'Calcular y Guardar'}</span>
          </button>
          <button
            type="button"
            onClick={handleEdit}
            disabled={!isSaved || processing}
            className="w-full bg-yellow-500 text-white font-medium py-3 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <FaEdit />
            <span>Editar</span>
          </button>
          <button
            type="button"
            onClick={onBack}
            disabled={processing}
            className="w-full bg-gray-600 text-white font-medium py-3 rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaUndo />
            <span>Volver</span>
          </button>
        </div>
      </div>
    </div>
  );
}
