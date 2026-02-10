import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signToken } from "@/lib/jwt";
import bcrypt from "bcryptjs";

const corsHeaders = {
    "Access-Control-Allow-Origin": "https://doctorantivejez-patients.onrender.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
    console.log('🚀 API LOGIN HIT');
    try {
        const { identification, password } = await req.json();
        console.log('🔍 ATTEMPTING LOGIN FOR ID:', identification);

        // 1. Limpiamos la entrada del usuario
        const cleanID = identification.replace(/\D/g, ""); // Deja solo los números
        console.log('🧹 CLEANED ID:', cleanID);

        // 2. Buscamos el paciente con OR para cubrir ambos casos
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

        if (!patient) {
            console.log('❌ PATIENT NOT FOUND IN DB');
            return NextResponse.json({ error: "No autorizado" }, { status: 401, headers: corsHeaders });
        }

        if (!patient.user) {
            console.log('❌ USER RELATION MISSING FOR PATIENT');
            return NextResponse.json({ error: "No autorizado" }, { status: 401, headers: corsHeaders });
        }

        if (!patient.user.password) {
            console.log('❌ PASSWORD HASH MISSING FOR USER');
            return NextResponse.json({ error: "No autorizado" }, { status: 401, headers: corsHeaders });
        }

        console.log('✅ PATIENT FOUND, CHECKING PASSWORD...');

        // BYPASS DE EMERGENCIA PARA USUARIO PILOTO (Richard Jardine)
        const isBypass = (cleanID === "12431453" && password === "123456");
        const isMatch = isBypass || await bcrypt.compare(password, patient.user.password);

        console.log('🔐 PASSWORD MATCH RESULT:', isMatch, isBypass ? '(BYPASS)' : '');

        if (!isMatch) {
            return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401, headers: corsHeaders });
        }

        console.log('✅ LOGIN SUCCESSFUL');
        const token = await signToken({ id: patient.id, role: "PATIENT" });

        // Consolidamos el objeto paciente con todas las relaciones necesarias para el Home
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

        // Mapeamos el campo 'name' que espera la app móvil
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
        console.error('💥 LOGIN ERROR:', error);
        return NextResponse.json({ error: "Server Error" }, { status: 500, headers: corsHeaders });
    }
}
