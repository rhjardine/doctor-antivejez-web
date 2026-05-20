import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCorsHeaders, handleCorsPreflightOrReject } from '@/lib/cors';
import { checkRateLimit } from '@/lib/rate-limit';
import { validateMobileSession } from '@/lib/auth-guards';

const PWA_CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'https://doctorantivejez-patients.onrender.com',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
};

/** Preflight CORS para la sincronización de adherencia desde la PWA */
export async function OPTIONS() {
    return new Response(null, { status: 204, headers: PWA_CORS_HEADERS });
}

export async function POST(req: Request) {
    const rateLimitResponse = await checkRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    const corsHeaders = getCorsHeaders(req, "POST, OPTIONS");

    try {
        // ── MOBILE AUTH GUARD (Centralizado) ──────────────────────────────────
        const session = await validateMobileSession(req);
        // ────────────────────────────────────────────────────────────────────────

        if (session.role !== 'PATIENT') {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 403, headers: corsHeaders });
        }

        // Extract data from body, but ignore any patientId passed manually
        const { type, points, notes, metadata } = await req.json();

        if (!type || !points) {
            return NextResponse.json({ error: "Invalid data structure" }, { status: 400, headers: corsHeaders });
        }

        // Multi-Tenant + Soft Delete: verificar que el paciente existe y pertenece al tenant
        const tenantFilter = session.tenantId
            ? { id: session.id, tenantId: session.tenantId, deletedAt: null }
            : { id: session.id, deletedAt: null };

        const patient = await db.patient.findFirst({
            where: tenantFilter,
            select: { id: true },
        });

        if (!patient) {
            return NextResponse.json({ error: "Patient profile not found" }, { status: 404, headers: corsHeaders });
        }

        const transaction = await db.omicTransaction.create({
            data: {
                patientId: patient.id, // SECURE: sourced from DB, filtered by tenant + token
                type,
                pointsEarned: points,
                pointsPotential: 100, // Default potential
                source: 'MANUAL',     // Defaulting to MANUAL for mobile check-ins
                notes: notes || null,
                metadata: metadata || undefined
            }
        });

        return NextResponse.json({ success: true, transactionId: transaction.id }, { headers: corsHeaders });
    } catch (error) {
        console.error("Adherence Sync Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: corsHeaders });
    }
}
