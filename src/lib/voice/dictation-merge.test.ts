import { describe, it, expect } from 'vitest';
import { normalizarDictado, combinarDictado } from './dictation-merge';

describe('normalizarDictado', () => {
  it('colapsa espacios y recorta, sin cambiar las palabras', () => {
    expect(normalizarDictado('  indicar   MegaGH4  en ayunas ')).toBe('indicar MegaGH4 en ayunas');
  });

  it('un dictado en blanco queda vacío', () => {
    expect(normalizarDictado('   \n  ')).toBe('');
  });
});

describe('combinarDictado — anexar', () => {
  it('sobre un campo vacío devuelve solo el dictado', () => {
    expect(combinarDictado('', 'indicar Plasma Marino')).toBe('indicar Plasma Marino');
  });

  it('NUNCA destruye lo que el médico ya había escrito', () => {
    const previo = 'Paciente refiere mejoría del sueño.';
    const resultado = combinarDictado(previo, 'agregar Telomeros');
    expect(resultado.startsWith(previo)).toBe(true);
    expect(resultado).toContain('agregar Telomeros');
  });

  it('separa con un espacio', () => {
    expect(combinarDictado('Primera nota.', 'Segunda nota.')).toBe('Primera nota. Segunda nota.');
  });

  it('respeta el salto de línea si el médico ya había separado párrafos', () => {
    expect(combinarDictado('Primera nota.\n', 'Segunda nota.')).toBe('Primera nota.\nSegunda nota.');
  });

  it('un dictado vacío deja el campo intacto, incluidos sus espacios', () => {
    expect(combinarDictado('Nota previa.  ', '   ')).toBe('Nota previa.  ');
  });
});

describe('combinarDictado — reemplazar', () => {
  it('sustituye todo el contenido', () => {
    expect(combinarDictado('Nota vieja.', 'Nota nueva.', 'reemplazar')).toBe('Nota nueva.');
  });

  it('sobre un campo vacío es equivalente a anexar', () => {
    expect(combinarDictado('', 'Nota.', 'reemplazar')).toBe(combinarDictado('', 'Nota.', 'anexar'));
  });

  it('un dictado vacío no borra el campo: reemplazar con nada no es reemplazar', () => {
    expect(combinarDictado('Nota previa.', '', 'reemplazar')).toBe('Nota previa.');
  });
});
