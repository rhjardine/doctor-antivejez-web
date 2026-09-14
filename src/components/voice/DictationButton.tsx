'use client';

// Captura de dictado.
//
// El microfono se abre solo cuando el medico pulsa, y se cierra en cuanto para:
// no hay escucha continua en ningun momento. Mientras graba, el boton lo dice
// con texto y con color, para que nunca haya duda de si esta abierto.
//
// Divergencia consciente respecto al plan: se implementa como pulsar-para-iniciar
// y pulsar-para-detener, no como mantener pulsado. Mantener el dedo treinta
// segundos mientras se habla con un paciente es incomodo y se suelta sin querer.
// La propiedad que importaba —que nunca escuche sin una accion explicita, y que
// se vea que esta grabando— se conserva entera.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaMicrophone, FaStop } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { transcribirDictado } from '@/lib/actions/voice.actions';

interface DictationButtonProps {
  patientId: string;
  /** Se llama con el texto transcrito. El componente padre decide que hacer con el. */
  onTranscripcion: (texto: string) => void;
  disabled?: boolean;
}

type Estado = 'inactivo' | 'grabando' | 'transcribiendo';

/** Formatos por orden de preferencia; el primero que el navegador admita. */
const FORMATOS = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];

function elegirFormato(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return FORMATOS.find((f) => MediaRecorder.isTypeSupported(f));
}

export default function DictationButton({
  patientId,
  onTranscripcion,
  disabled = false,
}: DictationButtonProps) {
  const [estado, setEstado] = useState<Estado>('inactivo');
  const grabadoraRef = useRef<MediaRecorder | null>(null);
  const fragmentosRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const cerrarMicrofono = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // El microfono se libera tambien si el medico navega a otra pantalla a media
  // grabacion: dejar la pista abierta mantendria el indicador del navegador
  // encendido sin que nada este grabando.
  useEffect(() => cerrarMicrofono, [cerrarMicrofono]);

  const enviar = useCallback(
    async (audio: Blob, tipoMime: string) => {
      setEstado('transcribiendo');
      try {
        const formData = new FormData();
        formData.append('audio', audio, 'dictado.webm');
        const respuesta = await transcribirDictado(patientId, formData);

        if (!respuesta.ok || !respuesta.texto) {
          toast.error(respuesta.error ?? 'No se pudo transcribir el dictado.');
          return;
        }
        onTranscripcion(respuesta.texto);
      } catch (error) {
        console.error('[dictado] error al enviar:', error);
        toast.error('No se pudo enviar el dictado.');
      } finally {
        setEstado('inactivo');
      }
    },
    [patientId, onTranscripcion]
  );

  const iniciar = useCallback(async () => {
    const formato = elegirFormato();
    if (!formato) {
      toast.error('Este navegador no admite grabación de audio.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const grabadora = new MediaRecorder(stream, { mimeType: formato });
      fragmentosRef.current = [];

      grabadora.ondataavailable = (evento) => {
        if (evento.data.size > 0) fragmentosRef.current.push(evento.data);
      };
      grabadora.onstop = () => {
        cerrarMicrofono();
        const audio = new Blob(fragmentosRef.current, { type: formato });
        fragmentosRef.current = [];
        if (audio.size === 0) {
          setEstado('inactivo');
          toast.error('No se grabó audio.');
          return;
        }
        void enviar(audio, formato);
      };

      grabadora.start();
      grabadoraRef.current = grabadora;
      setEstado('grabando');
    } catch (error) {
      console.error('[dictado] microfono no disponible:', error);
      cerrarMicrofono();
      toast.error('No se pudo acceder al micrófono. Verifique los permisos del navegador.');
    }
  }, [cerrarMicrofono, enviar]);

  const detener = useCallback(() => {
    grabadoraRef.current?.stop();
    grabadoraRef.current = null;
  }, []);

  if (estado === 'transcribiendo') {
    return (
      <button type="button" disabled className="btn-secondary flex items-center gap-2" aria-live="polite">
        <Loader2 className="animate-spin" size={16} /> Transcribiendo…
      </button>
    );
  }

  if (estado === 'grabando') {
    return (
      <button
        type="button"
        onClick={detener}
        className="btn-secondary flex items-center gap-2 !bg-red-600 !text-white !border-red-600"
        aria-live="polite"
      >
        <FaStop /> Detener y transcribir
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={iniciar}
      disabled={disabled}
      className="btn-secondary flex items-center gap-2"
      title="Dictar la observación por voz"
    >
      <FaMicrophone /> Dictar
    </button>
  );
}
