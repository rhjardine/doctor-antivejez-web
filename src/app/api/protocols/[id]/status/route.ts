import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAnySession, assertPatientReadable } from '@/lib/auth-guards';
import { guardErrorResponse } from '@/lib/api-guards';
import { ESTADOS_VALIDOS, type EstadoItem } from '@/lib/protocol-status';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'https://doctorantivejez-patients.onrender.com',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
} as const;

export async function OPTIONS() {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * Resuelve a qué paciente pertenece la operación.
 *
 * El paciente SIEMPRE se deriva del token, nunca de la URL ni del body: el
 * parámetro [id] de la ruta es el ítem de la guía, no el paciente. Un
 * profesional puede consultar el estado de un paciente suyo pasando
 * ?patientId=, sujeto al guard de propiedad.
 */
async function resolverPaciente(
    request: NextRequest,
    identity: Awaited<ReturnType<typeof requireAnySession>>,
): Promise<string> {
    if (identity.role === 'PATIENT') return identity.id;

    const solicitado = new URL(request.url).searchParams.get('patientId');
    if (!solicitado) throw new Error('INVALID_INPUT: patientId requerido');

    await assertPatientReadable(identity, solicitado);
    return solicitado;
}

/**
 * GET /api/protocols/{itemId}/status
 * Devuelve el estado persistido del ítem para el paciente en sesión.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const identity = await requireAnySession(request);
        const patientId = await resolverPaciente(request, identity);

        const registro = await db.protocolItemStatus.findUnique({
            where: { patientId_itemId: { patientId, itemId: params.id } },
            select: { status: true, updatedAt: true },
        });

        return NextResponse.json(
            {
                protocolId: params.id,
                // Sin registro, el ítem nunca se marcó: por defecto 'pending'.
                status: (registro?.status as EstadoItem) ?? 'pending',
                updatedAt: registro?.updatedAt ?? null,
            },
            { status: 200, headers: CORS_HEADERS }
        );
    } catch (error) {
        return guardErrorResponse(error, CORS_HEADERS);
    }
}

/**
 * PATCH /api/protocols/{itemId}/status
 * Persiste el estado del ítem. Lo invoca la PWA al marcar adherencia.
 *
 * B1: antes devolvía 200 sin guardar nada. La PWA mostraba el tick, el backend
 * respondía OK, y al reentrar mobile-profile-v1 servía todo como 'pending'.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const identity = await requireAnySession(request);

        // Escribir adherencia es un acto del paciente sobre su propia guía.
        if (identity.role !== 'PATIENT') {
            return NextResponse.json(
                { error: 'Solo el paciente puede registrar su adherencia' },
                { status: 403, headers: CORS_HEADERS }
            );
        }

        const body = await request.json().catch(() => ({}));
        const { status } = body as { status?: string };

        if (!status || !ESTADOS_VALIDOS.includes(status as EstadoItem)) {
            return NextResponse.json(
                { error: `status debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` },
                { status: 400, headers: CORS_HEADERS }
            );
        }

        // Verificar que el paciente sigue activo antes de escribir.
        const paciente = await db.patient.findFirst({
            where: { id: identity.id, deletedAt: null },
            select: { id: true },
        });

        if (!paciente) {
            return NextResponse.json(
                { error: 'Paciente no encontrado' },
                { status: 404, headers: CORS_HEADERS }
            );
        }

        const registro = await db.protocolItemStatus.upsert({
            where: { patientId_itemId: { patientId: paciente.id, itemId: params.id } },
            create: { patientId: paciente.id, itemId: params.id, status },
            update: { status },
            select: { status: true, updatedAt: true },
        });

        return NextResponse.json(
            { protocolId: params.id, status: registro.status, updatedAt: registro.updatedAt },
            { status: 200, headers: CORS_HEADERS }
        );
    } catch (error) {
        return guardErrorResponse(error, CORS_HEADERS);
    }
}
