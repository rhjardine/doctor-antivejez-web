import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VAR_FLAG_SERVIDOR } from '@/lib/voice/dictation-flag';
import { transcribirDictado } from './voice.actions';
import { MAX_BYTES_DICTADO } from '@/lib/voice/audio-constraints';

// Se sustituyen las dos dependencias externas de la accion. El objetivo no es
// aislar por aislar: es poder afirmar que el proveedor NO se llama cuando no
// debe, algo que no se puede comprobar con el proveedor real de por medio.
const validatePatientAccess = vi.fn();
const transcribir = vi.fn();

vi.mock('@/lib/auth-guards', () => ({
  validatePatientAccess: (id: string) => validatePatientAccess(id),
}));

vi.mock('@/lib/voice/transcription-provider', () => ({
  seleccionarProveedor: () => ({ nombre: 'falso', transcribir }),
}));


const PACIENTE = 'ckl1234567890abcdefghijk';

function audioValido(bytes = 100, tipo = 'audio/webm'): FormData {
  const fd = new FormData();
  fd.append('audio', new File([new Uint8Array(bytes)], 'dictado.webm', { type: tipo }));
  return fd;
}

beforeEach(() => {
  validatePatientAccess.mockReset().mockResolvedValue({ session: { user: { id: 'u1' } } });
  transcribir.mockReset().mockResolvedValue({ texto: 'texto', proveedor: 'falso', latenciaMs: 5 });
  process.env[VAR_FLAG_SERVIDOR] = 'true';
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  delete process.env[VAR_FLAG_SERVIDOR];
  vi.restoreAllMocks();
});

describe('flag apagado', () => {
  it('rechaza sin tocar la sesión ni el proveedor', async () => {
    delete process.env[VAR_FLAG_SERVIDOR];
    const r = await transcribirDictado(PACIENTE, audioValido());
    expect(r.ok).toBe(false);
    // Lo que importa: no se resolvió sesión ni se envió audio a ningún sitio.
    expect(validatePatientAccess).not.toHaveBeenCalled();
    expect(transcribir).not.toHaveBeenCalled();
  });
});

describe('autorización', () => {
  it('sin acceso al paciente no se transcribe', async () => {
    validatePatientAccess.mockRejectedValue(new Error('FORBIDDEN: Acceso denegado'));
    const r = await transcribirDictado(PACIENTE, audioValido());
    expect(r.ok).toBe(false);
    expect(transcribir).not.toHaveBeenCalled();
  });

  it('no revela si el paciente existe o si falta permiso', async () => {
    validatePatientAccess.mockRejectedValue(new Error('NOT_FOUND: Registro no encontrado'));
    const noExiste = await transcribirDictado(PACIENTE, audioValido());
    validatePatientAccess.mockRejectedValue(new Error('FORBIDDEN: Acceso denegado'));
    const sinPermiso = await transcribirDictado(PACIENTE, audioValido());
    expect(noExiste.error).toBe(sinPermiso.error);
  });

  it('el guard se llama con el paciente recibido', async () => {
    await transcribirDictado(PACIENTE, audioValido());
    expect(validatePatientAccess).toHaveBeenCalledWith(PACIENTE);
  });
});

describe('validación del audio', () => {
  it('sin audio no se llama al proveedor', async () => {
    const r = await transcribirDictado(PACIENTE, new FormData());
    expect(r.ok).toBe(false);
    expect(transcribir).not.toHaveBeenCalled();
  });

  it('una grabación vacía se rechaza', async () => {
    const r = await transcribirDictado(PACIENTE, audioValido(0));
    expect(r.ok).toBe(false);
    expect(transcribir).not.toHaveBeenCalled();
  });

  it('un audio por encima del límite se rechaza antes de gastar la llamada', async () => {
    const r = await transcribirDictado(PACIENTE, audioValido(MAX_BYTES_DICTADO + 1));
    expect(r.ok).toBe(false);
    expect(transcribir).not.toHaveBeenCalled();
  });

  it('un formato no admitido se rechaza', async () => {
    const r = await transcribirDictado(PACIENTE, audioValido(100, 'application/pdf'));
    expect(r.ok).toBe(false);
    expect(transcribir).not.toHaveBeenCalled();
  });

  it('acepta el mime con parámetros de códec que emite MediaRecorder', async () => {
    const r = await transcribirDictado(PACIENTE, audioValido(100, 'audio/webm;codecs=opus'));
    expect(r.ok).toBe(true);
  });
});

describe('camino feliz', () => {
  it('devuelve el texto y el proveedor', async () => {
    const r = await transcribirDictado(PACIENTE, audioValido());
    expect(r).toMatchObject({ ok: true, texto: 'texto', proveedor: 'falso' });
  });

  it('un fallo del proveedor no propaga la excepción al formulario', async () => {
    transcribir.mockRejectedValue(new Error('timeout del proveedor'));
    const r = await transcribirDictado(PACIENTE, audioValido());
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it('el texto dictado nunca se escribe en los logs: es PHI', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    transcribir.mockResolvedValue({
      texto: 'el paciente refiere dolor lumbar',
      proveedor: 'falso',
      latenciaMs: 5,
    });
    await transcribirDictado(PACIENTE, audioValido());
    const registrado = log.mock.calls.flat().join(' ');
    expect(registrado).not.toContain('dolor lumbar');
    expect(registrado).toContain('proveedor=falso');
  });
});
