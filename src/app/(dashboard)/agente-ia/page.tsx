'use client';

import { useState, useEffect } from 'react';
import { FaRobot, FaUserMd, FaFileMedicalAlt, FaLightbulb } from 'react-icons/fa';
import { toast } from 'sonner';
import { getAIResponse } from '@/lib/actions/ai.actions';
import { getPaginatedPatients } from '@/lib/actions/patients.actions';
import type { Patient } from '@/types';
import { useSession } from 'next-auth/react';

// Componente para renderizar la respuesta de la IA de forma segura
const RenderAIResponse = ({ response }: { response: string }) => {
    // Divide la respuesta en secciones basadas en los encabezados Markdown '###'
    const sections = response.split('### ').filter(s => s.trim() !== '');
    return (
        <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
            {sections.map((section, index) => {
                const lines = section.split('\n').filter(line => line.trim() !== '');
                const title = lines.shift() || '';
                // Limpia los guiones o asteriscos de los puntos de la lista
                const content = lines.map(line => line.replace(/^\s*-\s*/, '').replace(/^\s*\*\s*/, '')).filter(Boolean);
                
                return (
                    <div key={index} className="p-4 bg-white rounded-lg border">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                           {title.includes('Resumen') && <FaFileMedicalAlt className="text-primary" />}
                           {title.includes('Atención') && <FaLightbulb className="text-yellow-500" />}
                           {title.includes('Recomendaciones') && <FaUserMd className="text-green-500" />}
                           {title.trim()}
                        </h3>
                        {content.length > 1 ? (
                            <ul className="space-y-2 list-disc list-inside">
                                {content.map((line, lineIndex) => (
                                    <li key={lineIndex}>{line}</li>
                                ))}
                            </ul>
                        ) : (
                            <p>{content[0]}</p>
                        )}
                    </div>
                );
            })}
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
        const result = await getPaginatedPatients({ userId: session.user.id, limit: 1000 });
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
      const result = await getAIResponse(selectedPatientId);
      if (result.success && result.data) {
        setAiResponse(result.data);
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
        <p className="text-gray-600 mt-1">Seleccione un paciente para obtener un resumen y recomendaciones generadas por IA.</p>
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
              <option value="">{loadingPatients ? 'Cargando pacientes...' : '-- Seleccione --'}</option>
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
            <p className="text-sm">Esto puede tardar unos segundos.</p>
          </div>
        )}
        {aiResponse && !loading && (
          <div className="bg-gray-50 p-6 rounded-lg">
            <RenderAIResponse response={aiResponse} />
          </div>
        )}
        {!aiResponse && !loading && (
          <div className="flex flex-col items-center justify-center text-center text-gray-400 py-12">
            <FaFileMedicalAlt className="text-6xl mb-4" />
            <p className="font-semibold">El informe del paciente aparecerá aquí.</p>
          </div>
        )}
      </div>
    </div>
  );
}
