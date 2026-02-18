import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Inspect columns of food_items table
        const columns: any[] = await db.$queryRaw`
            SELECT column_name, data_type, udt_name, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'food_items'
            ORDER BY ordinal_position;
        `;

        // 2. Inspect existing ENUM types
        const enums: any[] = await db.$queryRaw`
            SELECT t.typname
            FROM pg_type t 
            JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace 
            WHERE n.nspname = 'public';
        `;

        return NextResponse.json({
            success: true,
            table: 'food_items',
            columns: columns,
            available_enums: enums.map(e => e.typname).filter(n => !n.startsWith('_')) // Filter arrays
        });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
