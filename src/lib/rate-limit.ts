// src/lib/rate-limit.ts
// ============================================================================
// Motor de Throttling In-Memory (Zero Dependencies)
//
// Implementación nativa usando Map de Node.js con auto-expiración.
// NO requiere Redis, Upstash, ni ningún servicio externo.
//
// Limitación conocida: en arquitecturas multi-instancia (horizontal scaling),
// cada instancia mantiene su propio Map. Para un único Web Service en Render,
// esto es perfectamente adecuado y determinista.
// ============================================================================

import { NextResponse } from "next/server";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const DEFAULT_MAX_ATTEMPTS = 5;            // 5 intentos por ventana

// ── Limpieza periódica para evitar Memory Leaks ────────────────────────────
// Cada 5 minutos, eliminamos entradas cuya ventana ya expiró.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

if (typeof globalThis !== "undefined") {
  const g = globalThis as any;
  if (!g.__rateLimitCleanupStarted) {
    g.__rateLimitCleanupStarted = true;
    setInterval(() => {
      const now = Date.now();
      rateLimitMap.forEach((record, key) => {
        if (now > record.resetTime) {
          rateLimitMap.delete(key);
        }
      });
    }, CLEANUP_INTERVAL_MS).unref();
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Parsea un string de ventana como "15 m", "1 m", "10 s" a milisegundos */
function parseWindow(window: string): number {
  const match = window.trim().match(/^(\d+)\s*(s|m|h)$/i);
  if (!match) return DEFAULT_WINDOW_MS;
  const value = parseInt(match[1], 10);
  switch (match[2].toLowerCase()) {
    case "s": return value * 1000;
    case "m": return value * 60 * 1000;
    case "h": return value * 60 * 60 * 1000;
    default: return DEFAULT_WINDOW_MS;
  }
}

// ── Configuración ───────────────────────────────────────────────────────────

export interface RateLimitConfig {
  limit?: number;
  window?: string;
  prefix?: string;
}

// ── Core: checkRateLimitInternal ────────────────────────────────────────────

function checkRateLimitInternal(
  identifier: string,
  maxAttempts: number = DEFAULT_MAX_ATTEMPTS,
  windowMs: number = DEFAULT_WINDOW_MS
): { success: boolean; retryAfter?: number; remaining: number; limit: number; reset: number } {
  const now = Date.now();
  const key = identifier;
  const record = rateLimitMap.get(key);

  if (record) {
    if (now > record.resetTime) {
      // Ventana expirada → reiniciar
      const resetTime = now + windowMs;
      rateLimitMap.set(key, { count: 1, resetTime });
      return { success: true, remaining: maxAttempts - 1, limit: maxAttempts, reset: resetTime };
    }

    if (record.count >= maxAttempts) {
      // Excedió los intentos
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return { success: false, retryAfter, remaining: 0, limit: maxAttempts, reset: record.resetTime };
    }

    // Incrementar contador
    record.count += 1;
    rateLimitMap.set(key, record);
    return { success: true, remaining: maxAttempts - record.count, limit: maxAttempts, reset: record.resetTime };
  }

  // Primer intento
  const resetTime = now + windowMs;
  rateLimitMap.set(key, { count: 1, resetTime });
  return { success: true, remaining: maxAttempts - 1, limit: maxAttempts, reset: resetTime };
}

// ── API Pública: checkRateLimit (para API Routes) ──────────────────────────
// Firma compatible con los endpoints existentes (alma, genomic-extract, vcoach, etc.)
// Recibe Request, extrae IP, retorna NextResponse | null.

export async function checkRateLimit(
  req: Request,
  identifier?: string,
  config?: RateLimitConfig
): Promise<NextResponse | null> {
  const maxAttempts = config?.limit ?? 10;
  const windowMs = config?.window ? parseWindow(config.window) : 60 * 1000; // default 1 min para APIs
  const prefix = config?.prefix ?? "ratelimit:api";

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = identifier || forwarded?.split(",")[0]?.trim() || "anonymous";
  const key = `${prefix}:${ip}`;

  const result = checkRateLimitInternal(key, maxAttempts, windowMs);

  if (!result.success) {
    return new NextResponse(
      JSON.stringify({
        error: "Too Many Requests",
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": result.limit.toString(),
          "X-RateLimit-Remaining": result.remaining.toString(),
          "X-RateLimit-Reset": result.reset.toString(),
          "Retry-After": (result.retryAfter ?? 60).toString(),
        },
      }
    );
  }

  return null;
}

// ── API Pública: checkAuthRateLimit (para NextAuth authorize) ──────────────
// Firma compatible con auth.ts. Usa prefijos para aislar contadores por email/IP.

export async function checkAuthRateLimit(
  identifier: string,
  config?: RateLimitConfig
): Promise<{ blocked: false } | { blocked: true; retryAfterSeconds: number }> {
  const maxAttempts = config?.limit ?? DEFAULT_MAX_ATTEMPTS;
  const windowMs = config?.window ? parseWindow(config.window) : DEFAULT_WINDOW_MS;
  const prefix = config?.prefix ?? "ratelimit:auth";
  const key = `${prefix}:${identifier}`;

  const result = checkRateLimitInternal(key, maxAttempts, windowMs);

  if (!result.success) {
    return {
      blocked: true,
      retryAfterSeconds: result.retryAfter ?? 60,
    };
  }

  return { blocked: false };
}

// ── API Pública: resetRateLimit ─────────────────────────────────────────────

export function resetRateLimit(identifier: string) {
  rateLimitMap.delete(identifier);
}
