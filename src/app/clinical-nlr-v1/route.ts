import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { NlrRiskLevel } from '@prisma/client';
import { getCorsHeaders, handleCorsPreflightOrReject } from '@/lib/cors';
import { validateMobileSession } from '@/lib/auth-guards';

export const dynamic = 'force-dynamic';

const getNlrRiskLevel = (value: number): NlrRiskLevel => {
    if (value < 1.5) return 'OPTIMAL';
    if (value < 2.0) return 'LOW_INFLAMMATION';
    if (value < 2.5) return 'BORDERLINE';
    if (value < 3.0) return 'MODERATE_INFLAMMATION';
    if (value < 4.0) return 'HIGH_INFLAMMATION';
    if (value < 6.0) return 'SEVERE_INFLAMMATION';
    if (value < 10.0) return 'CRITICAL_INFLAMMATION';
    return 'EXTREME_RISK';
};

export async function OPTIONS(req: Request) {
    return handleCorsPreflightOrReject(req, "POST, OPTIONS");
}

export async function POST(req: Request) {
    const corsHeaders = getCorsHeaders(req, "POST, OPTIONS");

    try {
        // ── MOBILE AUTH GUARD (Centralizado) ──────────────────────────────────
        const session = await validateMobileSession(req);
        // ────────────────────────────────────────────────────────────────────────

        const body = await req.json();
        const { neutrophils, lymphocytes, testDate } = body;

        if (!neutrophils || !lymphocytes) {
            return NextResponse.json({ error: 'Faltan datos requeridos (neutrófilos o linfocitos)' }, { status: 400, headers: corsHeaders });
        }

        // Multi-Tenant + Soft Delete: verificar existencia del paciente
        const tenantFilter = session.tenantId
            ? { id: session.id, tenantId: session.tenantId, deletedAt: null }
            : { id: session.id, deletedAt: null };

        const patient = await db.patient.findFirst({
            where: tenantFilter,
            select: { id: true },
        });

        if (!patient) {
            return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404, headers: corsHeaders });
        }

        const nlrValue = Number(neutrophils) / Number(lymphocytes);
        const riskLevel = getNlrRiskLevel(nlrValue);

        const test = await db.nlrTest.create({
            data: {
                patientId: patient.id, // SECURE: del token JWT, no del body
                neutrophils: Number(neutrophils),
                lymphocytes: Number(lymphocytes),
                nlrValue: Number(nlrValue),
                riskLevel,
                testDate: testDate ? new Date(testDate) : new Date(),
            },
        });

        return NextResponse.json({ success: true, data: test }, { status: 201, headers: corsHeaders });
    } catch (error: any) {
        const isAuthError = error?.message?.startsWith('UNAUTHORIZED');
        if (isAuthError) {
            return NextResponse.json({ error: error.message }, { status: 401, headers: corsHeaders });
        }
        console.error('NLR test error:', (error as Error).message);
        return NextResponse.json({
            error: 'Error al guardar el test de NLR',
            details: error.message || 'Error desconocido'
        }, { status: 500, headers: corsHeaders });
    }
}
