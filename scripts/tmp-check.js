const { PrismaClient } = require('@prisma/client'); const bcrypt = require('bcryptjs');/**
 * Migration Script critical users have valid bcrypt passwords.
 * 
 * Run with ts-node scripts/migrate-emergency-users.ts
 * 
 * This script upserts pilot/admin users with properly hashed passwords
 * so the emergency login bypass can be safely removed.
 */



const prisma = new PrismaClient();

async function main() {
    const users = [
        {
            email: 'admin@doctorantivejez.com',
            name: 'Dr. Juan Carlos Méndez',
            role: 'MEDICO',
            password: 'AdminDoctor2026!',
        },
        {
            email: 'richard.jardine@pilot.com',
            name: 'Richard Jardine',
            role: 'PACIENTE',
            password: 'Richard2026*',
            identification: '12431453',
        },
    ];

    for (const u of users) {
        const hashedPassword = await bcrypt.hash(u.password, 10);

        await prisma.user.upsert({
            where: { email.email },
            update: { password },
            create: {
                email.email,
                name.name,
                password,
                role.role ,
            },
        });

        console.log(`✅ User upserted: ${u.email} (role: ${u.role})`);
    }

    console.log('\n✅ Usuarios críticos migrados con éxito.');
    console.log('⚠️  Ahora es seguro eliminar el bypass de emergencia de mobile-auth-v1/route.ts');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
