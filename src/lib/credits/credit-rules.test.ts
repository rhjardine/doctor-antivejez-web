import { describe, it, expect } from 'vitest';
import {
  quienPagaElCredito,
  requiereCredito,
  esChoqueDeSerializacion,
  esperaDeReintento,
  mensajeSinSaldo,
  REINTENTOS_MAXIMOS,
} from './credit-rules';

describe('quienPagaElCredito', () => {
  it('paga el profesional que actúa, no el dueño del paciente', () => {
    // El fallo original: se debitaba a `patient.user.id` mientras el test se
    // guardaba con `doctorId: session.user.id`. El registro decía «lo hice yo»
    // y el crédito salía del saldo de otro.
    expect(quienPagaElCredito({ id: 'medico-que-actua', role: 'MEDICO' }))
      .toBe('medico-que-actua');
  });

  it('no depende del rol', () => {
    for (const rol of ['ADMIN', 'MEDICO', 'COACH', null, undefined]) {
      expect(quienPagaElCredito({ id: 'u1', role: rol })).toBe('u1');
    }
  });
});

describe('requiereCredito', () => {
  // ─── EL INVARIANTE QUE PROTEGE AL MÉDICO EN PRODUCCIÓN ──────────────────
  //
  // Hoy su consumo es cero porque es ADMIN y es dueño de los pacientes. Con la
  // regla nueva sigue siendo cero porque sigue siendo ADMIN. Si esta prueba
  // cae, significa que el arreglo empezaría a cobrarle, y con saldo a cero no
  // podría guardar un test biofísico: la función que más usa.
  it('un ADMIN NUNCA consume crédito', () => {
    expect(requiereCredito({ id: 'admin-1', role: 'ADMIN' })).toBe(false);
  });

  it('los demás roles sí consumen', () => {
    for (const rol of ['MEDICO', 'COACH', 'ADMINISTRATIVO']) {
      expect(requiereCredito({ id: 'u1', role: rol })).toBe(true);
    }
  });

  it('mira el rol de QUIEN ACTÚA, no el del dueño del paciente', () => {
    // Antes era `patient.user.role !== 'ADMIN'`, así que los pacientes cuyo
    // dueño es el administrador salían gratis para cualquiera que los abriera.
    // La función ni siquiera recibe al dueño: no se puede volver a consultar.
    const actorMedico = { id: 'medico-1', role: 'MEDICO' };
    expect(requiereCredito(actorMedico)).toBe(true);
  });

  it('un rol ausente o desconocido consume: el fallo va al lado conservador', () => {
    // Cobrar de más se ve y se corrige; regalar tests en silencio, no.
    expect(requiereCredito({ id: 'u1', role: null })).toBe(true);
    expect(requiereCredito({ id: 'u1', role: undefined })).toBe(true);
    expect(requiereCredito({ id: 'u1', role: 'ROL_NUEVO' })).toBe(true);
  });

  it('no se confunde con mayúsculas distintas', () => {
    // 'admin' en minúscula no es el rol ADMIN del esquema.
    expect(requiereCredito({ id: 'u1', role: 'admin' })).toBe(true);
  });
});

describe('esChoqueDeSerializacion', () => {
  it('reconoce el código de Prisma', () => {
    expect(esChoqueDeSerializacion({ code: 'P2034' })).toBe(true);
  });

  it('reconoce los códigos de PostgreSQL', () => {
    expect(esChoqueDeSerializacion({ code: '40001' })).toBe(true);
    expect(esChoqueDeSerializacion({ code: '40P01' })).toBe(true);
  });

  it('lo encuentra también dentro del mensaje', () => {
    const e = new Error('Transaction failed: P2034 write conflict');
    expect(esChoqueDeSerializacion(e)).toBe(true);
  });

  it('NO reintenta un error que no es de choque', () => {
    // Reintentar «créditos insuficientes» tres veces sería absurdo, y
    // reintentar un fallo de validación podría duplicar un test.
    expect(esChoqueDeSerializacion(new Error('Créditos insuficientes'))).toBe(false);
    expect(esChoqueDeSerializacion({ code: 'P2002' })).toBe(false);
    expect(esChoqueDeSerializacion({ code: 'P2025' })).toBe(false);
  });

  it('aguanta lo que no es un error', () => {
    expect(esChoqueDeSerializacion(null)).toBe(false);
    expect(esChoqueDeSerializacion(undefined)).toBe(false);
    expect(esChoqueDeSerializacion('P2034')).toBe(false);
    expect(esChoqueDeSerializacion(42)).toBe(false);
  });
});

describe('esperaDeReintento', () => {
  it('crece con cada intento', () => {
    const sinAzar = (i: number) => esperaDeReintento(i, 0);
    expect(sinAzar(2)).toBeGreaterThan(sinAzar(1));
    expect(sinAzar(3)).toBeGreaterThan(sinAzar(2));
  });

  it('lleva azar: dos transacciones no vuelven a chocar a la vez', () => {
    // Sin esto, las dos perdedoras reintentarían en el mismo instante y
    // chocarían de nuevo, indefinidamente.
    expect(esperaDeReintento(1, 0)).not.toBe(esperaDeReintento(1, 1));
  });

  it('nunca es negativa ni absurda', () => {
    for (const i of [0, 1, 2, 3]) {
      const espera = esperaDeReintento(i, 1);
      expect(espera).toBeGreaterThanOrEqual(0);
      expect(espera).toBeLessThan(1000);
    }
  });
});

describe('mensajeSinSaldo', () => {
  it('dice el tipo y el saldo, para que el administrador sepa qué recargar', () => {
    const m = mensajeSinSaldo('Biofísica', 0);
    expect(m).toContain('Biofísica');
    expect(m).toContain('0');
  });
});

describe('REINTENTOS_MAXIMOS', () => {
  it('reintenta, pero no para siempre', () => {
    expect(REINTENTOS_MAXIMOS).toBeGreaterThan(1);
    expect(REINTENTOS_MAXIMOS).toBeLessThanOrEqual(5);
  });
});
