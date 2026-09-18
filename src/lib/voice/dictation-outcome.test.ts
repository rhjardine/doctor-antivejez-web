import { describe, it, expect } from 'vitest';
import {
  interpretarRespuesta,
  MENSAJE_SIN_RESPUESTA,
  MENSAJE_GENERICO,
} from './dictation-outcome';

describe('interpretarRespuesta', () => {
  describe('cuando la Server Action no llegó a responder', () => {
    // El caso que se dio en producción: un 403 de algo intermedio impidió que
    // el POST llegara al servidor, Next entregó undefined, y el componente
    // reventaba con "Cannot read properties of undefined (reading 'ok')".

    it('undefined no revienta: devuelve un error explicado', () => {
      expect(() => interpretarRespuesta(undefined)).not.toThrow();
      const r = interpretarRespuesta(undefined);
      expect(r.tipo).toBe('error');
    });

    it('null tampoco revienta', () => {
      expect(interpretarRespuesta(null).tipo).toBe('error');
    });

    it('se distingue de un rechazo del servidor mediante sinRespuesta', () => {
      // No es cosmético: "no llegó" y "llegó y lo rechazó" mandan a mirar
      // sitios distintos. Confundirlos fue lo que costó el diagnóstico.
      const noLlego = interpretarRespuesta(undefined);
      const rechazo = interpretarRespuesta({ ok: false, error: 'No autorizado.' });
      expect(noLlego).toMatchObject({ sinRespuesta: true });
      expect(rechazo).toMatchObject({ sinRespuesta: false });
    });

    it('el mensaje nombra causas comprobables, no culpa al dictado', () => {
      const r = interpretarRespuesta(undefined);
      expect(r.tipo === 'error' && r.mensaje).toBe(MENSAJE_SIN_RESPUESTA);
      expect(MENSAJE_SIN_RESPUESTA).toMatch(/VPN/);
      expect(MENSAJE_SIN_RESPUESTA).toMatch(/extensión/);
    });
  });

  describe('cuando el servidor respondió', () => {
    it('propaga el error del servidor tal cual, sin reinterpretarlo', () => {
      const r = interpretarRespuesta({ ok: false, error: 'No autorizado.' });
      expect(r).toEqual({ tipo: 'error', mensaje: 'No autorizado.', sinRespuesta: false });
    });

    it('un ok:false sin mensaje cae en el genérico', () => {
      const r = interpretarRespuesta({ ok: false });
      expect(r.tipo === 'error' && r.mensaje).toBe(MENSAJE_GENERICO);
    });

    it('devuelve el texto transcrito', () => {
      const r = interpretarRespuesta({ ok: true, texto: 'Paciente refiere mejoría.' });
      expect(r).toEqual({ tipo: 'texto', texto: 'Paciente refiere mejoría.', simulado: false });
    });

    it('propaga la marca de simulado, que es lo que pinta el aviso rojo', () => {
      const r = interpretarRespuesta({ ok: true, texto: '[DICTADO DE PRUEBA]', simulado: true });
      expect(r).toEqual({ tipo: 'texto', texto: '[DICTADO DE PRUEBA]', simulado: true });
    });

    it('ok con texto vacío es un error, no un éxito en blanco', () => {
      // Aceptarlo dejaría al médico ante una propuesta vacía sin explicación.
      expect(interpretarRespuesta({ ok: true, texto: '' }).tipo).toBe('error');
      expect(interpretarRespuesta({ ok: true, texto: '   ' }).tipo).toBe('error');
      expect(interpretarRespuesta({ ok: true }).tipo).toBe('error');
    });
  });

  it('nunca devuelve simulado indefinido en el camino de éxito', () => {
    // La interfaz decide con un booleano; un undefined ahí apagaría el aviso.
    const r = interpretarRespuesta({ ok: true, texto: 'algo' });
    expect(r.tipo === 'texto' && typeof r.simulado).toBe('boolean');
  });
});
