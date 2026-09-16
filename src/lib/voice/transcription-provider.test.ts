import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  crearProveedorEco,
  seleccionarProveedor,
  VAR_PROVEEDOR,
  MODELO_WHISPER,
  PROVEEDORES_VALIDOS,
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

  it('se marca como simulado, para que la interfaz pueda decirlo aparte del texto', async () => {
    // El texto ya se explica a sí mismo, pero en la primera prueba real eso no
    // bastó: se leyó como un error del sistema. La bandera existe para que la
    // pantalla lo advierta sin depender de que nadie lea el contenido.
    const r = await crearProveedorEco().transcribir(audio, 'audio/webm');
    expect(r.simulado).toBe(true);
  });
});

describe('seleccionarProveedor', () => {
  it('sin configuración usa echo: hace falta pedir Whisper explícitamente', () => {
    expect(seleccionarProveedor({}).nombre).toBe('echo');
  });

  it('devuelve OpenAI con el nombre canónico whisper-openai y clave', () => {
    const p = seleccionarProveedor({
      [VAR_PROVEEDOR]: 'whisper-openai',
      OPENAI_API_KEY: 'sk-prueba',
    });
    expect(p.nombre).toBe(MODELO_WHISPER);
  });

  it('pedir OpenAI sin clave degrada a echo en vez de lanzar', () => {
    // Un fallo de configuración debe apagar el dictado, no tumbar la Guía del paciente.
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const p = seleccionarProveedor({ [VAR_PROVEEDOR]: 'whisper-openai' });
    expect(p.nombre).toBe('echo');
    expect(aviso).toHaveBeenCalled();
  });

  describe("el alias heredado 'whisper'", () => {
    // En producción se puso DICTADO_VOZ_PROVEEDOR=whisper creyendo que apuntaba
    // al servicio autoalojado. Apunta a OpenAI. El audio nunca salió del
    // servicio web —no había clave— y el médico vio un texto de prueba dos
    // veces. El alias se conserva para no romper despliegues, pero avisa.

    it('sigue funcionando: no se rompe un despliegue que ya lo usaba', () => {
      const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const p = seleccionarProveedor({ [VAR_PROVEEDOR]: 'whisper', OPENAI_API_KEY: 'sk-prueba' });
      expect(p.nombre).toBe(MODELO_WHISPER);
      expect(aviso).toHaveBeenCalled();
    });

    it('avisa de que es ambiguo y nombra el valor del autoalojado', () => {
      const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
      seleccionarProveedor({ [VAR_PROVEEDOR]: 'whisper', OPENAI_API_KEY: 'sk-prueba' });
      const texto = aviso.mock.calls.map((c) => String(c[0])).join('\n');
      expect(texto).toContain('ambiguo');
      expect(texto).toContain('whisper-local');
    });

    it('NUNCA se resuelve como el servicio autoalojado, aunque WHISPER_URL esté puesta', () => {
      // Resolver el alias hacia whisper-local "porque es lo que seguramente
      // querían" sería adivinar con PHI de por medio: mandaría audio a un sitio
      // que el despliegue no pidió. Se prefiere degradar a echo.
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const p = seleccionarProveedor({
        [VAR_PROVEEDOR]: 'whisper',
        WHISPER_URL: 'http://whisper:10000',
      });
      expect(p.nombre).toBe('echo');
    });
  });

  it('devuelve whisper-local cuando se pide y hay URL', () => {
    const p = seleccionarProveedor({
      [VAR_PROVEEDOR]: 'whisper-local',
      WHISPER_URL: 'http://whisper:10000',
    });
    expect(p.nombre).toBe('whisper-local');
  });

  it('pedir whisper-local sin URL degrada a echo, no lanza', () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const p = seleccionarProveedor({ [VAR_PROVEEDOR]: 'whisper-local' });
    expect(p.nombre).toBe('echo');
    expect(aviso).toHaveBeenCalled();
  });

  it('whisper-local NO usa OPENAI_API_KEY: el audio no sale a terceros', () => {
    // Si el autoalojado cayera a la API de OpenAI por tener la clave puesta,
    // la decision de no exponer PHI quedaria anulada en silencio.
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const p = seleccionarProveedor({
      [VAR_PROVEEDOR]: 'whisper-local',
      OPENAI_API_KEY: 'sk-presente',
    });
    expect(p.nombre).toBe('echo');
    expect(aviso).toHaveBeenCalled();
  });

  it('un valor desconocido cae a echo, no a un proveedor externo', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(seleccionarProveedor({ [VAR_PROVEEDOR]: 'deepgram' }).nombre).toBe('echo');
  });

  it('un valor desconocido AVISA: caer a echo en silencio cuesta una tarde de diagnóstico', () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    seleccionarProveedor({ [VAR_PROVEEDOR]: 'whisper_local' });
    const texto = aviso.mock.calls.map((c) => String(c[0])).join('\n');
    expect(texto).toContain('no es un valor reconocido');
    // El aviso enumera las salidas, para no obligar a abrir el código.
    for (const valido of PROVEEDORES_VALIDOS) expect(texto).toContain(valido);
  });

  it('echo explícito no genera ruido en los logs', () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(seleccionarProveedor({ [VAR_PROVEEDOR]: 'echo' }).nombre).toBe('echo');
    expect(aviso).not.toHaveBeenCalled();
  });

  it('importar el módulo no exige OPENAI_API_KEY', () => {
    // src/lib/openai.ts hace throw al importarse si falta la clave. Este módulo
    // no puede comportarse así: rompería la aplicación entera, no solo el dictado.
    expect(() => seleccionarProveedor({})).not.toThrow();
  });
});
