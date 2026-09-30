import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Regresion de los cinco modulos de Server Actions que no comprobaban acceso.
//
// Una Server Action exportada es un endpoint HTTP publico. Estas cinco se podian
// invocar sin sesion, o con sesion de cualquiera, sobre el paciente que se
// quisiera:
//
//   ai.actions            resumen clinico con IA de cualquier paciente
//   lab-report.actions    inyectar un GeneticTest en una historia ajena
//   nutrition.actions     `patient.update` sobre la fila de cualquier paciente
//   campaigns.actions     SMS/WhatsApp/email masivos a destinatarios arbitrarios
//   historias/[id]        plan alimentario de cualquier paciente (solo `if (!session)`)
//
// Cada prueba de aqui falla contra el codigo anterior.

const validatePatientAccess = vi.fn();
const requireSession = vi.fn();

const patientFindUnique = vi.fn();
const patientFindMany = vi.fn();
const patientUpdate = vi.fn();
const labReportFindUnique = vi.fn();
const labReportFindMany = vi.fn();
const labReportUpdate = vi.fn();
const geneticCreate = vi.fn();
const alimentacionUpsert = vi.fn();
const alimentacionUpdate = vi.fn();
const getServerSession = vi.fn();
const openaiCreate = vi.fn();
const campaignCreate = vi.fn();
const aiAnalysisCreate = vi.fn();
const foodItemFindMany = vi.fn();
const transaction = vi.fn();

vi.mock('@/lib/auth-guards', async () => {
  // AUTH_ERRORS es real: los mensajes de error se derivan de el, y si se
  // simulara, la traduccion se probaria contra codigos inventados.
  const real = await vi.importActual<typeof import('@/lib/auth-guards')>('@/lib/auth-guards');
  return {
    AUTH_ERRORS: real.AUTH_ERRORS,
    validatePatientAccess: (id: string) => validatePatientAccess(id),
    requireSession: () => requireSession(),
  };
});

