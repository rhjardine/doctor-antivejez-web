'use server';

// Transcripcion de dictado clinico.
//
// Esta accion NO ESCRIBE NADA. Recibe audio, devuelve texto, y ahi termina.
// Lo que se haga con ese texto lo decide el medico en la propuesta: si lo
// descarta, no queda rastro en ninguna parte, que es exactamente la intencion.
//
// Tampoco registra en AIAnalysis pese a que el modelo existe: guardar el
// dictado antes de que el medico confirme meteria en la historia palabras que
// el podria estar descartando. La trazabilidad persistente (quien acepto,
// cuando, con que modelo) llega con AuditLog en A3.

import { validatePatientAccess } from '@/lib/auth-guards';
import { dictadoHabilitadoEnServidor } from '@/lib/voice/dictation-flag';
import { seleccionarProveedor } from '@/lib/voice/transcription-provider';
import { MAX_BYTES_DICTADO, mimeAceptado } from '@/lib/voice/audio-constraints';

export interface RespuestaTranscripcion {
  ok: boolean;
  texto?: string;
  proveedor?: string;
  error?: string;
}

/**
 * Transcribe un dictado asociado a un paciente.
 *
 * El orden de las comprobaciones importa y no es casual:
 * 1. Flag: si el dictado esta apagado, no se toca ni la sesion ni el proveedor.
 * 2. Autorizacion: `validatePatientAccess` es el mismo punto unico que usa
 *    `savePatientGuide`. Un endpoint de transcripcion sin guard es un endpoint
 *    que transcribe el audio de cualquiera.
 * 3. Validacion del audio, antes de gastar una llamada al proveedor.
 */
export async function transcribirDictado(
  patientId: string,
  formData: FormData
): Promise<RespuestaTranscripcion> {
  if (!dictadoHabilitadoEnServidor()) {
    return { ok: false, error: 'El dictado por voz no está habilitado.' };
  }

  try {
    await validatePatientAccess(patientId);
  } catch (error) {
    // No se filtra el motivo: distinguir "no existe" de "no autorizado" le diria
    // a un atacante que ese paciente existe.
    console.warn('[dictado] acceso denegado:', (error as Error).message);
    return { ok: false, error: 'No autorizado.' };
  }

  const audio = formData.get('audio');
  if (!(audio instanceof File)) {
    return { ok: false, error: 'No se recibió audio.' };
  }
  if (audio.size === 0) {
    return { ok: false, error: 'La grabación está vacía.' };
  }
  if (audio.size > MAX_BYTES_DICTADO) {
    return { ok: false, error: 'La grabación es demasiado larga. Divídala en dictados más cortos.' };
  }
  if (!mimeAceptado(audio.type)) {
    return { ok: false, error: `Formato de audio no admitido: ${audio.type || 'desconocido'}.` };
  }

  try {
    const proveedor = seleccionarProveedor();
    const bytes = new Uint8Array(await audio.arrayBuffer());
    const resultado = await proveedor.transcribir(bytes, audio.type);

    // Se registra que hubo un dictado y con que proveedor, nunca su contenido:
    // el texto es PHI y no tiene por que acabar en los logs de Render.
    console.log(
      `[dictado] transcripcion ok | proveedor=${resultado.proveedor} ` +
      `bytes=${audio.size} latenciaMs=${resultado.latenciaMs}`
    );

    return { ok: true, texto: resultado.texto, proveedor: resultado.proveedor };
  } catch (error) {
    console.error('[dictado] fallo del proveedor:', (error as Error).message);
    return { ok: false, error: 'No se pudo transcribir el dictado. Intente de nuevo.' };
  }
}
