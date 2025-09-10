// src/app/api/sync-legacy/route.ts
import { NextResponse } from 'next/server';
import { syncLegacyDatabase } from '@/lib/scripts/sync-legacy-db';

// Esta es una protección simple con un "bearer token" secreto.
// En una app real, se usaría la sesión de NextAuth para verificar si el usuario es un admin.
const SYNC_SECRET = process.env.SYNC_SECRET_KEY;

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('authorization');

    if (!SYNC_SECRET || authorization !== `Bearer ${SYNC_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Iniciando sincronización manual a través de endpoint de API...');
    const result = await syncLegacyDatabase();

    if (result.success) {
      return NextResponse.json({ message: 'Sincronización completada', ...result });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}