// El cliente se construye DENTRO de la factoria, no en una constante de nivel
// superior: `vi.mock` se eleva por encima de las declaraciones, pero los
// `import` se elevan mas arriba todavia, asi que una constante declarada aqui
// aun no existe cuando el modulo bajo prueba pide '@/lib/db'. Los `vi.fn()` de
// arriba si valen porque la factoria solo los envuelve; se llaman despues.
vi.mock('@/lib/db', () => {
  const cliente = {
    patient: {
      findUnique: (a: unknown) => patientFindUnique(a),
      findMany: (a: unknown) => patientFindMany(a),
      update: (a: unknown) => patientUpdate(a),
    },
    labReport: {
      findUnique: (a: unknown) => labReportFindUnique(a),
      findMany: (a: unknown) => labReportFindMany(a),
      update: (a: unknown) => labReportUpdate(a),
    },
    geneticTest: { create: (a: unknown) => geneticCreate(a) },
    alimentacionNutrigenomica: {
      upsert: (a: unknown) => alimentacionUpsert(a),
      update: (a: unknown) => alimentacionUpdate(a),
    },
    campaign: {
      create: (a: unknown) => campaignCreate(a),
      update: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    campaignMessage: { createMany: vi.fn() },
    aIAnalysis: { create: (a: unknown) => aiAnalysisCreate(a) },
    foodItem: { findMany: (a: unknown) => foodItemFindMany(a), createMany: vi.fn() },
    generalGuideItem: { findMany: vi.fn().mockResolvedValue([]) },
    wellnessKey: { findMany: vi.fn().mockResolvedValue([]) },
    foodPlan: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    $transaction: (cb: unknown) => transaction(cb),
  };
  return { prisma: cliente, db: cliente };
});

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

// `getServerSession` DEVUELVE una sesion valida a proposito.
//
// Es lo que hace honesta la comprobacion contra el codigo anterior. Sin este
// mock, `historias/[id]/actions` reventaba con «headers was called outside a
// request scope» y las pruebas pasaban en VERDE contra el codigo vulnerable: no
// porque el guard bloqueara, sino por una excepcion de infraestructura. Con la
// sesion resuelta, el `if (!session)` antiguo se supera —que es justo su
// defecto: comprobaba autenticacion, no pertenencia— y la escritura se intenta.
//
// La implementacion se fija en `beforeEach`, no aqui: `vi.restoreAllMocks()`
// deja sin implementacion los `vi.fn()` creados dentro de una factoria, y a
// partir del segundo test volvian a devolver undefined —con el mismo falso verde
// de vuelta, solo mas dificil de ver.
vi.mock('next-auth', () => ({ getServerSession: () => getServerSession() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/openai', () => ({
  default: { chat: { completions: { create: (a: unknown) => openaiCreate(a) } } },
}));
vi.mock('@/lib/services/notificationService', () => ({
  getSmsProvider: vi.fn(),
  getEmailProvider: vi.fn(),
  getWhatsAppProvider: vi.fn(),
}));

import { generateClinicalSummary } from './ai.actions';
import { getLabReports, validateLabReport } from './lab-report.actions';
import { savePatientNutritionPlan, getFullNutritionData } from './nutrition.actions';
import { sendCampaign } from './campaigns.actions';
import { saveAlimentacion, sendAlimentacionToPWA } from '../../app/(dashboard)/historias/[id]/actions';
import { AUTH_ERRORS } from '@/lib/auth-guards';
import { MENSAJE_SIN_ACCESO } from '@/lib/scope/access-errors';
// El cliente ya simulado, para que la transaccion ejecute su callback con el
// mismo objeto que ve el codigo bajo prueba.
import { prisma as clienteSimulado } from '@/lib/db';

const MIO = 'paciente-mio';
const AJENO = 'paciente-ajeno';
const SESION = { session: { user: { id: 'medico-1', role: 'MEDICO', tenantId: null } } };

beforeEach(() => {
  validatePatientAccess.mockReset().mockResolvedValue(SESION);
  requireSession.mockReset().mockResolvedValue(SESION);

  patientFindUnique.mockReset().mockResolvedValue(null);
  patientFindMany.mockReset().mockResolvedValue([]);
  patientUpdate.mockReset().mockResolvedValue({});
  labReportFindUnique.mockReset().mockResolvedValue(null);
  labReportFindMany.mockReset().mockResolvedValue([]);
  labReportUpdate.mockReset().mockResolvedValue({});
  geneticCreate.mockReset().mockResolvedValue({});
  alimentacionUpsert.mockReset().mockResolvedValue({});
  alimentacionUpdate.mockReset().mockResolvedValue({});
  campaignCreate.mockReset().mockResolvedValue({ id: 'camp-1' });
  aiAnalysisCreate.mockReset().mockResolvedValue({});
  foodItemFindMany.mockReset().mockResolvedValue([]);
  // Sesion valida y OpenAI respondiendo: el codigo antiguo debe llegar hasta la
  // escritura para que bloquearla signifique algo.
  getServerSession.mockReset().mockResolvedValue({ user: { id: 'medico-1', role: 'MEDICO' } });
  openaiCreate.mockReset().mockResolvedValue({ choices: [{ message: { content: 'resumen' } }] });
  // La transaccion ejecuta el callback con el mismo cliente simulado.
  transaction.mockReset().mockImplementation((cb: any) => cb(clienteSimulado));

  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

const denegar = () => validatePatientAccess.mockRejectedValue(new Error(AUTH_ERRORS.FORBIDDEN));
const sinSesion = () => {
  const e = new Error(AUTH_ERRORS.UNAUTHORIZED);
  validatePatientAccess.mockRejectedValue(e);
  requireSession.mockRejectedValue(e);
};

describe('ai.actions — generateClinicalSummary', () => {
  it('sin acceso al paciente no se leen sus datos clínicos', async () => {
    denegar();

    const r = await generateClinicalSummary(AJENO);

    expect(r.success).toBe(false);
    // Lo que importa: el guard corta ANTES de la consulta. Los datos del
    // paciente ajeno no llegan ni a cargarse en memoria.
    expect(patientFindUnique).not.toHaveBeenCalled();
  });

  it('sin acceso no se llama a OpenAI ni se guarda el análisis', async () => {
    // El paciente ajeno SÍ existe y SÍ tiene datos clínicos. Sin esto la prueba
    // pasaba en verde contra el código vulnerable, porque el paciente simulado
    // salía null y la acción se detenía en «Paciente no encontrado» — verificaba
    // ese atajo, no el guard.
    patientFindUnique.mockResolvedValue({
      id: AJENO,
      chronologicalAge: 50,
      gender: 'MASCULINO',
      biophysicsTests: [{ biologicalAge: 45, testDate: new Date('2026-01-01') }],
      biochemistryTests: [],
      orthomolecularTests: [],
      guides: [],
    });
    denegar();

    await generateClinicalSummary(AJENO);

    expect(aiAnalysisCreate).not.toHaveBeenCalled();
  });

  it('autoriza sobre el paciente que se pide', async () => {
    patientFindUnique.mockResolvedValue(null);
    await generateClinicalSummary(MIO);
    expect(validatePatientAccess).toHaveBeenCalledWith(MIO);
  });

  it('un fallo de permisos no se presenta como avería de la IA', async () => {
    // «Inténtelo de nuevo más tarde» mandaría a reintentar algo imposible.
    denegar();
    const r = await generateClinicalSummary(AJENO);
    expect(r.error).toBe(MENSAJE_SIN_ACCESO);
    expect(r.error).not.toMatch(/IA|inténtelo/i);
  });
});

describe('lab-report.actions — getLabReports', () => {
  it('sin acceso no devuelve los informes', async () => {
    denegar();

    const r = await getLabReports(AJENO);

    expect(r.success).toBe(false);
    expect(labReportFindMany).not.toHaveBeenCalled();
  });
});

describe('lab-report.actions — validateLabReport', () => {
  const DATOS = { reportType: 'TELOTEST', estimatedBiologicalAge: 40 };

  it('NO escribe en una historia ajena aunque se pase un patientId propio', async () => {
    // El ataque real: el informe pertenece a AJENO, se declara MIO.
    labReportFindUnique.mockResolvedValue({ patientId: AJENO });

    const r = await validateLabReport('informe-1', DATOS, MIO, '2026-01-01', 45);

    expect(r.success).toBe(false);
    expect(geneticCreate).not.toHaveBeenCalled();
    expect(labReportUpdate).not.toHaveBeenCalled();
  });

  it('resuelve el dueño real del informe ANTES de autorizar', async () => {
    labReportFindUnique.mockResolvedValue({ patientId: AJENO });

    await validateLabReport('informe-1', DATOS, MIO, '2026-01-01', 45);

    expect(labReportFindUnique).toHaveBeenCalled();
    // El desajuste corta antes: el guard no llega a consultarse.
    expect(validatePatientAccess).not.toHaveBeenCalled();
  });

  it('un informe inexistente no llega a ninguna escritura', async () => {
    labReportFindUnique.mockResolvedValue(null);

    const r = await validateLabReport('no-existe', DATOS, MIO, '2026-01-01', 45);

    expect(r.success).toBe(false);
    expect(labReportUpdate).not.toHaveBeenCalled();
    expect(geneticCreate).not.toHaveBeenCalled();
  });

  it('si el guard deniega, no se marca el informe como validado', async () => {
    labReportFindUnique.mockResolvedValue({ patientId: MIO });
    denegar();

    const r = await validateLabReport('informe-1', DATOS, MIO, '2026-01-01', 45);

    expect(r.success).toBe(false);
    expect(labReportUpdate).not.toHaveBeenCalled();
  });

  it('las dos escrituras van en una transacción', async () => {
    // Sin esto, un fallo del `create` dejaba el informe validado sin el test.
    labReportFindUnique.mockResolvedValue({ patientId: MIO });

    await validateLabReport('informe-1', DATOS, MIO, '2026-01-01', 45);

    expect(transaction).toHaveBeenCalled();
  });

  it('el mensaje de error interno no viaja al cliente', async () => {
    labReportFindUnique.mockResolvedValue({ patientId: MIO });
    labReportUpdate.mockRejectedValue(new Error('P2002 Unique constraint failed on patients.tenantId'));

    const r = await validateLabReport('informe-1', DATOS, MIO, '2026-01-01', 45);

    expect(r.success).toBe(false);
    expect(r.error).not.toMatch(/tenantId|P2002/);
  });
});

describe('nutrition.actions', () => {
  it('savePatientNutritionPlan no toca la fila de un paciente ajeno', async () => {
    denegar();

    const r = await savePatientNutritionPlan(AJENO, {} as never, []);

    expect(r.success).toBe(false);
    expect(patientUpdate).not.toHaveBeenCalled();
    // El guard va antes de abrir la transacción.
    expect(transaction).not.toHaveBeenCalled();
  });

  it('savePatientNutritionPlan autoriza sobre el paciente recibido', async () => {
    await savePatientNutritionPlan(MIO, {} as never, []);
    expect(validatePatientAccess).toHaveBeenCalledWith(MIO);
  });

  it('getFullNutritionData exige sesión aunque sea sólo el catálogo', async () => {
    sinSesion();

    const r = await getFullNutritionData();

    expect(r.success).toBe(false);
    expect(foodItemFindMany).not.toHaveBeenCalled();
  });
});

describe('historias/[id]/actions', () => {
  it('saveAlimentacion no escribe el plan de un paciente ajeno', async () => {
    denegar();

    await expect(
      saveAlimentacion({ patientId: AJENO, grupoSanguineo: 'O+', nino: false, metabolica: false, antidiabetica: false, citostatica: false, renal: false })
    ).rejects.toThrow();

    expect(alimentacionUpsert).not.toHaveBeenCalled();
  });

  it('saveAlimentacion comprueba el paciente, no sólo que haya sesión', async () => {
    // `if (!session)` dejaba pasar a cualquier usuario autenticado, incluido un
    // coach de otra clínica, hacia cualquier paciente.
    await saveAlimentacion({ patientId: MIO, grupoSanguineo: 'O+', nino: false, metabolica: false, antidiabetica: false, citostatica: false, renal: false });

    expect(validatePatientAccess).toHaveBeenCalledWith(MIO);
  });

  it('sendAlimentacionToPWA no marca como enviado el plan de un paciente ajeno', async () => {
    denegar();

    await expect(sendAlimentacionToPWA({ patientId: AJENO })).rejects.toThrow();

    expect(alimentacionUpdate).not.toHaveBeenCalled();
  });
});

// Estas dos NO fallan contra el codigo anterior, y no pretenden hacerlo: son
// guardias del camino legitimo. Van aparte para que nadie las lea como prueba de
// que el agujero estaba abierto.
describe('validateLabReport — el camino legítimo no se rompe', () => {
  const DATOS = { reportType: 'TELOTEST', estimatedBiologicalAge: 40 };

  it('valida el informe propio y crea el test', async () => {
    labReportFindUnique.mockResolvedValue({ patientId: MIO });

    const r = await validateLabReport('informe-1', DATOS, MIO, '2026-01-01', 45);

    expect(r.success).toBe(true);
    expect(validatePatientAccess).toHaveBeenCalledWith(MIO);
  });

  it('el test se escribe sobre el dueño del informe', async () => {
    labReportFindUnique.mockResolvedValue({ patientId: MIO });

    await validateLabReport('informe-1', DATOS, MIO, '2026-01-01', 45);

    expect(geneticCreate.mock.calls[0][0].data.patientId).toBe(MIO);
  });
});

describe('campaigns.actions — sendCampaign', () => {
  const MENSAJE = 'Recordatorio de consulta';

  it('sin sesión no se crea la campaña ni se envía nada', async () => {
    sinSesion();

    const r = await sendCampaign([{ id: MIO } as never], ['SMS'], MENSAJE, 'Campaña', null);

    expect(r.success).toBe(false);
    expect(campaignCreate).not.toHaveBeenCalled();
  });

  it('el destino NO es el que manda el cliente: se lee de la base', async () => {
    // Éste es el núcleo del agujero: `phone` venía dentro de `contacts`.
    patientFindMany.mockResolvedValue([
      { id: MIO, firstName: 'Ana', lastName: 'Pérez', email: 'ana@ejemplo.test', phone: '+58000000000' },
    ]);

    const r = await sendCampaign(
      [{ id: MIO, name: 'Quien sea', email: 'atacante@ejemplo.test', phone: '+99999999999' } as never],
      ['SMS'],
      MENSAJE,
      'Campaña',
      null
    );

    expect(r.success).toBe(true);
    // La consulta se hace por identificador, dentro del alcance del profesional.
    const args = patientFindMany.mock.calls[0][0];
    expect(args.where.id).toEqual({ in: [MIO] });
    expect(args.where.userId).toBe('medico-1');
    expect(args.where.deletedAt).toBeNull();
  });

  it('una selección con pacientes ajenos se rechaza entera', async () => {
    // No se envía «a los que sí»: la petición no es la del formulario legítimo.
    patientFindMany.mockResolvedValue([
      { id: MIO, firstName: 'Ana', lastName: 'Pérez', email: 'ana@ejemplo.test', phone: '+58000000000' },
    ]);

    const r = await sendCampaign(
      [{ id: MIO } as never, { id: AJENO } as never],
      ['SMS'],
      MENSAJE,
      'Campaña',
      null
    );

    expect(r.success).toBe(false);
    expect(campaignCreate).not.toHaveBeenCalled();
  });

  it('un número de teléfono suelto, sin paciente detrás, no se contacta', async () => {
    patientFindMany.mockResolvedValue([]);

    const r = await sendCampaign(
      [{ id: 'inventado', phone: '+99999999999' } as never],
      ['SMS'],
      MENSAJE,
      'Campaña',
      null
    );

    expect(r.success).toBe(false);
    expect(campaignCreate).not.toHaveBeenCalled();
  });

  it('sin identificadores válidos no se consulta ni se crea nada', async () => {
    const r = await sendCampaign([{ phone: '+99999999999' } as never], ['SMS'], MENSAJE, 'Campaña', null);

    expect(r.success).toBe(false);
    expect(patientFindMany).not.toHaveBeenCalled();
    expect(campaignCreate).not.toHaveBeenCalled();
  });

  it('totalContacts cuenta los destinatarios reales, no los pedidos', async () => {
    patientFindMany.mockResolvedValue([
      { id: MIO, firstName: 'Ana', lastName: 'Pérez', email: 'ana@ejemplo.test', phone: '' },
      { id: 'p2', firstName: 'Luis', lastName: 'Gómez', email: '', phone: '' },
    ]);

    await sendCampaign([{ id: MIO } as never, { id: 'p2' } as never], ['EMAIL'], MENSAJE, 'Campaña', null);

    // p2 no tiene por dónde recibir: contarlo dejaría un failedCount sin sentido.
    expect(campaignCreate.mock.calls[0][0].data.totalContacts).toBe(1);
  });
});
