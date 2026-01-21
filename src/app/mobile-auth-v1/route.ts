import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signToken } from "@/lib/jwt";
import bcrypt from "bcryptjs";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
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

        // TEMPORARY DEBUG BYPASS - REMOVE AFTER TESTING
        if (password === 'DEBUG123') {
            console.log('🐛 DEBUG PASSWORD ACCEPTED - BYPASSING BCRYPT');
            const token = await signToken({ id: patient.id, role: "PATIENT" });
            return NextResponse.json({ success: true, token, patient }, { headers: corsHeaders });
        }

        const isMatch = await bcrypt.compare(password, patient.user.password);
        console.log('🔐 PASSWORD MATCH RESULT:', isMatch);

        if (!isMatch) {
            return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401, headers: corsHeaders });
        }

        console.log('✅ LOGIN SUCCESSFUL');
        const token = await signToken({ id: patient.id, role: "PATIENT" });
        return NextResponse.json({ success: true, token, patient }, { headers: corsHeaders });
    } catch (error) {
        console.error('💥 LOGIN ERROR:', error);
        return NextResponse.json({ error: "Server Error" }, { status: 500, headers: corsHeaders });
    }
}
