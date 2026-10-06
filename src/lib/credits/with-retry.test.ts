import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { conReintentoAnteChoque } from './with-retry';

const choque = () => Object.assign(new Error('write conflict'), { code: 'P2034' });

/** Una operación que falla las primeras `n` veces y luego funciona. */
function fallaLasPrimeras(n: number, error: () => Error = choque) {
  let llamadas = 0;
  const fn = async () => {
    llamadas++;
    if (llamadas <= n) throw error();
    return `exito en el intento ${llamadas}`;
  };
  return { fn, llamadas: () => llamadas };
}

const sinEsperar = { dormir: async () => {}, azar: () => 0 };

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('conReintentoAnteChoque', () => {
  it('si no hay choque, ejecuta una sola vez', async () => {
    const { fn, llamadas } = fallaLasPrimeras(0);

    await expect(conReintentoAnteChoque(fn, sinEsperar)).resolves.toContain('exito');
    expect(llamadas()).toBe(1);
  });

  it('reintenta ante un choque y acaba teniendo éxito', async () => {
    // Éste es el caso que el código anterior no cubría: declaraba Serializable
    // y confiaba en un reintento automático de Prisma que no existe.
    const { fn, llamadas } = fallaLasPrimeras(1);

    await expect(conReintentoAnteChoque(fn, sinEsperar)).resolves.toContain('exito');
    expect(llamadas()).toBe(2);
  });

  it('aguanta varios choques seguidos', async () => {
    const { fn, llamadas } = fallaLasPrimeras(2);

    await expect(conReintentoAnteChoque(fn, sinEsperar)).resolves.toBeTruthy();
    expect(llamadas()).toBe(3);
  });

  it('se rinde tras agotar los intentos, y lanza el último error', async () => {
    const { fn, llamadas } = fallaLasPrimeras(99);

    await expect(conReintentoAnteChoque(fn, { ...sinEsperar, intentos: 3 }))
      .rejects.toMatchObject({ code: 'P2034' });
    expect(llamadas()).toBe(3);
  });

  it('NO reintenta un error que no es de choque: sube de inmediato', async () => {
    // Reintentar «créditos insuficientes» tres veces sería absurdo, y
    // reintentar un fallo a medio camino podría duplicar un test.
    const { fn, llamadas } = fallaLasPrimeras(99, () => new Error('Créditos insuficientes'));

    await expect(conReintentoAnteChoque(fn, sinEsperar))
      .rejects.toThrow(/Créditos insuficientes/);
    expect(llamadas()).toBe(1);
  });

  it('no duerme después del último intento', async () => {
    // Esperar y acto seguido rendirse sólo retrasa el error que ve el médico.
    const dormir = vi.fn(async () => {});
    const { fn } = fallaLasPrimeras(99);

    await conReintentoAnteChoque(fn, { intentos: 3, dormir, azar: () => 0 }).catch(() => {});

    expect(dormir).toHaveBeenCalledTimes(2);
  });

  it('espera más en cada reintento', async () => {
    const esperas: number[] = [];
    const dormir = vi.fn(async (ms: number) => { esperas.push(ms); });
    const { fn } = fallaLasPrimeras(2);

    await conReintentoAnteChoque(fn, { dormir, azar: () => 0 });

    expect(esperas).toHaveLength(2);
    expect(esperas[1]).toBeGreaterThan(esperas[0]);
  });

  it('devuelve el valor de la operación, no uno inventado', async () => {
    const resultado = await conReintentoAnteChoque(async () => ({ id: 'test-1' }), sinEsperar);
    expect(resultado).toEqual({ id: 'test-1' });
  });

  it('un choque en el último intento posible aún se reintenta una vez más', async () => {
    const { fn, llamadas } = fallaLasPrimeras(1);
    await conReintentoAnteChoque(fn, { ...sinEsperar, intentos: 2 });
    expect(llamadas()).toBe(2);
  });
});
