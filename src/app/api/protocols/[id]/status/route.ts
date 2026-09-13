import { NextRequest, NextResponse } from 'next/server';
import { requireAnySession } from '@/lib/auth-guards';
import { guardErrorResponse } from '@/lib/api-guards';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'https://doctorantivejez-patients.onrender.com',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
} as const;

export async function OPTIONS() {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    // ─── BLINDAJE ───────────────────────────────────────────────────────────
    // Este endpoint aceptaba lecturas y ESCRITURAS de forma anónima.
    try {
        await requireAnySession(request);
    } catch (error) {
        return guardErrorResponse(error, CORS_HEADERS);
    }
    // ────────────────────────────────────────────────────────────────────────

    // TODO(B1): devolver el estado real persistido del ítem.
    // Pendiente de decisión sobre el modelo de persistencia — ver PR de B1.
    return NextResponse.json(
        { protocolId: params.id, status: 'active' },
        { status: 200, headers: CORS_HEADERS }
    );
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    // ─── BLINDAJE ───────────────────────────────────────────────────────────
    let identity;
    try {
        identity = await requireAnySession(request);
    } catch (error) {
        return guardErrorResponse(error, CORS_HEADERS);
    }
    // ────────────────────────────────────────────────────────────────────────

    const body = await request.json();

    // ⚠️ TODO(B1): ESTE ENDPOINT AÚN NO PERSISTE.
    // Devuelve 200 y la PWA cree que guardó, pero el estado se pierde: al
    // volver a entrar, mobile-profile-v1 sirve todos los ítems con
    // `status: 'pending'` hardcodeado. La persistencia requiere una tabla
    // nueva (y por tanto una migración), pendiente de aprobación del dueño.
    console.warn(
        `[B1 PENDIENTE] Cambio de estado no persistido | ` +
        `actor=${identity.id} kind=${identity.kind} item=${params.id}`
    );

    return NextResponse.json(
        { protocolId: params.id, ...body },
        { status: 200, headers: CORS_HEADERS }
    );
}
