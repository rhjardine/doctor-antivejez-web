/**
 * rate-limit-store.ts — Almacén conmutable para el limitador de peticiones (A6)
 *
 * MOTIVO
 * El limitador contaba en un `Map` de memoria del proceso. Con una sola
 * instancia en Render eso es determinista, pero al escalar horizontalmente
 * cada instancia mantiene su propio contador y el límite efectivo se
 * multiplica por el número de instancias.
 *
 * Esta capa separa el ALGORITMO (ventana fija) del ALMACÉN (memoria o Redis),
 * de modo que pasar a multi-instancia sea configuración y no reescritura.
 *
 * INVARIANTE DELIBERADA
 * Ambos almacenes implementan la MISMA semántica de ventana fija. Se evita a
 * propósito delegar en el algoritmo de @upstash/ratelimit —que usa ventana
 * deslizante— porque cambiaría el comportamiento del sistema al activar Redis.
 * Un límite debe comportarse igual con una instancia que con cinco.
 *
 * SELECCIÓN
 * Sin variables de Upstash configuradas → memoria (comportamiento actual).
 * Con ellas → Redis. El módulo de Redis se importa de forma diferida: si no
 * está configurado, nunca se carga.
 */

export interface RateLimitResult {
  success: boolean;
  /** Intentos restantes en la ventana actual. */
  remaining: number;
  limit: number;
  /** Momento (epoch ms) en que la ventana se reinicia. */
  reset: number;
  /** Segundos hasta poder reintentar. Solo presente si `success` es false. */
  retryAfter?: number;
}

export interface RateLimitStore {
  /** Registra un intento y devuelve el estado resultante de la ventana. */
  hit(key: string, maxAttempts: number, windowMs: number): Promise<RateLimitResult>;
  /** Borra el contador de una clave. */
  reset(key: string): Promise<void>;
  /** Identificador del almacén activo, para diagnóstico. */
  readonly kind: 'memory' | 'redis';
}

// ─── Almacén en memoria (por defecto) ───────────────────────────────────────

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

export class MemoryRateLimitStore implements RateLimitStore {
  readonly kind = 'memory' as const;
  private readonly counters = new Map<string, { count: number; resetTime: number }>();

  constructor() {
    // Limpieza periódica de ventanas expiradas para evitar fugas de memoria.
    // `unref` evita que el temporizador mantenga vivo el proceso.
    if (typeof setInterval === 'function') {
      const timer = setInterval(() => this.purgeExpired(), CLEANUP_INTERVAL_MS);
      if (typeof (timer as any)?.unref === 'function') (timer as any).unref();
    }
  }

  private purgeExpired() {
    const now = Date.now();
    this.counters.forEach((registro, clave) => {
      if (now > registro.resetTime) this.counters.delete(clave);
    });
  }

  async hit(key: string, maxAttempts: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const registro = this.counters.get(key);

    // Sin registro, o con la ventana ya expirada: se abre una ventana nueva.
    if (!registro || now > registro.resetTime) {
      const reset = now + windowMs;
      this.counters.set(key, { count: 1, resetTime: reset });
      return { success: true, remaining: maxAttempts - 1, limit: maxAttempts, reset };
    }

    if (registro.count >= maxAttempts) {
      return {
        success: false,
        remaining: 0,
        limit: maxAttempts,
        reset: registro.resetTime,
        retryAfter: Math.ceil((registro.resetTime - now) / 1000),
      };
    }

    registro.count += 1;
    return {
      success: true,
      remaining: maxAttempts - registro.count,
      limit: maxAttempts,
      reset: registro.resetTime,
    };
  }

  async reset(key: string): Promise<void> {
    this.counters.delete(key);
  }
}

// ─── Almacén en Redis (multi-instancia) ─────────────────────────────────────

/** Contrato mínimo que se necesita de un cliente Redis. Facilita el testeo. */
export interface RedisLike {
  incr(key: string): Promise<number>;
  pexpire(key: string, ms: number): Promise<unknown>;
  pttl(key: string): Promise<number>;
  del(key: string): Promise<unknown>;
}

export class RedisRateLimitStore implements RateLimitStore {
  readonly kind = 'redis' as const;

  constructor(private readonly redis: RedisLike) {}

  async hit(key: string, maxAttempts: number, windowMs: number): Promise<RateLimitResult> {
    const count = await this.redis.incr(key);

    // El primer intento de la ventana fija su caducidad.
    if (count === 1) {
      await this.redis.pexpire(key, windowMs);
    }

    const ttl = await this.redis.pttl(key);
    // pttl devuelve -1 (sin caducidad) o -2 (clave inexistente) en casos límite.
    const restanteMs = ttl > 0 ? ttl : windowMs;
    const reset = Date.now() + restanteMs;

    if (count > maxAttempts) {
      return {
        success: false,
        remaining: 0,
        limit: maxAttempts,
        reset,
        retryAfter: Math.ceil(restanteMs / 1000),
      };
    }

    return { success: true, remaining: maxAttempts - count, limit: maxAttempts, reset };
  }

  async reset(key: string): Promise<void> {
    await this.redis.del(key);
  }
}

// ─── Selección del almacén ──────────────────────────────────────────────────

/** True si el entorno tiene configurado Upstash Redis. */
export function redisEstaConfigurado(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
}

let almacen: RateLimitStore | null = null;

/**
 * Devuelve el almacén activo, creándolo una sola vez.
 *
 * Si Redis está configurado pero falla al inicializarse, se cae a memoria en
 * lugar de dejar la aplicación sin limitador: un limitador degradado protege
 * más que ninguno.
 */
export async function getRateLimitStore(): Promise<RateLimitStore> {
  if (almacen) return almacen;

  if (redisEstaConfigurado()) {
    try {
      const { Redis } = await import('@upstash/redis');
      almacen = new RedisRateLimitStore(Redis.fromEnv() as unknown as RedisLike);
      console.info('[RateLimit] Almacén activo: Redis (multi-instancia)');
      return almacen;
    } catch (error) {
      console.error(
        '[RateLimit] Redis configurado pero no inicializable; se usa memoria:',
        (error as Error).message,
      );
    }
  }

  almacen = new MemoryRateLimitStore();
  return almacen;
}

/** Solo para pruebas: fuerza un almacén concreto. */
export function __setRateLimitStore(store: RateLimitStore | null): void {
  almacen = store;
}
