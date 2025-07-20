'use client';

import { useState, useRef, useEffect } from 'react';
import { FaRobot, FaPaperPlane, FaUserMd, FaLightbulb, FaStethoscope, FaBookMedical, FaQuestionCircle, FaSearch } from 'react-icons/fa';
import { toast } from 'sonner';
import { getAiChatResponse } from '@/lib/actions/ai.actions';
import { getPaginatedPatients } from '@/lib/actions/patients.actions';
import type { Patient } from '@/types';

// --- TIPOS Y DATOS MOCK ---

type TabId = 'assistant' | 'insights' | 'recommendations' | 'explainable' | 'knowledge';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const mockKnowledgeBase = [
  {
    title: 'Berberine improves insulin sensitivity by inhibiting fat store and adjusting adipokines profile in human preadipocytes and metabolic syndrome patients',
    authors: 'Zhang Q, Xiao X, Feng K, et al.',
    source: 'Evidence-Based Complementary and Alternative Medicine, 2022.',
    summary: 'Randomized trial showing 24% improvement in insulin sensitivity for TCF7L2 variant carriers treated with berberine, compared to 8% in non-carriers. Mechanistic evidence of incretin response modulation.',
    tags: ['TCF7L2', 'Berberine', 'Insulin Sensitivity', 'RCT']
  },
  {
    title: 'Time-restricted eating effects on glycemic control in individuals with genetic susceptibility to type 2 diabetes: A randomized clinical trial',
    authors: 'Martínez-López N, Tapia G, García-Millan R, et al.',
    source: 'Cell Metabolism, 2021.',
    summary: 'RCT demonstrating significantly greater metabolic improvements with time-restricted eating in TCF7L2 risk allele carriers compared to non-carriers. 8-hour feeding window showed optimal results for TT genotype.',
    tags: ['Time-Restricted Eating', 'TCF7L2', 'Glycemic Control', 'RCT']
  }
];


// --- COMPONENTES DE CADA PESTAÑA ---

