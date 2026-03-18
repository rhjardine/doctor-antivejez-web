import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const ids = ['8042940', '16507020', '12431453'];
    
    console.log('--- DIAGNÓSTICO DE PACIENTES ---');
    for (const id of ids) {
        const patient = await prisma.patient.findFirst({
            where: {
                OR: [
                    { identification: id },
                    { identification: `V-${id}` }
                ]
            }
        });
        
        if (patient) {
            console.log(`✅ CI ${id} encontrado como PACIENTE:`);
            console.log(`   Nombre: ${patient.firstName} ${patient.lastName}`);
            console.log(`   Has passwordHash: ${!!patient.passwordHash}`);
        } else {
            console.log(`❌ CI ${id} NO encontrado en la tabla PATIENT`);
        }

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { name: { contains: id } },
                    { email: { contains: id } }
                ]
            }
        });
        // Try searching user by name or email since they don't have identification directly in user table usually
        if (user) {
           console.log(`✅ CI ${id} encontrado como USER: ${user.name} (${user.role})`);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
