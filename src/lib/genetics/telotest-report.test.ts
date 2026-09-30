import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  informeDesdeRegistros,
  REFERENCIAS_TELOMEROS,
  SIN_CODIGO_CLIENTE,
  type RegistroGenetico,
  type PacienteDelInforme,
} from './telotest-report';

const RAIZ = process.cwd();

const paciente: PacienteDelInforme = {
  firstName: 'Ana',
  lastName: 'Pérez',
  birthDate: new Date('1980-03-15'),
  chronologicalAge: 46,
};

const registro = (extra: Partial<RegistroGenetico> = {}): RegistroGenetico => ({
  averageTelomereLength: '1,12 kb',
  biologicalAge: 44,
  chronologicalAge: 46,
  differentialAge: -2,
  interpretation: null,
  therapeuticResults: null,
  recommendations: null,
  testDate: new Date('2026-05-01'),
  ...extra,
});

describe('informeDesdeRegistros', () => {
  it('sin tests genéticos devuelve null, no un informe de ejemplo', () => {
    // Éste es el corazón del arreglo: la ficha debe poder decir «no hay nada».
    expect(informeDesdeRegistros(paciente, [])).toBeNull();
    expect(informeDesdeRegistros(paciente, null)).toBeNull();
    expect(informeDesdeRegistros(paciente, undefined)).toBeNull();
  });

  it('sin paciente devuelve null', () => {
    expect(informeDesdeRegistros(null, [registro()])).toBeNull();
  });

  it('el informe lleva los datos DEL paciente, no los de otra persona', () => {
    const informe = informeDesdeRegistros(paciente, [registro()]);

    expect(informe!.patient.firstName).toBe('Ana');
    expect(informe!.patient.lastName).toBe('Pérez');
    expect(informe!.patient.chronologicalAge).toBe(46);
    expect(informe!.patient.birthDate.getUTCFullYear()).toBe(1980);
  });

  it('las cifras salen del registro real', () => {
    const informe = informeDesdeRegistros(paciente, [
      registro({ averageTelomereLength: '0,98 kb', biologicalAge: 51, differentialAge: 5 }),
    ]);

    expect(informe!.results.averageTelomereLength).toBe('0,98 kb');
    expect(informe!.results.estimatedBiologicalAge).toContain('51');
    expect(informe!.results.agingDifference).toBe(5);
  });

  it('toma el test MÁS RECIENTE, no el primero de la lista', () => {
    const informe = informeDesdeRegistros(paciente, [
      registro({ testDate: new Date('2024-01-01'), averageTelomereLength: 'viejo' }),
      registro({ testDate: new Date('2026-06-01'), averageTelomereLength: 'nuevo' }),
      registro({ testDate: new Date('2025-01-01'), averageTelomereLength: 'medio' }),
    ]);

    expect(informe!.results.averageTelomereLength).toBe('nuevo');
  });

  it('no reordena la lista que recibe', () => {
    // Es la misma referencia que tiene la ficha en su estado; ordenarla en el
    // sitio cambiaría lo que ve el resto de la pantalla.
    const registros = [
      registro({ testDate: new Date('2024-01-01'), averageTelomereLength: 'a' }),
      registro({ testDate: new Date('2026-01-01'), averageTelomereLength: 'b' }),
    ];

    informeDesdeRegistros(paciente, registros);

    expect(registros[0].averageTelomereLength).toBe('a');
  });

  it('una interpretación ausente queda vacía: no se rellena con texto de ejemplo', () => {
    const informe = informeDesdeRegistros(paciente, [registro({ interpretation: null })]);
    expect(informe!.interpretation).toBe('');
  });

  it('una interpretación real se conserva tal cual', () => {
    const texto = 'Longitud telomérica dentro del rango esperado para la edad.';
    const informe = informeDesdeRegistros(paciente, [registro({ interpretation: texto })]);
    expect(informe!.interpretation).toBe(texto);
  });

  it('las listas ausentes quedan vacías, no con tratamientos inventados', () => {
    const informe = informeDesdeRegistros(paciente, [registro()]);

    expect(informe!.therapeuticResults).toEqual([]);
    expect(informe!.generalRecommendations).toEqual([]);
  });

  it('un Json que no es lista no revienta la ficha', () => {
    // `therapeuticResults` es Json?: puede traer cualquier cosa de la base.
    const informe = informeDesdeRegistros(paciente, [
      registro({ therapeuticResults: { roto: true }, recommendations: 'texto suelto' }),
    ]);

    expect(informe!.therapeuticResults).toEqual([]);
    expect(informe!.generalRecommendations).toEqual([]);
  });

  it('las listas reales se conservan', () => {
    const terapias = [{ category: 'Mineral', items: ['Magnesio'] }];
    const informe = informeDesdeRegistros(paciente, [registro({ therapeuticResults: terapias })]);

    expect(informe!.therapeuticResults).toEqual(terapias);
  });

  it('no se fabrica un código de cliente que el sistema no tiene', () => {
    const informe = informeDesdeRegistros(paciente, [registro()]);
    expect(informe!.patient.customerCode).toBe(SIN_CODIGO_CLIENTE);
  });

  it('las referencias científicas se conservan: son literatura, no datos de paciente', () => {
    const informe = informeDesdeRegistros(paciente, [registro()]);
    expect(informe!.references).toEqual(REFERENCIAS_TELOMEROS);
    expect(REFERENCIAS_TELOMEROS.length).toBeGreaterThan(0);
  });
});

