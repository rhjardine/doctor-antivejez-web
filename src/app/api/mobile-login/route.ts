import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signToken } from "@/lib/jwt";
import bcrypt from "bcryptjs";

const corsHeaders = {
    "Access-Control-Allow-Origin": "http://localhost:3000",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
    try {
        const { identification, password } = await req.json();
        const patient = await db.patient.findUnique({
            where: { identification },
            include: { user: true }
        });
        if (!patient || !patient.user || !patient.user.password) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401, headers: corsHeaders });
        }
        const isMatch = await bcrypt.compare(password, patient.user.password);
        if (!isMatch) {
            return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401, headers: corsHeaders });
        }
        const token = await signToken({ id: patient.id, role: "PATIENT" });
        return NextResponse.json({ success: true, token, patient }, { headers: corsHeaders });
    } catch (error) {
        return NextResponse.json({ error: "Server Error" }, { status: 500, headers: corsHeaders });
    }
}
