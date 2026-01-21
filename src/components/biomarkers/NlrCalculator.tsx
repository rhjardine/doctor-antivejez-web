'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { FaHistory, FaCalculator } from 'react-icons/fa';
import { saveNlrTest, getNlrHistory } from '@/lib/actions/nlr.actions';
import NlrScale from './NlrScale';
import type { Patient } from '@/types';
import type { NlrTest } from '@prisma/client';

const nlrSchema = z.object({
  neutrophils: z.coerce.number().positive('Debe ser un número positivo'),
  lymphocytes: z.coerce.number().positive('Debe ser un número positivo'),
  testDate: z.string().min(1, 'La fecha es requerida'),
});

type NlrFormData = z.infer<typeof nlrSchema>;

interface NlrCalculatorProps {
  patient: Patient;
}

export default function NlrCalculator({ patient }: NlrCalculatorProps) {
  const [lastResult, setLastResult] = useState<NlrTest | null>(null);
  const [history, setHistory] = useState<NlrTest[]>([]);
  const [view, setView] = useState<'calculator' | 'history'>('calculator');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<NlrFormData>({
    resolver: zodResolver(nlrSchema),
    defaultValues: { testDate: new Date().toISOString().split('T')[0] },
  });

  const onSubmit: SubmitHandler<NlrFormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const result = await saveNlrTest({
        ...data,
        patientId: patient.id,
        testDate: new Date(data.testDate),
      });

      if (result.success && result.data) {
        toast.success('Resultado guardado exitosamente.');
        setLastResult(result.data);
      } else {
        toast.error(result.error || 'No se pudo guardar el resultado.');
      }
    } catch (error) {
      toast.error('Ocurrió un error de conexión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showHistory = async () => {
    const result = await getNlrHistory(patient.id);
    if (result.success && result.data && result.data.length > 0) {
      setHistory(result.data);
      setView('history');
    } else {
      toast.info('El paciente no tiene historial de NLR registrado.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {view === 'calculator' ? (
        <>
          <div className="card">
            <h2 className="form-section-header"><FaCalculator /> Calculador de Relación Neutrófilo-Linfocito (NLR)</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="neutrophils" className="text-yellow-600 font-semibold cursor-pointer">Recuento absoluto o porcentual de neutrófilos</label>
                    <div className="flex items-center mt-1">
                      <input id="neutrophils" type="number" step="0.01" {...register('neutrophils')} className="input text-lg text-center flex-grow" />
                      <span className="bg-gray-100 border border-l-0 border-gray-300 rounded-r-md px-3 py-2 text-gray-500">células/μL o %</span>
                    </div>
                    {errors.neutrophils && <p className="error-message">{errors.neutrophils.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="lymphocytes" className="text-yellow-600 font-semibold cursor-pointer">Recuento absoluto o porcentual de linfocitos</label>
                    <div className="flex items-center mt-1">
                      <input id="lymphocytes" type="number" step="0.01" {...register('lymphocytes')} className="input text-lg text-center flex-grow" />
                      <span className="bg-gray-100 border border-l-0 border-gray-300 rounded-r-md px-3 py-2 text-gray-500">células/μL o %</span>
                    </div>
                    {errors.lymphocytes && <p className="error-message">{errors.lymphocytes.message}</p>}
                  </div>
                </div>
                <div className="flex flex-col justify-between h-full">
                  <div>
                    <label htmlFor="testDate" className="label">Fecha del Test</label>
                    <input id="testDate" type="date" {...register('testDate')} className="input" />
                  </div>
                  <div className="flex gap-4 mt-4">
                    <button type="submit" disabled={isSubmitting} className="btn-primary w-full"><FaCalculator /><span>{isSubmitting ? 'Calculando...' : 'Calcular y Guardar'}</span></button>
                    <button type="button" onClick={showHistory} className="btn-secondary w-full"><FaHistory /><span>Historial</span></button>
                  </div>
                </div>
              </div>
            </form>
          </div>
          {lastResult && <div className="mt-8"><NlrScale nlrValue={lastResult.nlrValue} riskLevel={lastResult.riskLevel} /></div>}
        </>
      ) : (
        <div className="card animate-fadeIn">
          <div className="flex justify-between items-center mb-4">
            <h3 className="form-section-header"><FaHistory /> Historial de NLR</h3>
            <button onClick={() => setView('calculator')} className="btn-secondary">Volver al Calculador</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Fecha</th><th className="table-header">NLR</th><th className="table-header">Riesgo</th><th className="table-header">Neutrófilos</th><th className="table-header">Linfocitos</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map(test => (
                  <tr key={test.id} className="table-row">
                    <td className="table-cell">{new Date(test.testDate).toLocaleDateString('es-VE')}</td><td className="table-cell font-bold">{test.nlrValue.toFixed(2)}</td><td className="table-cell">{test.riskLevel.replace(/_/g, ' ')}</td><td className="table-cell">{test.neutrophils}</td><td className="table-cell">{test.lymphocytes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}