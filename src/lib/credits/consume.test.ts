import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

vi.mock('@/lib/db', () => ({ prisma: { $transaction: vi.fn() } }));

import { cobrarCredito } from './consume';

const RAIZ = process.cwd();

const agregado = vi.fn();
const crear = vi.fn();

/** Un doble del cliente de transacción con sólo lo que usa el cobro. */
const tx = () =>
  ({
    creditTransaction: { aggregate: agregado, create: crear },
  }) as never;

const DUENO = 'medico-dueno-del-paciente';
const ACTOR = 'medico-que-actua';

beforeEach(() => {
  agregado.mockReset().mockResolvedValue({ _sum: { amount: 5 } });
  crear.mockReset().mockResolvedValue({});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('cobrarCredito — el invariante que protege al médico en producción', () => {
  // Hoy su consumo es cero: es ADMIN y dueño de los 4154 pacientes heredados,
  // y la regla antigua miraba el rol del dueño. Con la regla nueva sigue siendo
  // cero porque sigue siendo ADMIN.
  //
  // Si esta prueba cae, el arreglo empezaría a cobrarle, y con saldo a cero no
  // podría guardar un test biofísico: la función que más usa.
  it('un ADMIN no consulta saldo ni descuenta nada', async () => {
    const r = await cobrarCredito(tx(), { id: 'admin-1', role: 'ADMIN' }, 'BIOFISICA', 'x');

    expect(r.cobrado).toBe(false);
    expect(agregado).not.toHaveBeenCalled();
    expect(crear).not.toHaveBeenCalled();
  });

  it('un ADMIN sin saldo tampoco se bloquea', async () => {
    agregado.mockResolvedValue({ _sum: { amount: 0 } });

    await expect(
      cobrarCredito(tx(), { id: 'admin-1', role: 'ADMIN' }, 'BIOFISICA', 'x')
    ).resolves.toEqual({ cobrado: false });
  });
});

describe('cobrarCredito — a quién se le cobra', () => {
  it('descuenta del profesional que ACTÚA, no del dueño del paciente', async () => {
    // El fallo original: `const doctorId = patient.user.id`. El test se
    // guardaba con `doctorId: session.user.id` mientras el crédito salía del
    // saldo de otro. Con varios profesionales en una clínica, uno podía vaciar
    // el saldo de un colega sin que ninguno se enterara.
    await cobrarCredito(tx(), { id: ACTOR, role: 'MEDICO' }, 'BIOFISICA', 'x');

    expect(agregado.mock.calls[0][0].where.userId).toBe(ACTOR);
    expect(crear.mock.calls[0][0].data.userId).toBe(ACTOR);
    expect(agregado.mock.calls[0][0].where.userId).not.toBe(DUENO);
  });

  it('consulta el saldo del tipo de test correcto', async () => {
    await cobrarCredito(tx(), { id: ACTOR, role: 'MEDICO' }, 'BIOQUIMICA', 'x');

    expect(agregado.mock.calls[0][0].where.testType).toBe('BIOQUIMICA');
    expect(crear.mock.calls[0][0].data.testType).toBe('BIOQUIMICA');
  });

  it('descuenta exactamente uno', async () => {
    await cobrarCredito(tx(), { id: ACTOR, role: 'MEDICO' }, 'BIOFISICA', 'x');
    expect(crear.mock.calls[0][0].data.amount).toBe(-1);
  });
});

describe('cobrarCredito — saldo', () => {
  it('sin saldo lanza, y NO descuenta', async () => {
    agregado.mockResolvedValue({ _sum: { amount: 0 } });

    await expect(
      cobrarCredito(tx(), { id: ACTOR, role: 'MEDICO' }, 'BIOFISICA', 'x')
    ).rejects.toThrow(/insuficientes/i);

    expect(crear).not.toHaveBeenCalled();
  });

  it('con saldo negativo tampoco deja pasar', async () => {
    agregado.mockResolvedValue({ _sum: { amount: -3 } });

    await expect(
      cobrarCredito(tx(), { id: ACTOR, role: 'MEDICO' }, 'BIOFISICA', 'x')
    ).rejects.toThrow(/insuficientes/i);
  });

  it('un agregado sin `_sum` se trata como sin saldo, no revienta', async () => {
    // Prisma declara `_sum` opcional. Leerlo sin cuidado daría un TypeError
    // dentro de la transacción, y el médico vería un error técnico en vez de
    // «no tiene créditos».
    agregado.mockResolvedValue({});

    await expect(
      cobrarCredito(tx(), { id: ACTOR, role: 'MEDICO' }, 'BIOFISICA', 'x')
    ).rejects.toThrow(/insuficientes/i);
  });

  it('con saldo exactamente 1 sí deja pasar', async () => {
    agregado.mockResolvedValue({ _sum: { amount: 1 } });

    await expect(
      cobrarCredito(tx(), { id: ACTOR, role: 'MEDICO' }, 'BIOFISICA', 'x')
    ).resolves.toEqual({ cobrado: true });
  });
});

// ─── Conexión: que los cinco sitios usen la misma pieza ──────────────────────
//
// Había CINCO lugares cobrando créditos con DOS implementaciones distintas.
// Estas pruebas fallan si alguno vuelve a tener la suya.

const SITIOS = [
  'src/lib/actions/biophysics.actions.ts',
  'src/lib/actions/biochemistry.actions.ts',
  'src/lib/actions/orthomolecular.actions.ts',
  'src/lib/actions/genetics.actions.ts',
  'src/lib/actions/nlr.actions.ts',
];

describe('los cinco sitios de cobro usan la pieza compartida', () => {
  it('ninguno decide la exención por el rol del DUEÑO del paciente', () => {
    for (const sitio of SITIOS) {
      const fuente = readFileSync(join(RAIZ, sitio), 'utf8');
      expect(fuente, sitio).not.toMatch(/patient\.user\.role\s*!==\s*'ADMIN'/);
      expect(fuente, sitio).not.toMatch(/doctor\.role\s*!==\s*'ADMIN'/);
    }
  });

  it('ninguno debita al dueño del paciente', () => {
    for (const sitio of SITIOS) {
      const fuente = readFileSync(join(RAIZ, sitio), 'utf8');
      expect(fuente, sitio).not.toMatch(/const doctorId = patient\.user\.id/);
    }
  });

  it('todos abren la transacción con el aislamiento correcto', () => {
    for (const sitio of SITIOS) {
      const fuente = readFileSync(join(RAIZ, sitio), 'utf8');
      expect(fuente, sitio).toContain('enTransaccionDeCredito');
      expect(fuente, sitio).toContain('cobrarCredito');
    }
  });

  it('el cobro y la creación del test van en la MISMA transacción', () => {
    // En `nlr.actions.ts` el crédito se consumía en una transacción aparte: si
    // el `create` fallaba después, el crédito quedaba gastado sin test.
    const fuente = readFileSync(join(RAIZ, 'src/lib/actions/nlr.actions.ts'), 'utf8');

    expect(fuente).not.toContain('consumeTestCredit');
    expect(fuente).toMatch(/enTransaccionDeCredito\(async \(tx\) => \{[\s\S]*?cobrarCredito[\s\S]*?tx\.nlrTest\.create/);
  });

  it('`consumeTestCredit` ya no promete un reintento que Prisma no hace', () => {
    const fuente = readFileSync(join(RAIZ, 'src/lib/actions/professionals.actions.ts'), 'utf8');

    expect(fuente).not.toMatch(/Prisma hará retry automático/);
    expect(fuente).toContain('conReintentoAnteChoque');
  });
});
