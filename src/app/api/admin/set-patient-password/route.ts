import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getCorsHeaders } from "@/lib/cors";

/**
 * ADMIN-ONLY endpoint to set or reset a patient's PWA password.
 * 
 * Usage (POST):
 * {
 *   "adminSecret": "<ADMIN_SECRET>",
 *   "identification": "8042940",
 *   "newPassword": "NuevaPassword2026!"
 * }
 * 
 * This only affects passwordHash — no other patient data is touched.
 */
export async function POST(req: Request) {
    const corsHeaders = getCorsHeaders(req, "POST, OPTIONS");

    try {
        const { adminSecret, identification, newPassword } = await req.json();

        // Security: require a secret token known only to the admin
        const expectedSecret = process.env.ADMIN_REPAIR_SECRET;
        if (!expectedSecret || adminSecret !== expectedSecret) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401, headers: corsHeaders });
        }

        if (!identification || !newPassword) {
            return NextResponse.json({ error: "Faltan parámetros" }, { status: 400, headers: corsHeaders });
        }

        const cleanID = identification.replace(/\D/g, "");

        // Find the patient by any known format of the ID
        const patient = await db.patient.findFirst({
            where: {
                OR: [
                    { identification: cleanID },
                    { identification: `V-${cleanID}` },
                    { identification: identification },
                ]
            },
            select: { id: true, firstName: true, lastName: true, identification: true }
        });

        if (!patient) {
            return NextResponse.json(
                { error: `Paciente con CI ${identification} no encontrado` },
                { status: 404, headers: corsHeaders }
            );
        }

        // Hash the new password
        const passwordHash = await bcrypt.hash(newPassword.trim(), 12);

        // Update ONLY passwordHash — no other field is touched
        await db.patient.update({
            where: { id: patient.id },
            data: { passwordHash }
        });

        return NextResponse.json({
            success: true,
            message: `Contraseña actualizada para ${patient.firstName} ${patient.lastName} (CI: ${patient.identification})`,
        }, { headers: corsHeaders });

    } catch (error) {
        console.error('[set-patient-password] Error:', (error as Error).message);
        return NextResponse.json({ error: "Error del servidor" }, { status: 500, headers: corsHeaders });
    }
}

export async function OPTIONS() {
    return new Response(null, { status: 204 });
}
