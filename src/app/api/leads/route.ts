import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// ─── Simple in-memory rate limiter (per IP, max 3 req/hour) ─────────────
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const entry = rateMap.get(ip);
    if (!entry || now > entry.resetAt) {
        rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
        return false;
    }
    if (entry.count >= RATE_LIMIT) return true;
    entry.count++;
    return false;
}

// ─── Validate email ──────────────────────────────────────────────────────
function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── POST /api/leads ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    // Rate limiting by IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    if (isRateLimited(ip)) {
        return NextResponse.json(
            { error: 'Demasiadas solicitudes. Intenta en una hora.' },
            { status: 429 }
        );
    }

    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
    }

    const { name, email, phone, country, score, category, source, utmSource } = body as {
        name?: string; email?: string; phone?: string; country?: string;
        score?: number; category?: string; source?: string; utmSource?: string;
    };

    // Validation
    if (!email || !isValidEmail(email)) {
        return NextResponse.json({ error: 'Email requerido y debe ser válido.' }, { status: 400 });
    }
    if (!name?.trim()) {
        return NextResponse.json({ error: 'El nombre es requerido.' }, { status: 400 });
    }
    if (score !== undefined && (typeof score !== 'number' || score < 0 || score > 100)) {
        return NextResponse.json({ error: 'Score debe ser un número entre 0 y 100.' }, { status: 400 });
    }

    try {
        const lead = await (prisma as any).publicLead.upsert({
            where: { email },
            update: {
                name,
                phone: phone ?? undefined,
                country: country ?? undefined,
                testScore: typeof score === 'number' ? score : undefined,
                testCategory: category ?? undefined,
                source: source ?? 'FUNNEL',
                utmSource: utmSource ?? undefined,
            },
            create: {
                email,
                name: name!,
                phone: phone ?? null,
                country: country ?? null,
                testScore: typeof score === 'number' ? score : null,
                testCategory: category ?? null,
                source: source ?? 'FUNNEL',
                utmSource: utmSource ?? null,
            },
        });

        return NextResponse.json({ success: true, leadId: lead.id });
    } catch (err) {
        console.error('[api/leads] DB error:', err);
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}
