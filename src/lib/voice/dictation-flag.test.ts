import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  flagEncendido,
  dictadoHabilitadoEnServidor,
  VAR_FLAG_SERVIDOR,
  VAR_FLAG_CLIENTE,
  VAR_FLAG_SUSPENDIDO,
  MOTIVO_SUSPENSION,
} from './dictation-flag';

describe('flagEncendido', () => {
  it('solo enciende con true o 1', () => {
    expect(flagEncendido('true')).toBe(true);
    expect(flagEncendido('1')).toBe(true);
    expect(flagEncendido('TRUE')).toBe(true);
    expect(flagEncendido('  true  ')).toBe(true);
  });

  it('cualquier otro valor deja el dictado apagado', () => {
    // 'yes' y 'on' parecen razonables y NO encienden a proposito: ante la duda,
    // la funcion que manda audio a un tercero se queda quieta.
    for (const valor of ['yes', 'on', 'enabled', 'false', '0', 'sí', 'basura', '']) {
      expect(flagEncendido(valor)).toBe(false);
    }
  });

  it('ausente o nulo esta apagado', () => {
    expect(flagEncendido(undefined)).toBe(false);
    expect(flagEncendido(null)).toBe(false);
  });
});

describe('dictadoHabilitadoEnServidor', () => {
  it('esta apagado cuando la variable no existe: ese es el valor por defecto', () => {
    expect(dictadoHabilitadoEnServidor({})).toBe(false);
  });

  it('se enciende con la variable del servidor', () => {
    expect(dictadoHabilitadoEnServidor({ [VAR_FLAG_SERVIDOR]: 'true' })).toBe(true);
  });

  it('la variable del cliente NO enciende el servidor', () => {
    // Si la de cliente bastara, cualquiera podria activar el dictado desde el
    // navegador: NEXT_PUBLIC_* viaja al bundle y es manipulable.
    expect(
      dictadoHabilitadoEnServidor({ NEXT_PUBLIC_DICTADO_VOZ_ENABLED: 'true' })
    ).toBe(false);
  });
});

describe('suspensión temporal del dictado', () => {
  // El médico desactivó el servicio de Whisper en Render por lento y pidió que
  // el botón no desapareciera sin más, sino que explicara por qué no funciona.

  it('es un estado distinto de estar apagado: tiene su propia variable', () => {
    expect(VAR_FLAG_SUSPENDIDO).toBe('NEXT_PUBLIC_DICTADO_VOZ_SUSPENDIDO');
    expect(VAR_FLAG_SUSPENDIDO).not.toBe(VAR_FLAG_CLIENTE);
  });

  it('se lee como acceso literal a process.env, no por índice', () => {
    // Con `process.env[variable]` Next no sustituye el valor en el bundle y en
    // el navegador saldría siempre undefined: el aviso no se vería nunca.
    const fuente = readFileSync(
      path.join(process.cwd(), 'src/lib/voice/dictation-flag.ts'),
      'utf-8'
    );
    expect(fuente).toContain('process.env.NEXT_PUBLIC_DICTADO_VOZ_SUSPENDIDO');
  });

  it('el motivo explica la causa, no sólo que no funciona', () => {
    expect(MOTIVO_SUSPENSION).toMatch(/lento/i);
    expect(MOTIVO_SUSPENSION.length).toBeGreaterThan(40);
  });

  it('apagado por defecto: un despliegue que no la defina no muestra el aviso', () => {
    expect(flagEncendido(undefined)).toBe(false);
  });
});
