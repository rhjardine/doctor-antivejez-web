import { describe, it, expect } from 'vitest';
import {
  normalizarTituloCategoria,
  validarTituloCategoria,
  idCategoriaPersonalizada,
  esCategoriaPersonalizada,
  PREFIJO_CATEGORIA_PERSONALIZADA,
  LARGO_MAXIMO_TITULO,
} from './category-rules';

describe('normalizarTituloCategoria', () => {
  it('recorta y colapsa espacios', () => {
    expect(normalizarTituloCategoria('  Suplementos   importados  ')).toBe('Suplementos importados');
  });

  it('respeta las mayúsculas del médico: escribe como quiere leerlo', () => {
    expect(normalizarTituloCategoria('Terapia IV')).toBe('Terapia IV');
  });

  it('no revienta con entradas ausentes', () => {
    expect(normalizarTituloCategoria('')).toBe('');
    expect(normalizarTituloCategoria(undefined as unknown as string)).toBe('');
  });
});

describe('validarTituloCategoria', () => {
  it('acepta un nombre razonable', () => {
    expect(validarTituloCategoria('Suplementos importados')).toBeNull();
  });

  it('rechaza el vacío y lo que sólo son espacios', () => {
    expect(validarTituloCategoria('')).toBeTruthy();
    expect(validarTituloCategoria('    ')).toBeTruthy();
  });

  it('rechaza nombres demasiado cortos', () => {
    expect(validarTituloCategoria('ab')).toBeTruthy();
    expect(validarTituloCategoria('abc')).toBeNull();
  });

  it('rechaza nombres demasiado largos', () => {
    expect(validarTituloCategoria('x'.repeat(LARGO_MAXIMO_TITULO))).toBeNull();
    expect(validarTituloCategoria('x'.repeat(LARGO_MAXIMO_TITULO + 1))).toBeTruthy();
  });

  it('mide sobre el título ya normalizado, no sobre lo tecleado', () => {
    // "  ab  " son seis caracteres pero sólo dos de nombre.
    expect(validarTituloCategoria('  ab  ')).toBeTruthy();
  });

  it('el mensaje va redactado para el médico, no es un código', () => {
    expect(validarTituloCategoria('')).toMatch(/nombre/i);
  });
});

describe('identificadores de categoría', () => {
  it('llevan prefijo para distinguirse de las fijas sin consultar la base de datos', () => {
    const id = idCategoriaPersonalizada('ckl123');
    expect(id).toBe(`${PREFIJO_CATEGORIA_PERSONALIZADA}ckl123`);
    expect(esCategoriaPersonalizada(id)).toBe(true);
  });

  it('las categorías fijas del catálogo no se confunden con las creadas', () => {
    // Importa en el serializador hacia la app del paciente: si una fija se
    // tomara por personalizada, se archivaría bajo el epígrafe equivocado.
    for (const fija of ['cat_remocion', 'cat_nutra_primarios', 'cat_sueros', 'cat_activador']) {
      expect(esCategoriaPersonalizada(fija)).toBe(false);
    }
  });

  it('una cadena vacía no es una categoría personalizada', () => {
    expect(esCategoriaPersonalizada('')).toBe(false);
  });
});
