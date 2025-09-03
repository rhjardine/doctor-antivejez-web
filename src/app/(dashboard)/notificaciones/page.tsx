'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaPaperPlane } from 'react-icons/fa';
import { toast } from 'sonner';
import { sendMassNotification } from '@/lib/actions/notifications.actions';

type TargetGroup = 'new' | 'legacy' | 'all';
type Channel = 'email' | 'sms' | 'whatsapp';

export default function NotificacionesPage() {
  const router = useRouter();
  const [targetGroup, setTargetGroup] = useState<TargetGroup>('all');
  const [channels, setChannels] = useState<Set<Channel>>(new Set<Channel>(['email']));
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
      
      // ===== SOLUCIÓN: TypeScript ahora entiende las dos ramas posibles =====
      if (result.success) {
        toast.success(result.message);
        setMessage('');
        setMediaUrl('');
        setChannels(new Set<Channel>(['email']));
        setTargetGroup('all');
      } else {
        // En esta rama, TypeScript sabe que 'result' tiene la propiedad 'error'
        toast.error(result.error);
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
        {/* ... (resto del JSX del formulario sin cambios) ... */}
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