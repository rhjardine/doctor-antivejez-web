import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const email = 'admin@doctorantivejez.com';
        const password = 'AdminDoctor2026!';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log(`🔧 [FixAdmin] Updating password for ${email}...`);

        const user = await db.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                status: 'ACTIVO',
                role: 'ADMIN', // Ensure Admin role
                emailVerified: new Date()
            },
            create: {
                email,
                name: 'Dr. Juan Carlos Méndez',
                role: 'ADMIN',
                status: 'ACTIVO',
                password: hashedPassword,
                emailVerified: new Date()
            }
        });

        return NextResponse.json({
            success: true,
            message: "✅ Admin password force-updated successfully.",
            debugv: "v2.2",
            email: user.email,
            role: user.role,
            password_configured: "AdminDoctor2026!",
            new_hash_prefix: user.password?.substring(0, 15)
        });
    } catch (error) {
        console.error("🔥 [FixAdmin] Error:", error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
