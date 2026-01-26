import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

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
