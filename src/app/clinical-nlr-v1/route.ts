import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { NlrRiskLevel } from '@prisma/client';
import { getCorsHeaders, handleCorsPreflightOrReject } from '@/lib/cors';

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
        const body = await req.json();
        const { patientId, neutrophils, lymphocytes, testDate } = body;

        if (!patientId || !neutrophils || !lymphocytes) {
            return NextResponse.json({ error: 'Faltan datos requeridos (patientId, neutrófilos o linfocitos)' }, { status: 400, headers: corsHeaders });
        }

        const nlrValue = Number(neutrophils) / Number(lymphocytes);
        const riskLevel = getNlrRiskLevel(nlrValue);

        const test = await db.nlrTest.create({
            data: {
                patientId,
                neutrophils: Number(neutrophils),
                lymphocytes: Number(lymphocytes),
                nlrValue: Number(nlrValue),
                riskLevel,
                testDate: testDate ? new Date(testDate) : new Date(),
            },
        });

        return NextResponse.json({ success: true, data: test }, { status: 201, headers: corsHeaders });
    } catch (error: any) {
        console.error('NLR test error:', (error as Error).message);
        return NextResponse.json({
            error: 'Error al guardar el test de NLR',
            details: error.message || 'Error desconocido'
        }, { status: 500, headers: corsHeaders });
    }
}
