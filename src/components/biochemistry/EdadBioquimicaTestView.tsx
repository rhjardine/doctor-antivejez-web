'use client';

import { useState } from 'react';
import { Patient } from '@/types';
import { toast } from 'sonner';
import { FaArrowLeft, FaSave, FaEdit, FaUndo, FaChartBar, FaCheckCircle } from 'react-icons/fa';
import { calculateBioquimicaResults } from '@/utils/bioquimica-calculations';
import { saveBiochemistryTest } from '@/lib/actions/biochemistry.actions';
import { BiochemistryFormValues, BiochemistryPartialAges } from '@/types/biochemistry';

interface EdadBioquimicaTestViewProps {
  patient: Patient;
  onBack: () => void;
}

const BIOCHEMISTRY_ITEMS = [
  { key: 'somatomedin', label: 'Somatomedina C (IGF-1) (ng/mL)', isDim: false },
  { key: 'hba1c', label: 'Hb Glicosilada: %', isDim: false },
  { key: 'insulin', label: 'Insulina Basal', isDim: false },
  { key: 'postPrandial', label: 'Post Prandial (mui/mL)', isDim: false },
  { key: 'tgHdlRatio', label: 'Relación TG: mg/dl - HDL', isDim: false },
  { key: 'dhea', label: 'DHEA-S: ug/dl', isDim: false },
  { key: 'homocysteine', label: 'Homocisteina (umol/L)', isDim: false },
  { key: 'psa', label: 'PSA Total / Libre (%)', isDim: false },
  { key: 'fsh', label: 'FSH UI/L', isDim: false },
  { key: 'boneDensitometry', label: 'Densitometría ósea (Fémur / Columna)', isDim: true },
];

export default function EdadBioquimicaTestView({ patient, onBack }: EdadBioquimicaTestViewProps) {
  const [formValues, setFormValues] = useState<Partial<BiochemistryFormValues>>({});
  const [partialAges, setPartialAges] = useState<Partial<BiochemistryPartialAges>>({});
  const [finalAge, setFinalAge] = useState<number | null>(null);
  const [differentialAge, setDifferentialAge] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleInputChange = (key: keyof BiochemistryFormValues, value: string, subKey?: 'field1' | 'field2') => {
    const numericValue = value === '' ? undefined : parseFloat(value);
    setFormValues(prev => {
      if (key === 'boneDensitometry' && subKey) {
        const currentDims = (prev.boneDensitometry || {}) as { field1?: number; field2?: number };
        return { ...prev, boneDensitometry: { ...currentDims, [subKey]: numericValue } };
      }
      return { ...prev, [key]: numericValue };
    });
    setIsSaved(false);
    setFinalAge(null);
  };

  const handleCalculateAndSave = async () => {
    setProcessing(true);
    try {
      const result = calculateBioquimicaResults(formValues as BiochemistryFormValues, patient.chronologicalAge);
      setPartialAges(result.partialAges);
      setFinalAge(result.biochemicalAge);
      setDifferentialAge(result.differentialAge);

      await saveBiochemistryTest({
        patientId: patient.id,
        chronologicalAge: patient.chronologicalAge,
        biochemicalAge: result.biochemicalAge,
        differentialAge: result.differentialAge,
        ...formValues,
        boneDensitometry: formValues.boneDensitometry ? (formValues.boneDensitometry.field1 + formValues.boneDensitometry.field2) / 2 : undefined,
      });

      toast.success('Test Bioquímico guardado exitosamente.');
      setIsSaved(true);
    } catch (error: any) {
      toast.error(error.message || 'Error al calcular o guardar el test.');
    } finally {
      setProcessing(false);
    }
  };
  
  const handleEdit = () => {
    setIsSaved(false);
    toast.info("El formulario ha sido habilitado para edición.");
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-1/2 bg-primary-dark rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors">
            <FaArrowLeft />
            <span>Volver</span>
          </button>
          <div className="text-right">
            <h2 className="text-xl font-bold">{patient.firstName} {patient.lastName}</h2>
            <p className="text-sm opacity-80">Edad: {patient.chronologicalAge} años</p>
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-4">Test de Edad Bioquímica</h3>
        <div className="space-y-3 pr-2 max-h-[60vh] overflow-y-auto">
          {BIOCHEMISTRY_ITEMS.map(item => (
            <div key={item.key} className="bg-white/10 rounded-lg p-3">
              <label className="block text-sm font-medium mb-1">{item.label}</label>
              {item.isDim ? (
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" step="any" placeholder="Fémur" value={(formValues[item.key] as any)?.field1 ?? ''} onChange={e => handleInputChange(item.key, e.target.value, 'field1')} className="input text-sm py-1" disabled={isSaved || processing} />
                  <input type="number" step="any" placeholder="Columna" value={(formValues[item.key] as any)?.field2 ?? ''} onChange={e => handleInputChange(item.key, e.target.value, 'field2')} className="input text-sm py-1" disabled={isSaved || processing} />
                </div>
              ) : (
                <input type="number" step="any" value={(formValues[item.key] as number) ?? ''} onChange={e => handleInputChange(item.key, e.target.value)} className="input w-full text-sm py-1" disabled={isSaved || processing} />
              )}
              {finalAge !== null && (
                <p className="text-xs mt-1 opacity-80">Edad calculada: {partialAges[`${item.key}Age` as keyof BiochemistryPartialAges] ?? '--'} años</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full md:w-1/2 space-y-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultados</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-600 mb-1">Edad Cronológica</p><p className="text-3xl font-bold text-gray-900">{patient.chronologicalAge}</p></div>
            <div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-600 mb-1">Edad Bioquímica</p><p className="text-3xl font-bold text-primary">{finalAge ?? '--'}</p></div>
            <div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-600 mb-1">Diferencial</p><p className="text-3xl font-bold text-gray-900">{differentialAge !== null ? `${differentialAge > 0 ? '+' : ''}${differentialAge}` : '--'}</p></div>
          </div>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Gráficos de Evolución</h3>
          <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500"><FaChartBar className="mx-auto text-4xl mb-2" /><p>Gráficos de resultados próximamente.</p></div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button type="button" onClick={handleCalculateAndSave} disabled={processing || isSaved} className="w-full bg-primary text-white font-medium py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"><FaSave /><span>{processing ? 'Procesando...' : 'Calcular y Guardar'}</span></button>
          <button type="button" onClick={handleEdit} disabled={!isSaved || processing} className="w-full bg-yellow-500 text-white font-medium py-3 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"><FaEdit /><span>Editar</span></button>
          <button type="button" onClick={onBack} disabled={processing} className="w-full bg-gray-600 text-white font-medium py-3 rounded-lg hover:bg-gray-500 transition-colors"><FaUndo /><span>Volver</span></button>
        </div>
      </div>
    </div>
  );
}
