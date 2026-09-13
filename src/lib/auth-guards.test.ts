import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Matriz de aislamiento sobre el codigo TAL COMO ESTA HOY.
//
// Estas pruebas no cambian comportamiento: lo registran. Varias documentan cosas
// que A4/A5 van a modificar a proposito —el bypass de ADMIN entre tenants, el
// fallback por propietario— para que ese cambio aparezca como un diff en un test
// en vez de descubrirse en produccion con un medico dentro.

const getServerSession = vi.fn();
const findUnique = vi.fn();

vi.mock('next-auth', () => ({ getServerSession: () => getServerSession() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/db', () => ({
  prisma: {
    patient: { findUnique: (args: unknown) => findUnique(args) },
    appointment: { findUnique: (args: unknown) => findUnique(args) },
  },
}));

import { validatePatientAccess, AUTH_ERRORS } from './auth-guards';

const PACIENTE = 'ckl1234567890abcdefghijk';

function sesion(over: Record<string, unknown> = {}) {
  return { user: { id: 'medico-1', role: 'MEDICO', tenantId: 'clinica-a', ...over } };
}
function paciente(over: Record<string, unknown> = {}) {
  return { userId: 'medico-1', tenantId: 'clinica-a', ...over };
}

beforeEach(() => {
  getServerSession.mockReset().mockResolvedValue(sesion());
  findUnique.mockReset().mockResolvedValue(paciente());
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('validatePatientAccess — validación de entrada', () => {
  it('un ID vacío falla antes de tocar la base de datos', async () => {
    await expect(validatePatientAccess('')).rejects.toThrow(AUTH_ERRORS.INVALID_ID);
    expect(findUnique).not.toHaveBeenCalled();
    expect(getServerSession).not.toHaveBeenCalled();
  });

  it('un ID absurdamente largo falla antes de tocar la base de datos', async () => {
    await expect(validatePatientAccess('x'.repeat(31))).rejects.toThrow(AUTH_ERRORS.INVALID_ID);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('cuidSchema NO valida formato CUID pese a su nombre: acepta cualquier cadena de 1 a 30', async () => {
    // Registrado, no corregido: es una cota de cordura contra entradas absurdas,
    // no una comprobación de formato. El nombre y el comentario prometen más.
    await expect(validatePatientAccess('no-es-un-cuid')).resolves.toBeDefined();
  });

  it('sin sesión válida se deniega sin consultar el paciente', async () => {
    getServerSession.mockResolvedValue(null);
    await expect(validatePatientAccess(PACIENTE)).rejects.toThrow(AUTH_ERRORS.UNAUTHORIZED);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('una sesión sin id de usuario tampoco vale', async () => {
    getServerSession.mockResolvedValue({ user: { role: 'ADMIN' } });
    await expect(validatePatientAccess(PACIENTE)).rejects.toThrow(AUTH_ERRORS.UNAUTHORIZED);
  });

  it('un paciente inexistente da NOT_FOUND', async () => {
    findUnique.mockResolvedValue(null);
    await expect(validatePatientAccess(PACIENTE)).rejects.toThrow(AUTH_ERRORS.NOT_FOUND);
  });

  it('la consulta de autorización no trae PHI, solo userId y tenantId', async () => {
    await validatePatientAccess(PACIENTE);
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: PACIENTE },
      select: { userId: true, tenantId: true },
    });
  });
});

describe('matriz rol × tenant × propiedad', () => {
  it('médico propietario del mismo tenant: concedido', async () => {
    await expect(validatePatientAccess(PACIENTE)).resolves.toBeDefined();
  });

  it('médico del mismo tenant que no es propietario: concedido', async () => {
    getServerSession.mockResolvedValue(sesion({ id: 'medico-2' }));
    await expect(validatePatientAccess(PACIENTE)).resolves.toBeDefined();
  });

  it('médico de OTRO tenant y no propietario: DENEGADO', async () => {
    getServerSession.mockResolvedValue(sesion({ id: 'medico-2', tenantId: 'clinica-b' }));
    await expect(validatePatientAccess(PACIENTE)).rejects.toThrow(AUTH_ERRORS.FORBIDDEN);
  });

  it('COACH de otro tenant y no propietario: DENEGADO', async () => {
    getServerSession.mockResolvedValue(sesion({ id: 'coach-1', role: 'COACH', tenantId: 'clinica-b' }));
    await expect(validatePatientAccess(PACIENTE)).rejects.toThrow(AUTH_ERRORS.FORBIDDEN);
  });

  it('la denegación se registra sin PHI: solo IDs opacos', async () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {});
    getServerSession.mockResolvedValue(sesion({ id: 'medico-2', tenantId: 'clinica-b' }));
    await expect(validatePatientAccess(PACIENTE)).rejects.toThrow();
    const registrado = aviso.mock.calls.flat().join(' ');
    expect(registrado).toContain('IDOR blocked');
    expect(registrado).toContain('medico-2');
  });
});

describe('comportamiento actual que A4/A5 van a cambiar', () => {
  it('ADMIN accede a un paciente de OTRO tenant del que no es propietario', async () => {
    // Hoy ADMIN es bypass global. A5 lo separa en DIRECTOR (dentro de su tenant)
    // y ADMIN (soporte de plataforma, sin PHI por defecto). Cuando eso llegue,
    // esta prueba debe cambiar, y ese cambio será visible.
    getServerSession.mockResolvedValue(sesion({ id: 'admin-1', role: 'ADMIN', tenantId: 'clinica-b' }));
    await expect(validatePatientAccess(PACIENTE)).resolves.toBeDefined();
  });

  it('ADMIN sin tenant alguno también accede', async () => {
    getServerSession.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN', tenantId: null } });
    await expect(validatePatientAccess(PACIENTE)).resolves.toBeDefined();
  });

  it('ser propietario concede acceso AUNQUE los tenant no coincidan', async () => {
    // Un médico que cambiara de clínica conservaría a sus pacientes antiguos.
    getServerSession.mockResolvedValue(sesion({ id: 'medico-1', tenantId: 'clinica-b' }));
    findUnique.mockResolvedValue(paciente({ userId: 'medico-1', tenantId: 'clinica-a' }));
    await expect(validatePatientAccess(PACIENTE)).resolves.toBeDefined();
  });

  it('con ambos tenantId en null el aislamiento descansa ENTERO en la propiedad', async () => {
    // Es el estado de hoy: A1 no ha corrido, así que tenantId es null en todas partes.
    getServerSession.mockResolvedValue(sesion({ id: 'medico-1', tenantId: null }));
    findUnique.mockResolvedValue(paciente({ userId: 'medico-1', tenantId: null }));
    await expect(validatePatientAccess(PACIENTE)).resolves.toBeDefined();

    // Mismo escenario, distinto propietario → denegado. Sin tenant, isOwner es lo único que queda.
    getServerSession.mockResolvedValue(sesion({ id: 'medico-2', tenantId: null }));
    await expect(validatePatientAccess(PACIENTE)).rejects.toThrow(AUTH_ERRORS.FORBIDDEN);
  });

  it('un tenant nulo en un lado no cuenta como coincidencia', async () => {
    getServerSession.mockResolvedValue(sesion({ id: 'medico-2', tenantId: null }));
    findUnique.mockResolvedValue(paciente({ userId: 'medico-1', tenantId: 'clinica-a' }));
    await expect(validatePatientAccess(PACIENTE)).rejects.toThrow(AUTH_ERRORS.FORBIDDEN);
  });
});
