import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.idempotencyKey.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo }
      }
    });

    console.log(`[CRON] Limpieza de llaves de idempotencia completada. Registros eliminados: ${result.count}`);

    return NextResponse.json({ success: true, purgedCount: result.count });
  } catch (error: any) {
    console.error('[CRON ERROR] Fallo al limpiar llaves de idempotencia:', error.message);
    return NextResponse.json({ error: 'Error interno de base de datos' }, { status: 500 });
  }
}