// ─── Conexión: que el informe inventado no vuelva ─────────────────────────────
//
// Lo que se retiró no era un placeholder vacío: `telotestReportData` llevaba
// dentro el nombre y la fecha de nacimiento de una persona concreta, una
// longitud telomérica, una edad biológica y una lista de tratamientos, y se
// mostraba en la ficha de CUALQUIER paciente. Estas pruebas fallan si alguien lo
// reintroduce.

describe('el informe genético inventado no vuelve', () => {
  it('src/lib/mock-data.ts ya no existe', () => {
    expect(existsSync(join(RAIZ, 'src/lib/mock-data.ts'))).toBe(false);
  });

  it('nadie importa telotestReportData', () => {
    for (const archivo of [
      'src/app/(dashboard)/historias/[id]/page.tsx',
      'src/components/genetics/GeneticTestForm.tsx',
      'src/components/genetics/GeneticTestView.tsx',
    ]) {
      const fuente = readFileSync(join(RAIZ, archivo), 'utf8');
      expect(fuente).not.toContain('telotestReportData');
      expect(fuente).not.toContain('mock-data');
    }
  });

  it('la ficha construye el informe desde los tests del paciente', () => {
    const fuente = readFileSync(join(RAIZ, 'src/app/(dashboard)/historias/[id]/page.tsx'), 'utf8');

    expect(fuente).toContain('informeDesdeRegistros');
    expect(fuente).toContain('patient.geneticTests');
  });

  it('el formulario no guarda interpretación ni tratamientos enlatados', () => {
    // Éste era el caso peor: no se mostraba un informe falso, se ESCRIBÍA en la
    // historia clínica del paciente al guardar el test.
    const fuente = readFileSync(join(RAIZ, 'src/components/genetics/GeneticTestForm.tsx'), 'utf8');

    expect(fuente).not.toMatch(/interpretation:\s*telotestReportData/);
    expect(fuente).not.toMatch(/therapeuticResults:\s*telotestReportData/);
    expect(fuente).not.toMatch(/recommendations:\s*telotestReportData/);
  });

  it('la vista acepta que no haya informe', () => {
    const fuente = readFileSync(join(RAIZ, 'src/components/genetics/GeneticTestView.tsx'), 'utf8');

    expect(fuente).toMatch(/report:\s*TelotestReport\s*\|\s*null/);
  });
});
