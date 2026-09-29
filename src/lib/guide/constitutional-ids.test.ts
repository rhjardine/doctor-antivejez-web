import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Blindaje de los identificadores del Activador Metabólico.
 *
 * Los itemId de la homeopatía no se guardan en ninguna parte: se DERIVAN en
 * cada render de la categoría, la subcategoría y el nombre del ítem, con
 *
 *     `am_hom_${categoria}_${subcategoria}_${nombre}`
 *         .replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()
 *
 * Eso significa que renombrar una subcategoría, o fundir dos en una lista
 * plana, cambia los identificadores y las guías ya guardadas dejan de
 * encontrar sus marcas. El dato seguiría en la base de datos, pero el médico
 * vería la casilla vacía: silencioso y difícil de atribuir.
 *
 * Al reagrupar Neuro y Vegetativo en dos columnas se conservaron ambas como
 * subcategorías precisamente por esto. Este test lo deja fijado: si alguien
 * las aplana, la suite se pone roja antes de que llegue a producción.
 *
 * Se lee el fuente como texto, en lugar de importar el módulo, porque
 * homeopathicStructure vive en un componente 'use client' que arrastra React.
 * Es la misma técnica que usa clinical-lexicon.test.ts.
 */

const RUTA = path.join(process.cwd(), 'src/components/patient-guide/PatientGuide.tsx');
const fuente = readFileSync(RUTA, 'utf-8');

/** Réplica exacta de la derivación del componente. Si una cambia, la otra debe cambiar. */
function derivarId(categoria: string, subcategoria: string, nombre: string): string {
  return `am_hom_${categoria}_${subcategoria}_${nombre}`
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .toLowerCase();
}

const NEURO = [
  'Leptosómica melanc. joven',
  'Leptosómica melanc. mayor',
  'Picnica flem joven',
  'Picnica flem mayor',
];

const VEGETATIVO = [
  'Atlética colérica joven',
  'Atlética colérica mayor',
  'Robusta sang joven',
  'Robusta sang mayor',
];

describe('Perfiles Constitucionales: identificadores estables', () => {
  it("'Neuro' y 'Vegetativo' siguen siendo subcategorías declaradas", () => {
    // Si se aplanaran en una lista, estas claves desaparecerían del fuente.
    expect(fuente).toContain("'Perfiles Constitucionales': {");
    expect(fuente).toContain("'Neuro': [");
    expect(fuente).toContain("'Vegetativo': [");
  });

  it('los ocho perfiles siguen escritos exactamente igual', () => {
    // El nombre entra en el id, así que una tilde o un punto de más lo cambia.
    for (const nombre of [...NEURO, ...VEGETATIVO]) {
      expect(fuente).toContain(`'${nombre}'`);
    }
  });

  it('los identificadores derivados no han cambiado', () => {
    // Valores congelados: calculados con la estructura vigente antes de
    // reagrupar las columnas. No deben tocarse sin migrar los datos.
    expect(derivarId('Perfiles Constitucionales', 'Neuro', NEURO[0])).toBe(
      'am_hom_perfiles_constitucionales_neuro_leptos_mica_melanc__joven'
    );
    expect(derivarId('Perfiles Constitucionales', 'Vegetativo', VEGETATIVO[3])).toBe(
      'am_hom_perfiles_constitucionales_vegetativo_robusta_sang_mayor'
    );
  });

  it('Neuro y Vegetativo producen identificadores distintos entre sí', () => {
    const ids = new Set([
      ...NEURO.map((n) => derivarId('Perfiles Constitucionales', 'Neuro', n)),
      ...VEGETATIVO.map((n) => derivarId('Perfiles Constitucionales', 'Vegetativo', n)),
    ]);
    expect(ids.size).toBe(8);
  });

  it('el reagrupado es sólo de presentación: la subcategoría sigue llegando al render', () => {
    // renderCheckbox recibe tres argumentos en la rama de columnas. Si alguien
    // quitara el tercero, los ids cambiarían en silencio.
    expect(fuente).toContain('renderCheckbox(item, category, subCategory)');
  });
});
