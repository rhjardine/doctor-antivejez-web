'use client';

import { useState, useEffect } from 'react';
import { FaRobot, FaUserMd, FaFileMedicalAlt, FaLightbulb } from 'react-icons/fa';
import { toast } from 'sonner';
import { generateClinicalSummary } from '@/lib/actions/ai.actions';
import { getPaginatedPatients } from '@/lib/actions/patients.actions';
import type { Patient } from '@/types';
import { useSession } from 'next-auth/react';

// Componente para renderizar la respuesta de la IA de forma segura
const RenderAIResponse = ({ response }: { response: string }) => {
    // Divide la respuesta en párrafos para un mejor formato
    const paragraphs = response.split('\n').filter(p => p.trim() !== '');
    return (
        <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
            {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
            ))}
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

  // Carga la lista de pacientes al montar el componente
  useEffect(() => {
    const loadPatients = async () => {
      if (!session?.user?.id) return;
      try {
        // Asumimos que quieres ver todos los pacientes para la selección
        const result = await getPaginatedPatients({ userId: session.user.id, page: 1, limit: 1000 });
        if (result.success && result.patients) {
          setPatients(result.patients as Patient[]);
        } else {
          toast.error("No se pudieron cargar los pacientes.");
        }
      } catch (error) {
        toast.error("Error al cargar la lista de pacientes.");
      } finally {
        setLoadingPatients(false);
      }
    };
    loadPatients();
  }, [session]);

  // Maneja la generación del informe de IA
  const handleGenerate = async () => {
    if (!selectedPatientId) {
      toast.error("Por favor, seleccione un paciente.");
      return;
    }
    setLoading(true);
    setAiResponse(null);
    try {
      const result = await generateClinicalSummary(selectedPatientId);
      if (result.success && result.summary) {
        setAiResponse(result.summary);
        toast.success("Análisis de IA generado exitosamente.");
      } else {
        toast.error(result.error || "El Agente IA no pudo generar el informe.");
      }
    } catch (error) {
      toast.error("Error de conexión con el Agente IA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Agente de Análisis IA</h1>
        <p className="text-gray-600 mt-1">Seleccione un paciente para obtener un resumen clínico y recomendaciones generadas por IA.</p>
      </div>

      {/* Sección de selección y generación */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label htmlFor="patient-select" className="label">Seleccionar Paciente</label>
            <select
              id="patient-select"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="input"
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
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <FaRobot />
            {loading ? 'Generando...' : 'Generar Análisis'}
          </button>
        </div>
      </div>

      {/* Sección de resultados */}
      <div className="min-h-[400px]">
        {loading && (
          <div className="flex flex-col items-center justify-center text-center text-gray-500 py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>
            <p className="font-semibold">Analizando datos del paciente...</p>
            <p className="text-sm">El modelo de IA está procesando la información. Esto puede tardar unos segundos.</p>
          </div>
        )}
        {aiResponse && !loading && (
          <div className="bg-gray-50 p-6 rounded-lg border">
            <RenderAIResponse response={aiResponse} />
          </div>
        )}
        {!aiResponse && !loading && (
          <div className="flex flex-col items-center justify-center text-center text-gray-400 py-12">
            <FaFileMedicalAlt className="text-6xl mb-4" />
            <p className="font-semibold">El resumen clínico del paciente aparecerá aquí.</p>
          </div>
        )}
      </div>
    </div>
  );
}