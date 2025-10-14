'use client';

import React, { useState, useEffect } from 'react';
import { getPatientGuideHistory } from '@/lib/actions/guide.actions';
import { toast } from 'sonner';
// ===== INICIO DE LA CORRECCIÓN =====
import { FaHistory, FaEye } from 'react-icons/fa';
import { Loader2 } from 'lucide-react'; // Se importa Loader2 desde lucide-react
// ===== FIN DE LA CORRECCIÓN =====
import { Button } from '@/components/ui/button';
import type { PatientGuide } from '@prisma/client';

type GuideHistoryItem = Pick<PatientGuide, 'id' | 'createdAt' | 'observations'>;

interface GuideHistoryViewProps {
  patientId: string;
  onViewGuide: (guideId: string) => void;
  onBack: () => void;
}

export default function GuideHistoryView({ patientId, onViewGuide, onBack }: GuideHistoryViewProps) {
  const [history, setHistory] = useState<GuideHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      const result = await getPatientGuideHistory(patientId);
      if (result.success && result.data) {
        setHistory(result.data as GuideHistoryItem[]);
      } else {
        toast.error(result.error || 'No se pudo cargar el historial.');
      }
      setLoading(false);
    };
    loadHistory();
  }, [patientId]);

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
          <FaHistory className="text-primary" /> Historial de Guías de Tratamiento
        </h2>
        <Button variant="outline" onClick={onBack}>Volver al Formulario</Button>
      </div>
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="mt-2 text-gray-500">Cargando historial...</p>
        </div>
      ) : history.length > 0 ? (
        <ul className="space-y-4">
          {history.map(guide => (
            <li key={guide.id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between sm:items-center hover:bg-slate-50 transition-colors">
              <div className="mb-3 sm:mb-0">
                <p className="font-semibold text-gray-800">
                  Guía del {new Date(guide.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-sm text-gray-500 truncate max-w-md">
                  {guide.observations || 'Sin observaciones adicionales.'}
                </p>
              </div>
              <Button size="sm" onClick={() => onViewGuide(guide.id)} className="w-full sm:w-auto">
                <FaEye className="mr-2 h-4 w-4" /> Ver Guía
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay guías guardadas para este paciente.</p>
          <p className="text-sm text-gray-400 mt-1">Cree y guarde una nueva guía para verla aquí.</p>
        </div>
      )}
    </div>
  );
}