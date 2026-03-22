import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// ─── GET /api/leads/stats ─────────────────────────────────────────────────
// Auth required: médico/admin session only
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
    }

    try {
        const leads = await (prisma as any).publicLead.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                country: true,
                testScore: true,
                testCategory: true,
                converted: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        const totalLeads = leads.length;
        const convertedLeads = leads.filter((l: { converted: boolean }) => l.converted).length;
        const scoresWithValue = leads
            .filter((l: { testScore: number | null }) => l.testScore !== null)
            .map((l: { testScore: number }) => l.testScore);
        const avgScore = scoresWithValue.length > 0
            ? Math.round(scoresWithValue.reduce((a: number, b: number) => a + b, 0) / scoresWithValue.length)
            : 0;

        const leadsByCountry: Record<string, number> = {};
        const leadsByCategory: Record<string, number> = {};
        for (const lead of leads as { country: string | null; testCategory: string | null }[]) {
            const c = lead.country ?? 'Sin país';
            leadsByCountry[c] = (leadsByCountry[c] ?? 0) + 1;
            const cat = lead.testCategory ?? 'Sin categoría';
            leadsByCategory[cat] = (leadsByCategory[cat] ?? 0) + 1;
        }

        const recentLeads = leads.slice(0, 10).map((l: {
            email: string; name: string; testScore: number | null;
            testCategory: string | null; createdAt: Date; converted: boolean;
        }) => ({
            email: l.email,
            name: l.name,
            score: l.testScore,
            category: l.testCategory,
            createdAt: l.createdAt,
            converted: l.converted,
        }));

        return NextResponse.json({
            totalLeads,
            convertedLeads,
            avgScore,
            leadsByCountry,
            leadsByCategory,
            recentLeads,
        });
    } catch (err) {
        console.error('[api/leads/stats] DB error:', err);
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}
