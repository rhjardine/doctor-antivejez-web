import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signToken } from "@/lib/jwt";
import bcrypt from "bcryptjs";
import { getCorsHeaders, handleCorsPreflightOrReject } from "@/lib/cors";
import { checkRateLimit } from "@/lib/rate-limit";

export async function OPTIONS(req: Request) {
    return handleCorsPreflightOrReject(req, "POST, OPTIONS");
}

export async function POST(req: Request) {
    // Rate limit check
    const rateLimitResponse = await checkRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

    const corsHeaders = getCorsHeaders(req, "POST, OPTIONS");

    try {
        const { identification, password } = await req.json();

        // Limpiamos la entrada del usuario
        const cleanID = identification.replace(/\D/g, "");

        // Buscamos el paciente con OR para cubrir formatos de ID
        const patient = await db.patient.findFirst({
            where: {
                OR: [
                    { identification: cleanID },
                    { identification: `V-${cleanID}` },
                    { identification: identification }
                ]
            },
            include: { user: true }
        });

        if (!patient || !patient.user || !patient.user.password) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401, headers: corsHeaders });
        }

        // ✅ SECURITY: bcrypt comparison only, no bypass
        const isMatch = await bcrypt.compare(password, patient.user.password);

        if (!isMatch) {
            return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401, headers: corsHeaders });
        }

        const token = await signToken({ id: patient.id, role: "PATIENT" });

        // Consolidamos el objeto paciente con todas las relaciones necesarias
        const fullPatient = await db.patient.findUnique({
            where: { id: patient.id },
            include: {
                biophysicsTests: { orderBy: { createdAt: 'desc' }, take: 1 },
                biochemistryTests: { orderBy: { createdAt: 'desc' }, take: 1 },
                guides: { orderBy: { createdAt: 'desc' }, take: 1 },
                foodPlans: { orderBy: { createdAt: 'desc' }, take: 1, include: { items: true } }
            }
        });

        if (!fullPatient) {
            return NextResponse.json({ error: "Error al recuperar datos del paciente" }, { status: 500, headers: corsHeaders });
        }

        const responseData = {
            success: true,
            token,
            patient: {
                ...fullPatient,
                name: `${fullPatient.firstName} ${fullPatient.lastName}`.trim()
            }
        };

        return NextResponse.json(responseData, { headers: corsHeaders });
    } catch (error) {
        console.error('Login route error:', (error as Error).message);
        return NextResponse.json({ error: "Server Error" }, { status: 500, headers: corsHeaders });
    }
}
