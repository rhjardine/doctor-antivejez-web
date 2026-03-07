/**
 * src/app/api/mobile-profile-v1/route.ts
 *
 * CORS bridge para la PWA Rejuvenate.
 *
 * Este archivo:
 * 1. Responde OPTIONS con 204 + CORS headers (preflight CORS ✅)
 * 2. Re-exporta los handlers GET/PATCH del route.ts real CON CORS headers inyectados
 *
 * Se usa importación directa (Plan A) en lugar de fetch interno (Plan B)
 * porque en Render el fetch interno a https://sí-mismo falla con ERR_SSL_WRONG_VERSION_NUMBER.
 */

import { NextResponse } from 'next/server';
import { GET as RealGET, PATCH as RealPATCH } from '../../mobile-profile-v1/route';

export const dynamic = 'force-dynamic';

const PWA_ORIGIN = 'https://doctorantivejez-patients.onrender.com';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': PWA_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
} as const;

/**
 * Inyecta headers CORS en cualquier respuesta del handler real.
 */
function withCORS(response: Response | NextResponse): NextResponse {
    const headers = new Headers(response.headers);
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        headers.set(key, value);
    });
    return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

/**
 * OPTIONS — Preflight CORS (ya funcionando ✅)
 */
export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
    });
}

/**
 * GET — Delega al handler real e inyecta CORS headers
 */
export async function GET(request: Request) {
    const response = await RealGET(request);
    return withCORS(response);
}

/**
 * PATCH — Delega al handler real (shareDataConsent) e inyecta CORS headers
 */
export async function PATCH(request: Request) {
    const response = await RealPATCH(request);
    return withCORS(response);
}
