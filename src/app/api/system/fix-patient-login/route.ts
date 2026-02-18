import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const identification = '12431453';
        const email = 'richard.jardine@pilot.com';
        const password = 'Richard2026*';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log(`🔧 [FixPatient] Aligning patient ${identification} with user ${email}...`);

        // 1. Asegurar que el USER existe con el hash correcto
        const user = await db.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                role: 'PACIENTE',
                status: 'ACTIVO'
            },
            create: {
                email,
                name: 'Richard Jardine',
                password: hashedPassword,
                role: 'PACIENTE',
                status: 'ACTIVO'
            }
        });

        // 2. Asegurar que el PATIENT existe con la identificación correcta y linkeado al USER
        const patient = await db.patient.upsert({
            where: { identification },
            update: {
                userId: user.id,
                firstName: 'Richard',
                lastName: 'Jardine'
            },
            create: {
                identification,
                userId: user.id,
                firstName: 'Richard',
                lastName: 'Jardine',
                email: email,
                gender: 'MASCULINO',
                birthDate: new Date('1980-01-01'), // Fecha genérica para el piloto
            }
        });

        return NextResponse.json({
            success: true,
            message: "✅ Patient and User records aligned and password updated.",
            debugv: "v1.0",
            patientId: patient.id,
            userId: user.id,
            identification: patient.identification,
            email: user.email,
            password_configured: password
        });
    } catch (error) {
        console.error("🔥 [FixPatient] Error:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
