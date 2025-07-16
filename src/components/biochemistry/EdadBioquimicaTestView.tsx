'use client';

import { useState } from 'react';
import { PatientWithDetails } from '@/types';
import { toast } from 'sonner';
import { FaArrowLeft, FaSave, FaEdit, FaUndo, FaChartBar, FaHistory } from 'react-icons/fa';
import { calculateBioquimicaResults } from '@/utils/bioquimica-calculations';
import { saveBiochemistryTest } from '@/lib/actions/biochemistry.actions';
import { BiochemistryFormValues, BiochemistryPartialAges } from '@/types/biochemistry';
import BiochemistryHistoryView from './BiochemistryHistoryView';

// ===== INICIO DE LA MODIFICACIÓN: Añadir la prop onTestComplete =====
interface EdadBioquimicaTestViewProps {
  patient: PatientWithDetails;
  onBack: () => void;
  onTestComplete: () => void; // Para recargar los datos del paciente
}
// ===== FIN DE LA MODIFICACIÓN =====

const BIOCHEMISTRY_ITEMS: { key: keyof BiochemistryFormValues; label: string; isDim: boolean }[] = [
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

export default function EdadBioquimicaTestView({ patient, onBack, onTestComplete }: EdadBioquimicaTestViewProps) {
  const [view, setView] = useState<'form' | 'history'>('form');
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
    const isEmpty = Object.values(formValues).every(
      value => value === undefined || (typeof value === 'object' && value !== null && Object.values(value).every(subValue => subValue === undefined))
    );
    if (isEmpty) {
      toast.error("Por favor, ingrese al menos un valor para calcular.");
      return;
    }
    setProcessing(true);
    try {
      const result = calculateBioquimicaResults(formValues, patient.chronologicalAge);
      setPartialAges(result.partialAges);
      setFinalAge(result.biochemicalAge);
      setDifferentialAge(result.differentialAge);

      const { boneDensitometry, ...restOfFormValues } = formValues;
      let boneDensitometryAvg: number | undefined = undefined;
      if (boneDensitometry && typeof boneDensitometry.field1 === 'number' && typeof boneDensitometry.field2 === 'number') {
          boneDensitometryAvg = (boneDensitometry.field1 + boneDensitometry.field2) / 2;
      }

      await saveBiochemistryTest({
        patientId: patient.id,
        chronologicalAge: patient.chronologicalAge,
        biochemicalAge: result.biochemicalAge,
        differentialAge: result.differentialAge,
        ...restOfFormValues,
        boneDensitometry: boneDensitometryAvg,
      });

      toast.success('Test Bioquímico guardado exitosamente.');
      setIsSaved(true);
      onTestComplete(); // Notifica al padre para recargar los datos
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

  if (view === 'history') {
    return <BiochemistryHistoryView patient={patient} onBack={() => setView('form')} onHistoryChange={onTestComplete} />;
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <button onClick={onBack} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-lg">
                <FaArrowLeft />
                <span>Volver</span>
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Nuevo Test Bioquímico</h2>
            <button 
                onClick={() => setView('history')}
                className="btn-secondary flex items-center gap-2"
                disabled={patient.biochemistryTests.length === 0}
            >
                <FaHistory />
                <span>Ver Historial</span>
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna de Formulario */}
            <div className="card space-y-4">
                <h3 className="text-lg font-semibold">Parámetros del Test</h3>
                {BIOCHEMISTRY_ITEMS.map(item => (
                    <div key={item.key}>
                        <label className="label">{item.label}</label>
                        {item.key === 'boneDensitometry' ? (
                            <div className="grid grid-cols-2 gap-2">
                                <input type="number" step="any" placeholder="Fémur" value={formValues.boneDensitometry?.field1 ?? ''} onChange={e => handleInputChange('boneDensitometry', e.target.value, 'field1')} className="input" disabled={isSaved || processing} />
                                <input type="number" step="any" placeholder="Columna" value={formValues.boneDensitometry?.field2 ?? ''} onChange={e => handleInputChange('boneDensitometry', e.target.value, 'field2')} className="input" disabled={isSaved || processing} />
                            </div>
                        ) : (
                            <input type="number" step="any" value={(formValues[item.key] as number) ?? ''} onChange={e => handleInputChange(item.key, e.target.value)} className="input" disabled={isSaved || processing} />
                        )}
                    </div>
                ))}
            </div>

            {/* Columna de Resultados y Acciones */}
            <div className="space-y-6">
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultados</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-600 mb-1">Edad Cronológica</p><p className="text-3xl font-bold text-gray-900">{patient.chronologicalAge}</p></div>
                        <div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-600 mb-1">Edad Bioquímica</p><p className="text-3xl font-bold text-primary">{finalAge !== null ? Math.round(finalAge) : '--'}</p></div>
                        <div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-600 mb-1">Diferencial</p><p className="text-3xl font-bold text-gray-900">{differentialAge !== null ? `${differentialAge > 0 ? '+' : ''}${Math.round(differentialAge)}` : '--'}</p></div>
                    </div>
                </div>
                <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button onClick={handleCalculateAndSave} disabled={processing || isSaved} className="btn-primary flex items-center justify-center gap-2 py-3"><FaSave /><span>{processing ? 'Procesando...' : 'Calcular y Guardar'}</span></button>
                        <button onClick={handleEdit} disabled={!isSaved || processing} className="btn-secondary flex items-center justify-center gap-2 py-3"><FaEdit /><span>Editar</span></button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
