import { describe, it, expect } from 'vitest';
import { flagEncendido, dictadoHabilitadoEnServidor, VAR_FLAG_SERVIDOR } from './dictation-flag';

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
