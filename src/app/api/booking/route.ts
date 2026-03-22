import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// ─── POST /api/booking ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
    }

    const {
        name, email, phone, country,
        schedulePreference, bookingType,
        testScore, testCategory,
    } = body as {
        name?: string; email?: string; phone?: string; country?: string;
        schedulePreference?: string; bookingType?: string;
        testScore?: number; testCategory?: string;
    };

    // Validation
    if (!email || !name || !phone) {
        return NextResponse.json(
            { error: 'Nombre, email y teléfono son requeridos.' },
            { status: 400 }
        );
    }
    if (!bookingType || !['basica', 'profunda'].includes(bookingType)) {
        return NextResponse.json(
            { error: 'bookingType debe ser "basica" o "profunda".' },
            { status: 400 }
        );
    }

    try {
        // 1. Upsert the lead and mark as converted
        const lead = await (prisma as any).publicLead.upsert({
            where: { email },
            update: {
                name, phone, country: country ?? null,
                testScore: typeof testScore === 'number' ? testScore : undefined,
                testCategory: testCategory ?? undefined,
                converted: true,
                convertedAt: new Date(),
            },
            create: {
                email, name, phone,
                country: country ?? null,
                testScore: typeof testScore === 'number' ? testScore : null,
                testCategory: testCategory ?? null,
                source: 'BOOKING',
                converted: true,
                convertedAt: new Date(),
            },
        });

        // 2. Create a BookingRequest record
        const booking = await (prisma as any).bookingRequest.create({
            data: {
                leadId: lead.id,
                bookingType,
                status: 'PENDING',
                amount: bookingType === 'profunda' ? 49.0 : 0.0,
                paymentStatus: bookingType === 'profunda' ? 'PENDING' : 'FREE',
                schedulePref: schedulePreference ?? null,
            },
        });

        // 3. Notify team (console fallback — connect email/Resend when ready)
        console.log('[BOOKING] Nueva reserva recibida:', {
            name, email, phone, country, bookingType,
            schedulePreference, bookingId: booking.id,
            testScore, testCategory,
        });

        // TODO: Send email via Resend/Nodemailer when RESEND_API_KEY is configured:
        // if (process.env.RESEND_API_KEY) { await sendBookingNotification(...) }

        return NextResponse.json({
            success: true,
            bookingId: booking.id,
            message: 'Te contactaremos en menos de 24 horas',
        });
    } catch (err) {
        console.error('[api/booking] DB error:', err);
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}
