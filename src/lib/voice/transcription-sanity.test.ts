import { describe, it, expect } from 'vitest';
import {
  diagnosticarTranscripcion,
  esDegenerada,
  MINIMO_PALABRAS,
} from './transcription-sanity';

/**
 * El caso real: dictado de dos minutos del médico, devuelto por whisper-local
 * con el modelo `base`. No es su voz — es la lista de sesgo del vademécum
 * continuada en bucle. Reproducido aquí tal como apareció en pantalla.
 */
const BUCLE_REAL = Array(14)
  .fill('Adrenales, Aceite de ricino, Adrenales, Antiviral c-Limón, Aceite de ricino,')
  .join(' ');

/** Un dictado clínico plausible, con terminología del vademécum repetida de forma legítima. */
const DICTADO_REAL = `
La paciente refiere mejoría en el patrón de sueño desde la última consulta, aunque
persiste la fatiga por las tardes. Se mantiene MegaGH4 dos cápsulas en ayunas y se
añade Omega 3 una cápsula con el almuerzo. Suspendemos el Digestivo porque ya no
presenta distensión abdominal. Insistir en la hidratación y en caminar treinta
minutos diarios. Control en seis semanas con perfil tiroideo y vitamina D. Si la
fatiga persiste, valoraremos añadir un suero energizante quincenal.
`;

describe('diagnosticarTranscripcion', () => {
  describe('el bucle que llegó a producción', () => {
    it('se marca como degenerada', () => {
      expect(esDegenerada(BUCLE_REAL)).toBe(true);
    });

    it('la variedad de palabras es ínfima, y es la señal que lo delata', () => {
      const d = diagnosticarTranscripcion(BUCLE_REAL);
      expect(d.variedad).toBeLessThan(0.18);
      expect(d.palabras).toBeGreaterThan(MINIMO_PALABRAS);
    });

    it('expone métricas para poder registrar el motivo sin escribir el texto (PHI)', () => {
      const d = diagnosticarTranscripcion(BUCLE_REAL);
      expect(typeof d.variedad).toBe('number');
      expect(typeof d.cuotaTrigrama).toBe('number');
      expect(typeof d.palabras).toBe('number');
    });
  });

  describe('un dictado clínico real', () => {
    it('NO se marca: rechazar trabajo bueno del médico sería peor que el bug', () => {
      expect(esDegenerada(DICTADO_REAL)).toBe(false);
    });

    it('mantiene una variedad de palabras propia del habla humana', () => {
      expect(diagnosticarTranscripcion(DICTADO_REAL).variedad).toBeGreaterThan(0.3);
    });
  });

  describe('textos cortos', () => {
    it('no se juzgan: repetir en una frase corta es normal', () => {
      expect(esDegenerada('Sí, sí, sí.')).toBe(false);
      expect(esDegenerada('Aceite de ricino. Aceite de ricino.')).toBe(false);
    });

    it('el vacío no es degenerado, es vacío — de eso se ocupa otra comprobación', () => {
      expect(esDegenerada('')).toBe(false);
      expect(esDegenerada('   ')).toBe(false);
    });
  });

  describe('bucle de frase larga', () => {
    // Un bucle de periodo P da una cuota de trigrama de ~1/P, así que las
    // frases largas apenas mueven esa métrica. Se detectan igual, y conviene
    // que el test lo deje explícito: son dos señales complementarias, no una
    // redundante.
    const texto = Array(12)
      .fill('control en seis semanas con perfil tiroideo completo y vitamina')
      .join(' ');

    it('se marca como degenerada', () => {
      expect(esDegenerada(texto)).toBe(true);
    });

    it('con el umbral de trigrama en 0,15 se habría escapado: lo salva la variedad', () => {
      const d = diagnosticarTranscripcion(texto);
      expect(d.cuotaTrigrama).toBeLessThan(0.15);
      expect(d.variedad).toBeLessThan(0.18);
    });

    it('aun así queda por encima del umbral calibrado de trigrama', () => {
      expect(diagnosticarTranscripcion(texto).cuotaTrigrama).toBeGreaterThanOrEqual(0.08);
    });
  });

  describe('separación entre bucle y dictado largo legítimo', () => {
    it('un dictado largo con muletillas repetidas no se marca', () => {
      // Tres veces el dictado real: un texto largo donde expresiones como
      // "en la" o "de la" recurren de forma natural. Es el falso positivo
      // que más caro saldría, porque descartaría trabajo bueno del médico.
      const largo = Array(3).fill(DICTADO_REAL).join(' ');
      const d = diagnosticarTranscripcion(largo);
      expect(d.degenerada).toBe(false);
      expect(d.cuotaTrigrama).toBeLessThan(0.08);
    });
  });

  it('no lanza con entradas raras', () => {
    expect(() => diagnosticarTranscripcion('...')).not.toThrow();
    expect(() => diagnosticarTranscripcion('😀😀😀')).not.toThrow();
    expect(() => diagnosticarTranscripcion('\n\n\t')).not.toThrow();
  });
});