// 1. Asistente Conversacional (Chatbot)
const ConversationalAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const result = await getAiChatResponse(input, messages);
      if (result.success && result.response) {
        const modelMessage: Message = { role: 'model', text: result.response };
        setMessages(prev => [...prev, modelMessage]);
      } else {
        toast.error(result.error || 'El Agente IA no pudo responder.');
        setMessages(prev => prev.slice(0, prev.length - 1));
        setInput(userMessage.text);
      }
    } catch (error) {
      toast.error('Error de conexión con el Agente IA.');
      setMessages(prev => prev.slice(0, prev.length - 1));
      setInput(userMessage.text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 flex flex-col items-center justify-center h-full">
              <FaRobot className="text-5xl mb-4 text-gray-300" />
              <p className="font-semibold text-gray-700">¿Cómo puedo ayudarte hoy?</p>
              <p className="text-sm mt-2">Puedes preguntar sobre pacientes, estadísticas o tratamientos.</p>
               <p className="text-xs mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                Nota: La conexión a la base de datos de pacientes está en desarrollo. Las respuestas actuales son simuladas.
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && (
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <FaRobot className="text-white" />
                  </div>
                )}
                <div className={`max-w-lg p-4 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                 {msg.role === 'user' && (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <FaUserMd className="text-gray-600" />
                  </div>
                )}
              </div>
            ))
          )}
           {loading && (
            <div className="flex gap-4 justify-start">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <FaRobot className="text-white" />
              </div>
              <div className="max-w-lg p-4 rounded-2xl bg-gray-100 text-gray-800 rounded-bl-none">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 bg-white border-t border-gray-200">
          <form onSubmit={handleSubmit} className="flex items-center gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta aquí... (ej: ¿Qué pacientes tienen más de 60 años?)"
              className="input flex-1 !py-3"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary !py-3 !px-5 flex items-center justify-center"
            >
              <FaPaperPlane />
            </button>
          </form>
        </div>
    </div>
  );
};

// 2. AI Insights
const AiInsights = () => (
  <div className="p-6 text-center text-gray-500 flex flex-col items-center justify-center h-full bg-white">
    <FaLightbulb className="text-5xl mb-4 text-gray-300" />
    <h3 className="text-xl font-semibold text-gray-800">AI Insights</h3>
    <p className="mt-2">Esta sección mostrará proactivamente hallazgos y patrones interesantes en los datos de sus pacientes.</p>
    <p className="text-sm mt-4 p-2 bg-blue-50 border border-blue-200 rounded-lg">Funcionalidad en desarrollo.</p>
  </div>
);

// 3. Recomendaciones
const Recommendations = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState('');

    useEffect(() => {
        const loadPatients = async () => {
            const result = await getPaginatedPatients({ limit: 1000 });
            if(result.success && result.patients) {
                setPatients(result.patients as Patient[]);
            }
        }
        loadPatients();
    }, []);

    return (
        <div className="p-6 h-full bg-white">
            <div className="max-w-lg mx-auto mb-6">
                <label className="label">Seleccione un paciente para ver recomendaciones</label>
                <select 
                    value={selectedPatient} 
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="input"
                >
                    <option value="">-- Pacientes --</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
            </div>
            {selectedPatient ? (
                 <div className="text-center text-gray-500 flex flex-col items-center justify-center h-full">
                    <FaStethoscope className="text-5xl mb-4 text-gray-300" />
                    <h3 className="text-xl font-semibold text-gray-800">Recomendaciones para el Paciente</h3>
                    <p className="mt-2">Aquí se generarán sugerencias de tratamiento personalizadas basadas en el perfil del paciente.</p>
                    <p className="text-sm mt-4 p-2 bg-blue-50 border border-blue-200 rounded-lg">Funcionalidad en desarrollo.</p>
                </div>
            ) : (
                <div className="text-center text-gray-400 pt-16">
                    <p>Por favor, seleccione un paciente para continuar.</p>
                </div>
            )}
        </div>
    );
};

// 4. AI Explicable
const ExplainableAi = () => (
    <div className="p-6 text-center text-gray-500 flex flex-col items-center justify-center h-full bg-white">
        <FaQuestionCircle className="text-5xl mb-4 text-gray-300" />
        <h3 className="text-xl font-semibold text-gray-800">AI Explicable (XAI)</h3>
        <p className="mt-2">En esta sección, la IA explicará el "porqué" detrás de sus recomendaciones y hallazgos, aumentando la transparencia y confianza.</p>
        <p className="text-sm mt-4 p-2 bg-blue-50 border border-blue-200 rounded-lg">Funcionalidad en desarrollo.</p>
    </div>
);

// 5. Base de Conocimiento
const KnowledgeBase = () => (
    <div className="p-6 h-full overflow-y-auto bg-white">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Base de Conocimiento Científico</h3>
        <div className="space-y-6">
            {mockKnowledgeBase.map((item, index) => (
                <div key={index} className="pb-6 border-b last:border-b-0">
                    <h4 className="font-semibold text-primary mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-500 italic mb-2">{item.authors}</p>
                    <p className="text-sm text-gray-700 mb-3">{item.summary}</p>
                    <div className="flex flex-wrap gap-2">
                        {item.tags.map(tag => (
                            <span key={tag} className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
);


// --- PÁGINA PRINCIPAL DEL AGENTE IA ---
export default function AgenteIAPage() {
  const [activeTab, setActiveTab] = useState<TabId>('assistant');

  const tabs = [
    { id: 'assistant', label: 'Asistente Conversacional', icon: FaRobot },
    { id: 'insights', label: 'AI Insights', icon: FaLightbulb },
    { id: 'recommendations', label: 'Recomendaciones', icon: FaStethoscope },
    { id: 'explainable', label: 'AI Explicable', icon: FaQuestionCircle },
    { id: 'knowledge', label: 'Base de Conocimiento', icon: FaBookMedical },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'assistant': return <ConversationalAssistant />;
      case 'insights': return <AiInsights />;
      case 'recommendations': return <Recommendations />;
      case 'explainable': return <ExplainableAi />;
      case 'knowledge': return <KnowledgeBase />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] animate-fadeIn">
      {/* Header con título */}
      <div className="px-4 pt-2">
        <h1 className="text-2xl font-bold text-gray-900">AI Longevity Assistant</h1>
      </div>

      {/* Navegación por Pestañas con nuevo estilo */}
      <div className="px-4">
        <nav className="flex space-x-2 border-b border-gray-200" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`flex items-center gap-2 px-3 py-3 text-sm font-medium transition-colors focus:outline-none -mb-px ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
              }`}
            >
              <tab.icon />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenedor del contenido de la pestaña */}
       <div className="flex-1 mt-2 overflow-hidden">
        <div className="h-full rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {renderContent()}
        </div>
      </div>
    </div>
  );
}
