'use client';

import { useState, useEffect } from 'react';
import { FaRobot, FaFileMedicalAlt } from 'react-icons/fa';
import { toast } from 'sonner';
import { generateClinicalSummary } from '@/lib/actions/ai.actions';
import { getPaginatedPatients } from '@/lib/actions/patients.actions';
import type { Patient } from '@/types';
import { useSession } from 'next-auth/react';
import ReactMarkdown from 'react-markdown';

// Componente mejorado para renderizar la respuesta de la IA con formato Markdown
const RenderAIResponse = ({ response }: { response: string }) => {
    return (
        <div className="prose prose-sm max-w-none text-gray-800">
            <ReactMarkdown>{response}</ReactMarkdown>
        </div>
    );
};

// --- PÁGINA PRINCIPAL DEL AGENTE IA ---
export default function AgenteIAPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    const loadPatients = async () => {
      if (!session?.user?.id) return;
      setLoadingPatients(true);
      try {
        const result = await getPaginatedPatients({ userId: session.user.id, page: 1, limit: 1000 });
        if (result.success && result.patients) {
          setPatients(result.patients as Patient[]);
        } else {
          toast.error(result.error || "No se pudieron cargar los pacientes.");
        }
      } catch (error) {
        toast.error("Error al cargar la lista de pacientes.");
      } finally {
        setLoadingPatients(false);
      }
    };
    loadPatients();
  }, [session]);

  const handleGenerate = async () => {
    if (!selectedPatientId) {
      toast.error("Por favor, seleccione un paciente.");
      return;
    }
    setLoading(true);
    setAiResponse(null);
    const toastId = toast.loading("El Agente IA está analizando los datos...");

    try {
      const result = await generateClinicalSummary(selectedPatientId);
      if (result.success && result.summary) {
        setAiResponse(result.summary);
        toast.success("Análisis de IA generado exitosamente.", { id: toastId });
      } else {
        toast.error(result.error || "El Agente IA no pudo generar el informe.", { id: toastId });
      }
    } catch (error) {
      console.error("Fallo en la llamada a la Server Action:", error);
      toast.error("Error de conexión. No se pudo comunicar con el servidor.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Agente de Análisis Clínico IA</h1>
        <p className="text-gray-600 mt-1">Seleccione un paciente para obtener un resumen y recomendaciones generadas por IA.</p>
      </div>

      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label htmlFor="patient-select" className="block text-sm font-medium text-gray-700 mb-1">
              Seleccionar Paciente
            </label>
            <select
              id="patient-select"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              disabled={loadingPatients || loading}
            >
              <option value="">{loadingPatients ? 'Cargando pacientes...' : '-- Seleccione un paciente --'}</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName} (ID: {p.identification})</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading || !selectedPatientId}
            className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-md flex items-center justify-center gap-2 hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <FaRobot />
            {loading ? 'Generando...' : 'Generar Análisis'}
          </button>
        </div>
      </div>

      <div className="min-h-[400px] bg-white p-6 rounded-lg border shadow-sm">
        {loading && (
          <div className="flex flex-col items-center justify-center text-center text-gray-500 py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="font-semibold">Analizando datos del paciente...</p>
            <p className="text-sm">El modelo de IA está procesando la información. Esto puede tardar unos segundos.</p>
          </div>
        )}
        {aiResponse && !loading && (
          <RenderAIResponse response={aiResponse} />
        )}
        {!aiResponse && !loading && (
          <div className="flex flex-col items-center justify-center text-center text-gray-400 py-12">
            <FaFileMedicalAlt className="text-5xl mb-4" />
            <p className="font-semibold">El resumen clínico del paciente aparecerá aquí.</p>
            <p className="text-sm mt-1">Seleccione un paciente y haga clic en "Generar Análisis" para comenzar.</p>
          </div>
        )}
      </div>
    </div>
  );
}