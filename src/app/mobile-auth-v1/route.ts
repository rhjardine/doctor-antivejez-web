import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signMobileAccessToken, signMobileRefreshToken } from "@/lib/jwt";
import bcrypt from "bcryptjs";
import { getCorsHeaders, handleCorsPreflightOrReject } from "@/lib/cors";
import { checkRateLimit } from "@/lib/rate-limit";

const PWA_CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'https://doctorantivejez-patients.onrender.com',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
};

/** Preflight CORS para el login de la PWA */
export async function OPTIONS() {
    return new Response(null, { status: 204, headers: PWA_CORS_HEADERS });
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
            // No incluir user.password — ahora usamos patient.passwordHash
        });

        if (!patient || !patient.passwordHash) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401, headers: corsHeaders });
        }

        // ✅ SECURITY: bcrypt comparison con passwordHash del paciente (no del médico)
        const isMatch = await bcrypt.compare(password, patient.passwordHash);

        if (!isMatch) {
            return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401, headers: corsHeaders });
        }

        // ✅ SECURITY: Dual token — access (15min) + refresh (7d)
        const token = await signMobileAccessToken({ id: patient.id, role: "PATIENT" });
        const refreshToken = await signMobileRefreshToken({ id: patient.id });

        // Consolidamos el objeto paciente — con fallback si la BD tiene drift
        let fullPatient;
        try {
            fullPatient = await db.patient.findUnique({
                where: { id: patient.id },
                include: {
                    biophysicsTests: { orderBy: { createdAt: 'desc' }, take: 1 },
                    biochemistryTests: { orderBy: { createdAt: 'desc' }, take: 1 },
                    guides: { orderBy: { createdAt: 'desc' }, take: 1 },
                    foodPlans: { orderBy: { createdAt: 'desc' }, take: 1, include: { items: true } }
                }
            });
        } catch (richQueryError) {
            // Fallback: query without food items (schema drift protection)
            console.warn('⚠️ [Auth] Rich query failed (possible schema drift), using fallback:', (richQueryError as Error).message);
            fullPatient = await db.patient.findUnique({
                where: { id: patient.id },
                include: {
                    biophysicsTests: { orderBy: { createdAt: 'desc' }, take: 1 },
                    biochemistryTests: { orderBy: { createdAt: 'desc' }, take: 1 },
                    guides: { orderBy: { createdAt: 'desc' }, take: 1 },
                    foodPlans: { orderBy: { createdAt: 'desc' }, take: 1 }
                }
            });
        }

        if (!fullPatient) {
            return NextResponse.json({ error: "Error al recuperar datos del paciente" }, { status: 500, headers: corsHeaders });
        }

        // ✅ SEGURIDAD: excluir passwordHash del response
        const { passwordHash: _ph, ...safePatient } = fullPatient as any;

        const responseData = {
            success: true,
            token,           // accessToken — retrocompatible con authService.ts
            refreshToken,    // NUEVO — apiClient.ts ya lo guarda en sessionStorage
            patient: {
                ...safePatient,
                name: `${fullPatient.firstName} ${fullPatient.lastName}`.trim()
            }
        };

        return NextResponse.json(responseData, { headers: corsHeaders });
    } catch (error) {
        console.error('Login route error:', (error as Error).message);
        return NextResponse.json({ error: "Server Error" }, { status: 500, headers: corsHeaders });
    }
}
