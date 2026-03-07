/**
 * src/app/api/mobile-profile-v1/route.ts
 *
 * Punto de entrada /api/mobile-profile-v1 para la PWA.
 *
 * POR QUÉ EXISTE ESTE ARCHIVO:
 * La PWA llama a /api/mobile-profile-v1 (convención REST estándar).
 * El route.ts real vive en /mobile-profile-v1 (sin /api/).
 * Next.js 14 App Router evalúa existencia de ruta ANTES de aplicar rewrites,
 * por lo que el preflight OPTIONS llegaba a un 404 antes de que el rewrite
 * pudiera actuar — el browser bloqueaba toda comunicación CORS.
 *
 * SOLUCIÓN:
 * Este archivo existe en /api/mobile-profile-v1/ para capturar las llamadas
 * de la PWA, responder el preflight con 204 + CORS headers, y delegar
 * el GET/PATCH al handler real.
 */

import { NextRequest } from 'next/server';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'https://doctorantivejez-patients.onrender.com',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
};

/**
 * Preflight CORS — responde con 204 No Content + headers CORS.
 * Sin este handler, Next.js devuelve 404 para OPTIONS y el browser
 * bloquea toda comunicación con la PWA (Isabel Padrino CI 798386).
 */
export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
    });
}

/**
 * GET — proxy interno al handler real en /mobile-profile-v1
 */
export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    url.pathname = '/mobile-profile-v1';

    const proxiedResponse = await fetch(url.toString(), {
        method: 'GET',
        headers: {
            'Authorization': request.headers.get('Authorization') || '',
            'Content-Type': 'application/json',
        },
    });

    const data = await proxiedResponse.json();

    return new Response(JSON.stringify(data), {
        status: proxiedResponse.status,
        headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
        },
    });
}

/**
 * PATCH — proxy interno al handler real en /mobile-profile-v1
 * (usado para actualizar shareDataConsent desde la PWA)
 */
export async function PATCH(request: NextRequest) {
    const url = new URL(request.url);
    url.pathname = '/mobile-profile-v1';

    const body = await request.text();

    const proxiedResponse = await fetch(url.toString(), {
        method: 'PATCH',
        headers: {
            'Authorization': request.headers.get('Authorization') || '',
            'Content-Type': 'application/json',
        },
        body,
    });

    const data = await proxiedResponse.json();

    return new Response(JSON.stringify(data), {
        status: proxiedResponse.status,
        headers: {
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
        },
    });
}
