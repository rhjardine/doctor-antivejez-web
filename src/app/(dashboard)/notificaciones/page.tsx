'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaPaperPlane, FaUsers, FaEnvelope, FaSms, FaWhatsapp } from 'react-icons/fa';
import { toast } from 'sonner';
import { sendMassNotification } from '@/lib/actions/notifications.actions';

type TargetGroup = 'new' | 'legacy' | 'all';
type Channel = 'email' | 'sms' | 'whatsapp';

export default function NotificacionesPage() {
  const router = useRouter();
  const [targetGroup, setTargetGroup] = useState<TargetGroup>('all');
  const [channels, setChannels] = useState<Set<Channel>>(new Set(['email']));
  const [message, setMessage] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChannelToggle = (channel: Channel) => {
    setChannels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(channel)) {
        newSet.delete(channel);
      } else {
        newSet.add(channel);
      }
      return newSet;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (channels.size === 0) {
      toast.error('Debes seleccionar al menos un canal de envío.');
      return;
    }
    if (!message.trim()) {
      toast.error('El mensaje no puede estar vacío.');
      return;
    }

    setLoading(true);
    try {
      const result = await sendMassNotification({
        targetGroup,
        channels: Array.from(channels),
        message,
        mediaUrl,
      });

      if (result.success) {
        toast.success(result.message);
        setMessage('');
        setMediaUrl('');
      } else {
        toast.error(result.error || 'Ocurrió un error al enviar las notificaciones.');
      }
    } catch (error) {
      toast.error('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enviar Notificaciones Masivas</h1>
          <p className="text-gray-600 mt-1">Comunícate con tus pacientes de forma rápida y efectiva.</p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="btn-light-blue flex items-center space-x-2"
        >
          <FaArrowLeft />
          <span>Volver al Dashboard</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-8">
        {/* Sección 1: Público Objetivo */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><FaUsers className="text-primary"/>Público Objetivo</h3>
          <div className="flex flex-wrap gap-4">
            {(['all', 'new', 'legacy'] as TargetGroup[]).map(group => (
              <label key={group} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="targetGroup"
                  value={group}
                  checked={targetGroup === group}
                  onChange={() => setTargetGroup(group)}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <span className="text-gray-700">
                  {group === 'all' && 'Todos los Pacientes (Actuales y Legado)'}
                  {group === 'new' && 'Solo Pacientes del Sistema Actual'}
                  {group === 'legacy' && 'Solo Pacientes del Sistema Legado'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Sección 2: Canales de Envío */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Canales de Envío</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ChannelButton icon={<FaEnvelope/>} label="Email" channel="email" channels={channels} onToggle={handleChannelToggle} />
            <ChannelButton icon={<FaSms/>} label="SMS" channel="sms" channels={channels} onToggle={handleChannelToggle} />
            <ChannelButton icon={<FaWhatsapp/>} label="WhatsApp" channel="whatsapp" channels={channels} onToggle={handleChannelToggle} />
          </div>
        </div>

        {/* Sección 3: Contenido del Mensaje */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Contenido del Mensaje</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="message" className="label">Mensaje de Texto *</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="input"
                placeholder="Escribe tu mensaje aquí..."
                required
              />
            </div>
            <div>
              <label htmlFor="mediaUrl" className="label">URL de Multimedia (Opcional)</label>
              <input
                id="mediaUrl"
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="input"
                placeholder="https://ejemplo.com/imagen.jpg o video.mp4"
              />
              <p className="text-xs text-gray-500 mt-1">Asegúrate de que la URL sea pública y accesible.</p>
            </div>
          </div>
        </div>

        {/* Botón de Envío */}
        <div className="flex justify-end pt-6 border-t">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <FaPaperPlane />
            {loading ? 'Enviando...' : 'Enviar Notificaciones'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Componente auxiliar para los botones de canal
const ChannelButton = ({ icon, label, channel, channels, onToggle }: { icon: React.ReactNode; label: string; channel: Channel; channels: Set<Channel>; onToggle: (c: Channel) => void; }) => {
  const isActive = channels.has(channel);
  return (
    <button
      type="button"
      onClick={() => onToggle(channel)}
      className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center gap-2 transition-all duration-200 ${isActive ? 'border-primary bg-primary/10 text-primary' : 'border-gray-300 text-gray-600 hover:border-primary/50'}`}
    >
      <div className="text-2xl">{icon}</div>
      <span className="font-semibold">{label}</span>
    </button>
  );
};