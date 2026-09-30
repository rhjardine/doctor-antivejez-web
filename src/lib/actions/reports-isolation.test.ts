import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Regresion de `generateReport`.
//
// El modulo entero no comprobaba sesion. Como una Server Action exportada es un
// endpoint HTTP, `generateReport` devolvia la base de pacientes completa a quien
// la invocara: identificacion, email, telefono, direccion, observaciones y
// `passwordHash` —el bcrypt con el que el paciente entra a su app movil—, porque
// la consulta usaba `include` sin `select`. El unico control estaba en el
// cliente (reportes/page.tsx), que no protege nada.
//
// Estas pruebas fallan contra el codigo anterior por tres motivos distintos:
//  1. sin sesion, la accion respondia igual;
//  2. el `where` no llevaba el alcance del profesional;
//  3. la consulta no llevaba `select`, asi que el hash viajaba al navegador.

const requireSession = vi.fn();
const patientFindMany = vi.fn();
const patientCount = vi.fn();
const patientGroupBy = vi.fn();
const userFindMany = vi.fn();
const biophysicsFindMany = vi.fn();
const omicFindMany = vi.fn();
const omicAggregate = vi.fn();

vi.mock('@/lib/auth-guards', async () => {
  // AUTH_ERRORS es el real: si se simulara, se comprobaria el rechazo contra un
  // codigo inventado y la prueba pasaria aunque el codigo cambiara.
  const real = await vi.importActual<typeof import('@/lib/auth-guards')>('@/lib/auth-guards');
  return {
    AUTH_ERRORS: real.AUTH_ERRORS,
    requireSession: () => requireSession(),
  };
});

// `@/lib/auth` se simula porque el `auth-guards` real lo arrastra al importarlo,
// y con el vendria toda la configuracion de NextAuth.
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));

vi.mock('@/lib/db', () => ({
  db: {},
  prisma: {
    patient: {
      findMany: (a: unknown) => patientFindMany(a),
      count: (a: unknown) => patientCount(a),
      groupBy: (a: unknown) => patientGroupBy(a),
    },
    user: { findMany: (a: unknown) => userFindMany(a) },
    biophysicsTest: { findMany: (a: unknown) => biophysicsFindMany(a) },
    omicTransaction: {
      findMany: (a: unknown) => omicFindMany(a),
      aggregate: (a: unknown) => omicAggregate(a),
    },
  },
}));

import { generateReport } from './reports.actions';

// El rol que usa la mayoria de las pruebas necesita tener concedido el modulo,
// porque `generateReport` comprueba el permiso ademas de la sesion. MEDICO no lo
// tiene por defecto, asi que se le concede explicitamente: lo que estas pruebas
// verifican es el ALCANCE, no el permiso —eso vive en permissions.test.ts.
const MEDICO = {
  session: {
    user: { id: 'medico-1', role: 'MEDICO', tenantId: null, permissions: { reportes: true } },
  },
};

/** Recorre un objeto de Prisma y junta todas las claves, a cualquier profundidad. */
function clavesProfundas(valor: unknown, acumulado: string[] = []): string[] {
  if (valor === null || typeof valor !== 'object') return acumulado;
  for (const [clave, hijo] of Object.entries(valor as Record<string, unknown>)) {
    acumulado.push(clave);
    clavesProfundas(hijo, acumulado);
  }
  return acumulado;
}

