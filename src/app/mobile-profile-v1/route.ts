import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { getCorsHeaders, handleCorsPreflightOrReject } from "@/lib/cors";

export const dynamic = 'force-dynamic';

export async function OPTIONS(req: Request) {
    return handleCorsPreflightOrReject(req, "GET, PATCH, OPTIONS");
}

export async function GET(req: Request) {
    const corsHeaders = getCorsHeaders(req, "GET, PATCH, OPTIONS");

    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Token no proporcionado" }, { status: 401, headers: corsHeaders });
        }

        const token = authHeader.split(" ")[1];
        const payload = await verifyToken(token);

        if (!payload) {
            return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401, headers: corsHeaders });
        }

        const patient = await db.patient.findUnique({
            where: { id: payload.id },
            include: {
                biophysicsTests: { orderBy: { createdAt: 'desc' }, take: 1 },
                biochemistryTests: { orderBy: { createdAt: 'desc' }, take: 1 },
                guides: { orderBy: { createdAt: 'desc' }, take: 1 },
                foodPlans: { orderBy: { createdAt: 'desc' }, take: 1, include: { items: true } },
                nlrTests: { orderBy: { createdAt: 'desc' }, take: 1 },
                geneticTests: { orderBy: { testDate: 'desc' }, take: 1 }
            }
        });

        if (!patient) {
            return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404, headers: corsHeaders });
        }

        return NextResponse.json({
            id: patient.id,
            firstName: patient.firstName,
            lastName: patient.lastName,
            email: patient.email,
            bloodType: patient.bloodType,
            identification: patient.identification,
            biologicalAge: patient.biophysicsTests[0]?.biologicalAge || null,
            chronologicalAge: patient.chronologicalAge,
            biophysics: patient.biophysicsTests[0] || null,
            biochemistry: patient.biochemistryTests[0] || null,
            latestNlr: patient.nlrTests[0] || null,
            geneticSummary: patient.geneticTests[0] ? {
                telomereLength: patient.geneticTests[0].averageTelomereLength,
                biologicalAge: patient.geneticTests[0].biologicalAge,
                chronologicalAge: patient.geneticTests[0].chronologicalAge,
                agingDelta: patient.geneticTests[0].differentialAge,
                rejuvenationScore: Math.max(0, Math.min(100, 50 + (patient.geneticTests[0].chronologicalAge - patient.geneticTests[0].biologicalAge) * 5)),
                lastTestDate: patient.geneticTests[0].testDate?.toISOString() || null,
            } : null,
            guides: patient.guides,
            foodPlans: patient.foodPlans
        }, { headers: corsHeaders });

    } catch (error) {
        console.error("Profile fetch error:", (error as Error).message);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500, headers: corsHeaders });
    }
}

export async function PATCH(req: Request) {
    const corsHeaders = getCorsHeaders(req, "GET, PATCH, OPTIONS");

    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401, headers: corsHeaders });
        }

        const token = authHeader.split(" ")[1];
        const payload = await verifyToken(token);

        if (!payload) {
            return NextResponse.json({ error: "Token inválido" }, { status: 401, headers: corsHeaders });
        }

        const { shareDataConsent } = await req.json();

        const patient = await db.patient.findFirst({
            where: { userId: payload.id }
        });

        if (!patient) {
            return NextResponse.json({ error: "Perfil de paciente no encontrado" }, { status: 404, headers: corsHeaders });
        }

        const updatedPatient = await db.patient.update({
            where: { id: patient.id },
            data: { shareDataConsent: !!shareDataConsent }
        });

        return NextResponse.json({
            success: true,
            consent: updatedPatient.shareDataConsent
        }, { headers: corsHeaders });

    } catch (error) {
        console.error("Consent update error:", (error as Error).message);
        return NextResponse.json({ error: "Error al actualizar consentimiento" }, { status: 500, headers: corsHeaders });
    }
}
