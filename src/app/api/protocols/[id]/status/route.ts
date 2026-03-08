import { NextRequest, NextResponse } from 'next/server';

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
    // TODO: implementar lógica real de status del protocolo
    // Por ahora devolver estructura base que espera la PWA
    return NextResponse.json(
        { protocolId: params.id, status: 'active' },
        { status: 200, headers: CORS_HEADERS }
    );
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const body = await request.json();
    // TODO: actualizar status del protocolo en BD
    return NextResponse.json(
        { protocolId: params.id, ...body },
        { status: 200, headers: CORS_HEADERS }
    );
}
