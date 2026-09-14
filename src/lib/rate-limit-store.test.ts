/**
 * rate-limit-store.test.ts — A6: almacén conmutable del limitador
 *
 * La prueba que más importa es la de equivalencia: memoria y Redis deben
 * comportarse igual, porque de lo contrario un límite se comportaría distinto
 * con una instancia que con varias.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MemoryRateLimitStore,
  RedisRateLimitStore,
  redisEstaConfigurado,
  type RateLimitStore,
  type RedisLike,
} from './rate-limit-store';

/** Redis falso en memoria, con TTL, para probar RedisRateLimitStore sin red. */
function crearRedisFalso(): RedisLike & { avanzar(ms: number): void } {
  const claves = new Map<string, { valor: number; expiraEn: number | null }>();
  let ahora = 0;

  const vigente = (k: string) => {
    const e = claves.get(k);
    if (!e) return null;
    if (e.expiraEn !== null && ahora >= e.expiraEn) {
      claves.delete(k);
      return null;
    }
    return e;
  };

  return {
    async incr(key) {
      const e = vigente(key);
      if (!e) {
        claves.set(key, { valor: 1, expiraEn: null });
        return 1;
      }
      e.valor += 1;
      return e.valor;
    },
    async pexpire(key, ms) {
      const e = vigente(key);
      if (e) e.expiraEn = ahora + ms;
      return 1;
    },
    async pttl(key) {
      const e = vigente(key);
      if (!e) return -2;
      if (e.expiraEn === null) return -1;
      return e.expiraEn - ahora;
    },
    async del(key) {
      claves.delete(key);
      return 1;
    },
    avanzar(ms) {
      ahora += ms;
    },
  };
}

describe('MemoryRateLimitStore', () => {
  let store: MemoryRateLimitStore;
  beforeEach(() => {
    store = new MemoryRateLimitStore();
  });

  it('permite hasta el límite y bloquea el siguiente', async () => {
    for (let i = 1; i <= 3; i++) {
      const r = await store.hit('k', 3, 60_000);
      expect(r.success).toBe(true);
      expect(r.remaining).toBe(3 - i);
    }
    const bloqueado = await store.hit('k', 3, 60_000);
    expect(bloqueado.success).toBe(false);
    expect(bloqueado.remaining).toBe(0);
    expect(bloqueado.retryAfter).toBeGreaterThan(0);
  });

  it('aísla claves distintas', async () => {
    await store.hit('a', 1, 60_000);
    const otra = await store.hit('b', 1, 60_000);
    expect(otra.success).toBe(true);
  });

  it('reabre la ventana cuando expira', async () => {
    vi.useFakeTimers();
    try {
      await store.hit('k', 1, 1_000);
      expect((await store.hit('k', 1, 1_000)).success).toBe(false);
      vi.advanceTimersByTime(1_500);
      expect((await store.hit('k', 1, 1_000)).success).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('reset limpia el contador', async () => {
    await store.hit('k', 1, 60_000);
    expect((await store.hit('k', 1, 60_000)).success).toBe(false);
    await store.reset('k');
    expect((await store.hit('k', 1, 60_000)).success).toBe(true);
  });

  it('se identifica como memoria', () => {
    expect(store.kind).toBe('memory');
  });
});

describe('RedisRateLimitStore', () => {
  it('permite hasta el límite y bloquea el siguiente', async () => {
    const store = new RedisRateLimitStore(crearRedisFalso());
    for (let i = 1; i <= 3; i++) {
      expect((await store.hit('k', 3, 60_000)).success).toBe(true);
    }
    expect((await store.hit('k', 3, 60_000)).success).toBe(false);
  });

  it('reabre la ventana cuando expira el TTL', async () => {
    const redis = crearRedisFalso();
    const store = new RedisRateLimitStore(redis);
    await store.hit('k', 1, 1_000);
    expect((await store.hit('k', 1, 1_000)).success).toBe(false);
    redis.avanzar(1_500);
    expect((await store.hit('k', 1, 1_000)).success).toBe(true);
  });

  it('reset limpia el contador', async () => {
    const store = new RedisRateLimitStore(crearRedisFalso());
    await store.hit('k', 1, 60_000);
    expect((await store.hit('k', 1, 60_000)).success).toBe(false);
    await store.reset('k');
    expect((await store.hit('k', 1, 60_000)).success).toBe(true);
  });

  it('se identifica como redis', () => {
    expect(new RedisRateLimitStore(crearRedisFalso()).kind).toBe('redis');
  });
});

describe('equivalencia entre almacenes — invariante de A6', () => {
  const escenarios: [string, () => RateLimitStore][] = [
    ['memoria', () => new MemoryRateLimitStore()],
    ['redis', () => new RedisRateLimitStore(crearRedisFalso())],
  ];

  for (const [nombre, crear] of escenarios) {
    it(`${nombre}: la secuencia de éxito/bloqueo es idéntica`, async () => {
      const store = crear();
      const resultados: boolean[] = [];
      for (let i = 0; i < 6; i++) {
        resultados.push((await store.hit('misma', 4, 60_000)).success);
      }
      // Cuatro permitidos, dos bloqueados — igual en ambos almacenes.
      expect(resultados).toEqual([true, true, true, true, false, false]);
    });

    it(`${nombre}: remaining decrece de forma consistente`, async () => {
      const store = crear();
      expect((await store.hit('x', 3, 60_000)).remaining).toBe(2);
      expect((await store.hit('x', 3, 60_000)).remaining).toBe(1);
      expect((await store.hit('x', 3, 60_000)).remaining).toBe(0);
    });
  }
});

describe('redisEstaConfigurado', () => {
  it('falso sin variables de Upstash', () => {
    expect(redisEstaConfigurado({} as NodeJS.ProcessEnv)).toBe(false);
  });

  it('falso con solo una de las dos', () => {
    expect(redisEstaConfigurado({ UPSTASH_REDIS_REST_URL: 'u' } as any)).toBe(false);
    expect(redisEstaConfigurado({ UPSTASH_REDIS_REST_TOKEN: 't' } as any)).toBe(false);
  });

  it('cierto con ambas', () => {
    expect(
      redisEstaConfigurado({
        UPSTASH_REDIS_REST_URL: 'u',
        UPSTASH_REDIS_REST_TOKEN: 't',
      } as any),
    ).toBe(true);
  });
});
