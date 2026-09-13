import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAnySession, assertPatientReadable } from '@/lib/auth-guards';

export const dynamic = 'force-dynamic';

/**
 * GET /clinical-nlr-v1/history?patientId=...
 * Historial NLR de un paciente (últimos 10 registros).
 *
 * S2 — BLINDAJE: este endpoint devolvía biomarcadores clínicos de CUALQUIER
 * paciente con solo conocer su ID, sin autenticación alguna. Ahora exige
 * sesión (PWA o web) y verifica la propiedad del registro.
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    // ─── Guard: sesión + propiedad ──────────────────────────────────────────
    try {
        const identity = await requireAnySession(req);
        await assertPatientReadable(identity, patientId);
    } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (message.startsWith('UNAUTHORIZED')) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }
        if (message.startsWith('NOT_FOUND')) {
            return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }
    // ────────────────────────────────────────────────────────────────────────

    try {
        const history = await db.nlrTest.findMany({
            where: { patientId },
            orderBy: { testDate: 'desc' },
            take: 10 // Últimos 10 registros
        });
        return NextResponse.json(history);
    } catch (error) {
        return NextResponse.json({ error: 'Error al consultar historial' }, { status: 500 });
    }
}
