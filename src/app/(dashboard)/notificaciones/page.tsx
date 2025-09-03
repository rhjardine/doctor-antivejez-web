'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaPaperPlane, FaUsers, FaEnvelope, FaSms, FaWhatsapp } from 'react-icons/fa';
import { toast } from 'sonner';
import { sendMassNotification } from '@/lib/actions/notifications.actions';

// Asumiendo que este tipo está definido en algún lugar como src/types/notifications.ts
type TargetGroup = 'new' | 'legacy' | 'all';
type Channel = 'email' | 'sms' | 'whatsapp';

export default function NotificacionesPage() {
  const router = useRouter();
  const [targetGroup, setTargetGroup] = useState<TargetGroup>('all');
  // ===== SOLUCIÓN: Se especifica el tipo genérico en la creación del Set =====
  const [channels, setChannels] = useState<Set<Channel>>(new Set<Channel>(['email']));
  // ========================================================================
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
    if (!message.trim()) {
      toast.error('El mensaje no puede estar vacío.');
      return;
    }
    if (channels.size === 0) {
      toast.error('Debe seleccionar al menos un canal de envío.');
      return;
    }

    setLoading(true);
    try {
      const result = await sendMassNotification(message, targetGroup, Array.from(channels));
      if (result.success) {
        toast.success(result.message || 'Notificación enviada con éxito.');
        setMessage('');
        setMediaUrl('');
        setChannels(new Set(['email']));
        setTargetGroup('all');
      } else {
        toast.error(result.error || 'No se pudo enviar la notificación.');
      }
    } catch (error) {
      toast.error('Ocurrió un error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notificaciones Masivas</h1>
        <p className="text-gray-600 mt-1">Envía mensajes a grupos de pacientes a través de diferentes canales.</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="label">Grupo de Pacientes</label>
          <div className="flex items-center gap-4 mt-2">
            {/* Lógica para seleccionar el grupo */}
          </div>
        </div>

        <div>
          <label className="label">Canales de Envío</label>
          <div className="flex items-center gap-4 mt-2">
            {/* Lógica para seleccionar canales */}
          </div>
        </div>

        <div>
          <label htmlFor="message" className="label">Mensaje</label>
          <textarea
            id="message"
            rows={6}
            className="input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe tu mensaje aquí..."
            required
          />
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            <FaPaperPlane />
            {loading ? 'Enviando...' : 'Enviar Notificación'}
          </button>
        </div>
      </form>
    </div>
  );
}