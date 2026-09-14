import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  crearProveedorEco,
  seleccionarProveedor,
  VAR_PROVEEDOR,
  MODELO_WHISPER,
} from './transcription-provider';

afterEach(() => vi.restoreAllMocks());

const audio = new Uint8Array([1, 2, 3, 4]);

describe('proveedor echo', () => {
  it('no transcribe nada y lo dice en el propio texto', async () => {
    const r = await crearProveedorEco().transcribir(audio, 'audio/webm');
    expect(r.texto).toContain('DICTADO DE PRUEBA');
    expect(r.proveedor).toBe('echo');
  });

  it('informa del tamaño recibido, útil para comprobar que la captura funcionó', async () => {
    const r = await crearProveedorEco().transcribir(audio, 'audio/webm');
    expect(r.texto).toContain('4 bytes');
  });
});

describe('seleccionarProveedor', () => {
  it('sin configuración usa echo: hace falta pedir Whisper explícitamente', () => {
    expect(seleccionarProveedor({}).nombre).toBe('echo');
  });

  it('devuelve Whisper cuando se pide y hay clave', () => {
    const p = seleccionarProveedor({ [VAR_PROVEEDOR]: 'whisper', OPENAI_API_KEY: 'sk-prueba' });
    expect(p.nombre).toBe(MODELO_WHISPER);
  });

  it('pedir Whisper sin clave degrada a echo en vez de lanzar', () => {
    // Un fallo de configuración debe apagar el dictado, no tumbar la Guía del paciente.
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const p = seleccionarProveedor({ [VAR_PROVEEDOR]: 'whisper' });
    expect(p.nombre).toBe('echo');
    expect(aviso).toHaveBeenCalled();
  });

  it('un valor desconocido cae a echo, no a un proveedor externo', () => {
    expect(seleccionarProveedor({ [VAR_PROVEEDOR]: 'deepgram' }).nombre).toBe('echo');
  });

  it('importar el módulo no exige OPENAI_API_KEY', () => {
    // src/lib/openai.ts hace throw al importarse si falta la clave. Este módulo
    // no puede comportarse así: rompería la aplicación entera, no solo el dictado.
    expect(() => seleccionarProveedor({})).not.toThrow();
  });
});
