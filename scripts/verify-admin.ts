/**
 * Diagnostic Script: Verify Admin User in DB
 * 
 * Run with: npx ts-node scripts/verify-admin.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@doctorantivejez.com';
    const plainPassword = 'AdminDoctor2026!';

    console.log(`🔍 Checking user: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.log('❌ User not found in DB.');
        return;
    }

    console.log('✅ User found.');
    console.log(`📊 Role: ${user.role}`);
    console.log(`📊 Status: ${user.status}`);
    console.log(`🔐 Password field exists: ${!!user.password}`);

    if (user.password) {
        console.log(`🔐 Hash prefix: ${user.password.substring(0, 10)}...`);

        const isMatch = await bcrypt.compare(plainPassword, user.password);
        console.log(`⚖️  Does manual 'bcrypt.compare' match? ${isMatch ? '✅ YES' : '❌ NO'}`);

        if (!isMatch) {
            console.log('\n⚠️  Password mismatch detected. Hashing again for verification...');
            const newHash = await bcrypt.hash(plainPassword, 10);
            console.log(`🆕 New hash would be: ${newHash.substring(0, 10)}...`);

            // OPTIONAL: Update if user wants
            // await prisma.user.update({ where: { email }, data: { password: newHash } });
            // console.log('✅ Password updated to AdminDoctor2026!');
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