beforeEach(() => {
  requireSession.mockReset().mockResolvedValue(MEDICO);
  patientFindMany.mockReset().mockResolvedValue([]);
  patientCount.mockReset().mockResolvedValue(0);
  patientGroupBy.mockReset().mockResolvedValue([]);
  userFindMany.mockReset().mockResolvedValue([]);
  biophysicsFindMany.mockReset().mockResolvedValue([]);
  omicFindMany.mockReset().mockResolvedValue([]);
  omicAggregate.mockReset().mockResolvedValue({ _avg: { pointsEarned: 0 } });
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

const TODOS = [
  'patient_attendance',
  'treatment_adherence',
  'patient_evolution',
  'professional_performance',
  'ri_bio',
  'professional_analytics',
] as const;

describe('generateReport — permiso del modulo', () => {
  it('un rol sin el modulo concedido no genera reportes, aunque tenga sesion', async () => {
    // MEDICO no tiene `reportes` en la matriz por defecto. El cliente lo
    // comprobaba a mano y ademas al reves; ahora decide el servidor.
    requireSession.mockResolvedValue({
      session: { user: { id: 'medico-3', role: 'MEDICO', tenantId: null, permissions: null } },
    });

    await expect(generateReport('patient_attendance', 'all')).rejects.toThrow(/FORBIDDEN/);
    expect(patientFindMany).not.toHaveBeenCalled();
  });

  // No falla contra el codigo anterior, y no pretende hacerlo: el guardia nuevo
  // es lo que podria bloquear de mas. El fallo de produccion estaba en el
  // cliente, y quien lo captura es `permissions.test.ts`.
  it('el guardia nuevo NO bloquea a ADMIN', async () => {
    requireSession.mockResolvedValue({
      session: { user: { id: 'admin-1', role: 'ADMIN', tenantId: null, permissions: null } },
    });

    await expect(generateReport('patient_attendance', 'all')).resolves.toBeTruthy();
    expect(patientFindMany).toHaveBeenCalled();
  });

  it('el permiso se comprueba ANTES de consultar la base', async () => {
    requireSession.mockResolvedValue({
      session: { user: { id: 'coach-1', role: 'COACH', tenantId: null, permissions: null } },
    });

    await expect(generateReport('professional_analytics', 'all')).rejects.toThrow(/FORBIDDEN/);
    expect(patientCount).not.toHaveBeenCalled();
  });
});

describe('generateReport — sesion obligatoria', () => {
  it('sin sesion no responde, y no toca la base', async () => {
    requireSession.mockRejectedValue(new Error('UNAUTHORIZED: Sesión no válida'));

    await expect(generateReport('patient_attendance', 'all')).rejects.toThrow(/UNAUTHORIZED/);

    expect(patientFindMany).not.toHaveBeenCalled();
  });

  it('ningun tipo de reporte se genera sin sesion', async () => {
    requireSession.mockRejectedValue(new Error('UNAUTHORIZED: Sesión no válida'));

    for (const tipo of TODOS) {
      await expect(generateReport(tipo, 'all')).rejects.toThrow(/UNAUTHORIZED/);
    }
    expect(patientFindMany).not.toHaveBeenCalled();
    expect(patientCount).not.toHaveBeenCalled();
    expect(userFindMany).not.toHaveBeenCalled();
  });

  it('la sesion se resuelve ANTES de consultar, no despues', async () => {
    const orden: string[] = [];
    requireSession.mockImplementation(() => {
      orden.push('sesion');
      return Promise.resolve(MEDICO);
    });
    patientFindMany.mockImplementation(() => {
      orden.push('consulta');
      return Promise.resolve([]);
    });

    await generateReport('patient_attendance', 'all');

    expect(orden).toEqual(['sesion', 'consulta']);
  });
});

describe('generateReport — el hash nunca sale del servidor', () => {
  it('la consulta de pacientes usa select, no include suelto', async () => {
    await generateReport('patient_attendance', 'all');

    const args = patientFindMany.mock.calls[0][0];
    // `findMany` sin `select` devuelve TODOS los escalares de Patient. Con
    // `include` lo que se hacia era añadir la relacion sin restringir nada.
    expect(args).toHaveProperty('select');
    expect(args).not.toHaveProperty('include');
  });

  it('passwordHash no aparece en el select de ninguna consulta de pacientes', async () => {
    for (const tipo of ['patient_attendance', 'treatment_adherence', 'patient_evolution'] as const) {
      patientFindMany.mockClear();
      await generateReport(tipo, 'all');

      const args = patientFindMany.mock.calls[0][0];
      expect(args).toHaveProperty('select');
      expect(clavesProfundas(args.select)).not.toContain('passwordHash');
    }
  });

  it('tampoco viajan email, telefono, direccion ni observaciones', async () => {
    await generateReport('patient_attendance', 'all');

    const select = patientFindMany.mock.calls[0][0].select;
    // Sin esta primera asercion la prueba pasaba en VERDE contra el codigo
    // vulnerable: `select` era undefined, `clavesProfundas(undefined)` devolvia
    // [] y `not.toContain` se cumplia vaciamente. Un falso verde comprobando
    // justo la fuga que se quiere impedir.
    expect(select).toBeTypeOf('object');

    const claves = clavesProfundas(select);
    expect(claves.length).toBeGreaterThan(0);
    for (const prohibido of ['email', 'phone', 'address', 'observations']) {
      expect(claves).not.toContain(prohibido);
    }
  });

  it('el reporte de profesionales no pide password', async () => {
    // La misma fuga en la otra tabla: `User.password` es el bcrypt del medico.
    await generateReport('professional_performance', 'all');

    const args = userFindMany.mock.calls[0][0];
    expect(args).toHaveProperty('select');
    expect(args).not.toHaveProperty('include');
    expect(clavesProfundas(args.select)).not.toContain('password');
  });
});

describe('generateReport — aislamiento entre profesionales', () => {
  it('un MEDICO sin clinica solo alcanza sus pacientes', async () => {
    await generateReport('patient_attendance', 'all');

    const where = patientFindMany.mock.calls[0][0].where;
    expect(where.userId).toBe('medico-1');
    expect(where.deletedAt).toBeNull();
  });

  it('un MEDICO con clinica alcanza la suya, y nada mas', async () => {
    requireSession.mockResolvedValue({
      session: {
        user: { id: 'medico-2', role: 'MEDICO', tenantId: 'clinica-a', permissions: { reportes: true } },
      },
    });

    await generateReport('patient_attendance', 'all');

    const where = patientFindMany.mock.calls[0][0].where;
    expect(where.tenantId).toBe('clinica-a');
    expect(where.deletedAt).toBeNull();
  });

  it('ADMIN ve todo, pero nunca los borrados', async () => {
    requireSession.mockResolvedValue({
      session: { user: { id: 'admin-1', role: 'ADMIN', tenantId: null } },
    });

    await generateReport('patient_attendance', 'all');

    const where = patientFindMany.mock.calls[0][0].where;
    expect(where.userId).toBeUndefined();
    expect(where.tenantId).toBeUndefined();
    expect(where.deletedAt).toBeNull();
  });

  it('las TRES consultas de pacientes llevan alcance, no solo la primera', async () => {
    // El fallo original no fue olvidar filtrar en un sitio: fue filtrar en unos
    // y no en otros. Por eso el alcance se resuelve una vez y se aplica a todas.
    for (const tipo of ['patient_attendance', 'treatment_adherence', 'patient_evolution'] as const) {
      patientFindMany.mockClear();
      await generateReport(tipo, 'all');

      const where = patientFindMany.mock.calls[0][0].where;
      expect(where.userId).toBe('medico-1');
      expect(where.deletedAt).toBeNull();
    }
  });

  it('los tests se acotan por su paciente: la frontera se cruza por la relacion', async () => {
    // BiophysicsTest y OmicTransaction no tienen tenantId propio.
    await generateReport('ri_bio', 'all');

    expect(biophysicsFindMany.mock.calls[0][0].where.patient).toMatchObject({
      deletedAt: null,
      userId: 'medico-1',
    });
    expect(omicFindMany.mock.calls[0][0].where.patient).toMatchObject({
      deletedAt: null,
      userId: 'medico-1',
    });
  });

  it('las metricas de la analitica cuentan solo los pacientes propios', async () => {
    await generateReport('professional_analytics', 'all');

    for (const llamada of patientCount.mock.calls) {
      expect(llamada[0].where.userId).toBe('medico-1');
      expect(llamada[0].where.deletedAt).toBeNull();
    }
    expect(patientGroupBy.mock.calls[0][0].where).toMatchObject({
      deletedAt: null,
      userId: 'medico-1',
    });
  });

  it('la media de adherencia exige alcance Y consentimiento a la vez', async () => {
    await generateReport('professional_analytics', 'all');

    expect(omicAggregate.mock.calls[0][0].where.patient).toMatchObject({
      deletedAt: null,
      userId: 'medico-1',
      shareDataConsent: true,
    });
  });

  it('si la adherencia falla, se informa 0 en lugar de medir sin consentimiento', async () => {
    // El codigo anterior reintentaba la consulta SIN el filtro de
    // consentimiento y lo llamaba "Anonymous Mode".
    omicAggregate.mockRejectedValue(new Error('relation does not exist'));

    const r = await generateReport('professional_analytics', 'all');

    expect(omicAggregate).toHaveBeenCalledTimes(1);
    expect((r.data as { avgAdherence: number }).avgAdherence).toBe(0);
  });

  it('el reporte de profesionales no lista la plantilla de otras clinicas', async () => {
    await generateReport('professional_performance', 'all');

    const where = userFindMany.mock.calls[0][0].where;
    expect(where.id).toBe('medico-1');
    expect(where.deletedAt).toBeNull();
  });
});

describe('generateReport — cota de tamano', () => {
  it('ninguna consulta de pacientes se trae la tabla entera', async () => {
    for (const tipo of ['patient_attendance', 'treatment_adherence', 'patient_evolution'] as const) {
      patientFindMany.mockClear();
      await generateReport(tipo, 'all');

      const args = patientFindMany.mock.calls[0][0];
      expect(typeof args.take).toBe('number');
      expect(args.take).toBeLessThanOrEqual(500);
    }
  });
});
