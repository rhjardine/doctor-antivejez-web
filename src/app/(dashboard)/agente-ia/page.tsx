'use client';

import { useState, useRef, useEffect } from 'react';
import { FaRobot, FaPaperPlane, FaUserMd } from 'react-icons/fa';
import { toast } from 'sonner';
import { getAiChatResponse } from '@/lib/actions/ai.actions';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function AgenteIAPage() {
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
         // Si hay error, removemos el mensaje del usuario para que pueda intentarlo de nuevo
        setMessages(prev => prev.slice(0, prev.length - 1));
        setInput(userMessage.text); // Restauramos el input
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
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Asistente IA</h1>
        <p className="text-gray-600 mt-1">Tu copiloto para el análisis de datos clínicos.</p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col">
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 flex flex-col items-center justify-center h-full">
              <FaRobot className="text-5xl mb-4 text-gray-300" />
              <p className="font-semibold">¿Cómo puedo ayudarte hoy?</p>
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
                  <p>{msg.text}</p>
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

        {/* Input Area */}
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
    </div>
  );
}
