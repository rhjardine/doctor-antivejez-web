// src/lib/rate-limit.ts
// ============================================================================
// Limitador de peticiones — algoritmo de ventana fija
//
// El ALMACÉN del contador vive en rate-limit-store.ts y es conmutable:
// memoria por defecto, Redis cuando el entorno lo configura. Este módulo solo
// aporta el algoritmo y la traducción a respuestas HTTP.
//
// La API pública (checkRateLimit, checkAuthRateLimit, resetRateLimit) no
// cambia: los 8 consumidores existentes siguen funcionando sin tocarse.
// ============================================================================

import { NextResponse } from "next/server";
import { getRateLimitStore } from "./rate-limit-store";

const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const DEFAULT_MAX_ATTEMPTS = 5;            // 5 intentos por ventana

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

/**
 * Extrae la IP del cliente de la cabecera x-forwarded-for.
 *
 * Se toma el primer valor, que es el cliente original; los siguientes son los
 * proxies intermedios.
 */
export function extraerIpCliente(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "anonymous";
}

// ── Configuración ───────────────────────────────────────────────────────────

export interface RateLimitConfig {
  limit?: number;
  window?: string;
  prefix?: string;
}

// ── API Pública: checkRateLimit (para API Routes) ──────────────────────────
// Recibe Request, extrae IP, retorna NextResponse (429) o null si hay margen.

export async function checkRateLimit(
  req: Request,
  identifier?: string,
  config?: RateLimitConfig
): Promise<NextResponse | null> {
  const maxAttempts = config?.limit ?? 10;
  const windowMs = config?.window ? parseWindow(config.window) : 60 * 1000; // default 1 min para APIs
  const prefix = config?.prefix ?? "ratelimit:api";

  const ip = identifier || extraerIpCliente(req);
  const key = `${prefix}:${ip}`;

  const store = await getRateLimitStore();
  const result = await store.hit(key, maxAttempts, windowMs);

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
// Usa prefijos para aislar contadores por email y por IP de forma independiente.

export async function checkAuthRateLimit(
  identifier: string,
  config?: RateLimitConfig
): Promise<{ blocked: false } | { blocked: true; retryAfterSeconds: number }> {
  const maxAttempts = config?.limit ?? DEFAULT_MAX_ATTEMPTS;
  const windowMs = config?.window ? parseWindow(config.window) : DEFAULT_WINDOW_MS;
  const prefix = config?.prefix ?? "ratelimit:auth";
  const key = `${prefix}:${identifier}`;

  const store = await getRateLimitStore();
  const result = await store.hit(key, maxAttempts, windowMs);

  if (!result.success) {
    return { blocked: true, retryAfterSeconds: result.retryAfter ?? 60 };
  }

  return { blocked: false };
}

// ── API Pública: resetRateLimit ─────────────────────────────────────────────

export async function resetRateLimit(identifier: string): Promise<void> {
  const store = await getRateLimitStore();
  await store.reset(identifier);
}
