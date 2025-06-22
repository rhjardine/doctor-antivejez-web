'use client';

import { useState, useEffect } from 'react';
import { Patient } from '@/types';
import { BoardWithRanges, FormValues, BIOPHYSICS_ITEMS } from '@/types/biophysics';
import { getBiophysicsBoardsAndRanges, saveBiophysicsTest } from '@/lib/actions/biophysics.actions';
import { calculateBiofisicaResults, getAgeStatus, getStatusColor } from '@/utils/biofisica-calculations';
import { toast } from 'sonner';
import { FaArrowLeft, FaCalculator, FaSave } from 'react-icons/fa';

interface EdadBiofisicaTestViewProps {
  patient: Patient;
  onBack: () => void;
  onTestComplete: () => void;
}

export default function EdadBiofisicaTestView({ patient, onBack, onTestComplete }: EdadBiofisicaTestViewProps) {
  const [boards, setBoards] = useState<BoardWithRanges[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [calculated, setCalculated] = useState(false);

  const [formValues, setFormValues] = useState<FormValues>({
    fatPercentage: undefined,
    bmi: undefined,
    digitalReflexes: { high: 0, long: 0, width: 0 },
    visualAccommodation: undefined,
    staticBalance: { high: 0, long: 0, width: 0 },
    skinHydration: undefined,
    systolicPressure: undefined,
    diastolicPressure: undefined,
  });

  const [results, setResults] = useState({
    biologicalAge: 0,
    differentialAge: 0,
    partialAges: {},
  });

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      const boardsData = await getBiophysicsBoardsAndRanges();
      setBoards(boardsData);
    } catch (error) {
      toast.error('Error al cargar los baremos');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: number | undefined, dimension?: 'high' | 'long' | 'width') => {
    setFormValues(prev => {
      if (dimension && (key === 'digitalReflexes' || key === 'staticBalance')) {
        return {
          ...prev,
          [key]: {
            ...prev[key],
            [dimension]: value || 0,
          },
        };
      }
      return {
        ...prev,
        [key]: value,
      };
    });
    setCalculated(false); // Reset calculated state when values change
  };

  const handleCalculate = () => {
    setCalculating(true);

    try {
      const isAthlete = patient.gender.includes('DEPORTIVO');
      const calculationResult = calculateBiofisicaResults(
        boards,
        formValues,
        patient.chronologicalAge,
        patient.gender,
        isAthlete
      );

      setResults(calculationResult);
      setCalculated(true);
      toast.success('Cálculo completado');
    } catch (error) {
      toast.error('Error al calcular los resultados');
    } finally {
      setCalculating(false);
    }
  };

  const handleSave = async () => {
    if (!calculated) {
      toast.error('Debe calcular los resultados antes de guardar');
      return;
    }

    setSaving(true);

    try {
      // Preparar los datos para guardar
      const testData = {
        patientId: patient.id,
        chronologicalAge: patient.chronologicalAge,
        biologicalAge: results.biologicalAge,
        differentialAge: results.differentialAge,
        gender: patient.gender,
        isAthlete: patient.gender.includes('DEPORTIVO'),
        fatPercentage: formValues.fatPercentage,
        fatAge: results.partialAges.fatAge,
        bmi: formValues.bmi,
        bmiAge: results.partialAges.bmiAge,
        digitalReflexes: formValues.digitalReflexes 
          ? (formValues.digitalReflexes.high + formValues.digitalReflexes.long + formValues.digitalReflexes.width) / 3 
          : undefined,
        reflexesAge: results.partialAges.reflexesAge,
        visualAccommodation: formValues.visualAccommodation,
        visualAge: results.partialAges.visualAge,
        staticBalance: formValues.staticBalance 
          ? (formValues.staticBalance.high + formValues.staticBalance.long + formValues.staticBalance.width) / 3 
          : undefined,
        balanceAge: results.partialAges.balanceAge,
        skinHydration: formValues.skinHydration,
        hydrationAge: results.partialAges.hydrationAge,
        systolicPressure: formValues.systolicPressure,
        systolicAge: results.partialAges.systolicAge,
        diastolicPressure: formValues.diastolicPressure,
        diastolicAge: results.partialAges.diastolicAge,
      };

      const result = await saveBiophysicsTest(testData);

      if (result.success) {
        toast.success('Test guardado exitosamente');
        onTestComplete();
      } else {
        toast.error(result.error || 'Error al guardar el test');
      }
    } catch (error) {
      toast.error('Error al guardar el test');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="loader"></div>
      </div>
    );
  }

  const getItemStatus = (partialAge: number | undefined) => {
    if (!partialAge) return 'NORMAL';
    const diff = partialAge - patient.chronologicalAge;
    return getAgeStatus(diff);
  };

  return (
    <div className="flex gap-6">
      {/* Panel Izquierdo - Formulario */}
      <div className="w-1/2 bg-primary-dark rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
          >
            <FaArrowLeft />
            <span>Volver</span>
          </button>
          <div className="text-right">
            <h2 className="text-xl font-bold">{patient.firstName} {patient.lastName}</h2>
            <p className="text-sm opacity-80">
              Edad: {patient.chronologicalAge} años | {patient.gender.replace('_', ' ')}
            </p>
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-4">Test de Edad Biofísica</h3>

        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {BIOPHYSICS_ITEMS.map((item) => (
            <div key={item.key} className="bg-white/10 rounded-lg p-4">
              <label className="block text-sm font-medium mb-2">
                {item.label} {item.unit && `(${item.unit})`}
              </label>

              {item.hasDimensions ? (
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    placeholder="Alto"
                    value={formValues[item.key]?.high || ''}
                    onChange={(e) => handleInputChange(item.key, parseFloat(e.target.value), 'high')}
                    className="px-2 py-1 bg-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                  <input
                    type="number"
                    placeholder="Largo"
                    value={formValues[item.key]?.long || ''}
                    onChange={(e) => handleInputChange(item.key, parseFloat(e.target.value), 'long')}
                    className="px-2 py-1 bg-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                  <input
                    type="number"
                    placeholder="Ancho"
                    value={formValues[item.key]?.width || ''}
                    onChange={(e) => handleInputChange(item.key, parseFloat(e.target.value), 'width')}
                    className="px-2 py-1 bg-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>
              ) : (
                <input
                  type="number"
                  value={formValues[item.key] || ''}
                  onChange={(e) => handleInputChange(item.key, parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              )}

              {calculated && (
                <div className="mt-2 text-sm">
                  <span className="opacity-70">Edad Calculada: </span>
                  <span className="font-medium">
                    {results.partialAges[`${item.key.replace(/([A-Z])/g, (match) => match.toLowerCase())}Age`]?.toFixed(1) || '--'} años
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            onClick={handleCalculate}
            disabled={calculating}
            className="flex-1 bg-white text-primary-dark font-medium py-3 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <FaCalculator />
            <span>{calculating ? 'Calculando...' : 'Calcular'}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={!calculated || saving}
            className="flex-1 bg-green-500 text-white font-medium py-3 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <FaSave />
            <span>{saving ? 'Guardando...' : 'Guardar'}</span>
          </button>
        </div>
      </div>

      {/* Panel Derecho - Resultados */}
      <div className="w-1/2 space-y-6">
        {/* Resultados Finales */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultados Finales</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Edad Biofísica</p>
              <p className="text-3xl font-bold text-gray-900">
                {calculated ? `${results.biologicalAge} años` : '--'}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Edad Diferencial</p>
              <p className={`text-3xl font-bold ${
                calculated 
                  ? results.differentialAge <= -7 ? 'text-status-green' 
                  : results.differentialAge >= 7 ? 'text-status-red' 
                  : 'text-status-yellow'
                  : 'text-gray-900'
              }`}>
                {calculated 
                  ? `${results.differentialAge > 0 ? '+' : ''}${results.differentialAge} años` 
                  : '--'}
              </p>
            </div>
          </div>
        </div>

        {/* Gráficos por Items */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Gráficos por Items</h3>

          <div className="grid grid-cols-2 gap-4">
            {BIOPHYSICS_ITEMS.map((item) => {
              const ageKey = `${item.key.replace(/([A-Z])/g, (match) => match.toLowerCase())}Age`;
              const partialAge = results.partialAges[ageKey];
              const status = getItemStatus(partialAge);
              const statusColor = status === 'REJUVENECIDO' ? 'bg-status-green' : 
                               status === 'NORMAL' ? 'bg-status-yellow' : 
                               'bg-status-red';

              return (
                <div 
                  key={item.key} 
                  className={`rounded-lg p-4 text-white transition-all ${
                    calculated ? statusColor : 'bg-gray-300'
                  }`}
                >
                  <h4 className="font-medium mb-2">{item.label}</h4>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="opacity-80">Edad Calculada:</span>
                      <span className="font-medium">
                        {calculated && partialAge ? `${partialAge.toFixed(1)} años` : '--'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="opacity-80">Diferencia:</span>
                      <span className="font-medium">
                        {calculated && partialAge 
                          ? `${partialAge - patient.chronologicalAge > 0 ? '+' : ''}${(partialAge - patient.chronologicalAge).toFixed(1)} años`
                          : '--'}
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/20">
                      <span className="text-xs uppercase tracking-wide">
                        {calculated ? status.replace('_', ' ') : 'SIN CALCULAR'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
