import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/jwt";

export const dynamic = 'force-dynamic';

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: Request) {
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
                biophysicsTests: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                },
                biochemistryTests: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                },
                guides: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                },
                foodPlans: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        items: true
                    }
                }
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
            guides: patient.guides,
            foodPlans: patient.foodPlans
        }, { headers: corsHeaders });

    } catch (error) {
        console.error("Profile fetch error:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500, headers: corsHeaders });
    }
}
