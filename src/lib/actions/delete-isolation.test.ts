import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Regresion del IDOR de borrado cruzado.
//
// La prueba que importa: pedir el borrado de un registro que pertenece a OTRO
// paciente, pasando un patientId al que si se tiene acceso. Con el codigo
// anterior el borrado se ejecutaba —validatePatientAccess aprobaba el patientId
// recibido y el delete iba por el id del registro, sin contrastarlos. Ahora se
// resuelve el dueno real antes de autorizar.

const validatePatientAccess = vi.fn();
const biophysicsFindUnique = vi.fn();
const biophysicsDelete = vi.fn();
const guideFindUnique = vi.fn();
const guideDelete = vi.fn();

vi.mock('@/lib/auth-guards', () => ({
  validatePatientAccess: (id: string) => validatePatientAccess(id),
  requireSession: () => Promise.resolve({ session: { user: { id: 'medico-1' } } }),
  // El codigo ya no usa validateTestAccess —se retiro— pero el mock la conserva
  // con el comportamiento que TENIA: delegar en validatePatientAccess ignorando
  // el testId. Sin esto, comprobar estas pruebas contra el codigo antiguo daba un
  // falso verde: la funcion salia undefined, reventaba, y el test pasaba por un
  // TypeError en vez de por haber bloqueado el borrado.
  validateTestAccess: (_testId: string, patientId: string) => validatePatientAccess(patientId),
}));

vi.mock('@/lib/db', () => ({
  prisma: {
    biophysicsTest: {
      findUnique: (a: unknown) => biophysicsFindUnique(a),
      delete: (a: unknown) => biophysicsDelete(a),
    },
    patientGuide: {
      findUnique: (a: unknown) => guideFindUnique(a),
      delete: (a: unknown) => guideDelete(a),
    },
  },
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/services/notificationService', () => ({ getEmailProvider: vi.fn() }));
vi.mock('@react-email/render', () => ({ render: vi.fn() }));
vi.mock('@/components/emails/GuideEmailTemplate', () => ({ default: () => null }));

import { deleteBiophysicsTest } from './biophysics.actions';
import { deletePatientGuide } from './guide.actions';

const MIO = 'paciente-mio';
const AJENO = 'paciente-ajeno';
const REGISTRO = 'registro-1';

beforeEach(() => {
  // El guard aprueba: quien llama SÍ tiene acceso legítimo a `MIO`.
  // Es el escenario realista del ataque, no un guard roto.
  validatePatientAccess.mockReset().mockResolvedValue({ session: { user: { id: 'medico-1' } } });
  biophysicsFindUnique.mockReset();
  biophysicsDelete.mockReset().mockResolvedValue({});
  guideFindUnique.mockReset();
  guideDelete.mockReset().mockResolvedValue({});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('deleteBiophysicsTest', () => {
  it('NO borra un test de otro paciente aunque se pase un patientId propio', async () => {
    biophysicsFindUnique.mockResolvedValue({ patientId: AJENO });

    const r = await deleteBiophysicsTest(REGISTRO, MIO);

    expect(r.success).toBe(false);
    expect(biophysicsDelete).not.toHaveBeenCalled();
  });

  it('autoriza sobre el dueño real del test, no sobre el patientId recibido', async () => {
    biophysicsFindUnique.mockResolvedValue({ patientId: MIO });

    await deleteBiophysicsTest(REGISTRO, MIO);

    expect(validatePatientAccess).toHaveBeenCalledWith(MIO);
  });

  it('resuelve el registro ANTES de autorizar', async () => {
    biophysicsFindUnique.mockResolvedValue({ patientId: AJENO });
    await deleteBiophysicsTest(REGISTRO, MIO);
    // Con el patrón vulnerable se autorizaba primero y se borraba después;
    // aquí el guard no llega a llamarse porque el desajuste corta antes.
    expect(biophysicsFindUnique).toHaveBeenCalled();
    expect(validatePatientAccess).not.toHaveBeenCalled();
  });

  it('un test inexistente no llega al borrado', async () => {
    biophysicsFindUnique.mockResolvedValue(null);
    const r = await deleteBiophysicsTest(REGISTRO, MIO);
    expect(r.success).toBe(false);
    expect(biophysicsDelete).not.toHaveBeenCalled();
  });

  it('el caso legítimo sigue funcionando: borrar un test propio', async () => {
    biophysicsFindUnique.mockResolvedValue({ patientId: MIO });
    const r = await deleteBiophysicsTest(REGISTRO, MIO);
    expect(r.success).toBe(true);
    expect(biophysicsDelete).toHaveBeenCalledWith({ where: { id: REGISTRO } });
  });

  it('si el guard deniega, no se borra', async () => {
    biophysicsFindUnique.mockResolvedValue({ patientId: MIO });
    validatePatientAccess.mockRejectedValue(new Error('FORBIDDEN: Acceso denegado'));
    const r = await deleteBiophysicsTest(REGISTRO, MIO);
    expect(r.success).toBe(false);
    expect(biophysicsDelete).not.toHaveBeenCalled();
  });
});

describe('deletePatientGuide', () => {
  it('NO borra la guía de otro paciente aunque se pase un patientId propio', async () => {
    guideFindUnique.mockResolvedValue({ patientId: AJENO });

    const r = await deletePatientGuide(REGISTRO, MIO);

    expect(r.success).toBe(false);
    expect(guideDelete).not.toHaveBeenCalled();
  });

  it('autoriza sobre el dueño real de la guía', async () => {
    guideFindUnique.mockResolvedValue({ patientId: MIO });
    await deletePatientGuide(REGISTRO, MIO);
    expect(validatePatientAccess).toHaveBeenCalledWith(MIO);
  });

  it('una guía inexistente no llega al borrado', async () => {
    guideFindUnique.mockResolvedValue(null);
    const r = await deletePatientGuide(REGISTRO, MIO);
    expect(r.success).toBe(false);
    expect(guideDelete).not.toHaveBeenCalled();
  });

  it('faltando parámetros no se consulta nada', async () => {
    const r = await deletePatientGuide('', MIO);
    expect(r.success).toBe(false);
    expect(guideFindUnique).not.toHaveBeenCalled();
  });

  it('el caso legítimo sigue funcionando: borrar una guía propia', async () => {
    guideFindUnique.mockResolvedValue({ patientId: MIO });
    const r = await deletePatientGuide(REGISTRO, MIO);
    expect(r.success).toBe(true);
    expect(guideDelete).toHaveBeenCalledWith({ where: { id: REGISTRO } });
  });

  it('si el guard deniega, no se borra', async () => {
    guideFindUnique.mockResolvedValue({ patientId: MIO });
    validatePatientAccess.mockRejectedValue(new Error('FORBIDDEN: Acceso denegado'));
    const r = await deletePatientGuide(REGISTRO, MIO);
    expect(r.success).toBe(false);
    expect(guideDelete).not.toHaveBeenCalled();
  });
});
