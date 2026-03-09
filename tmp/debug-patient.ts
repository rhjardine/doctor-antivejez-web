import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Searching for "Richard Jardine"...');
    const patient = await prisma.patient.findFirst({
        where: {
            OR: [
                { firstName: { contains: 'Richard', mode: 'insensitive' } },
                { lastName: { contains: 'Jardine', mode: 'insensitive' } },
                { identification: '12431453' }
            ]
        },
        include: {
            user: true
        }
    });

    if (patient) {
        console.log('Patient Found:');
        console.log(JSON.stringify(patient, null, 2));
    } else {
        console.log('Patient not found.');
    }

    const allPatients = await prisma.patient.count();
    console.log('Total patients in DB:', allPatients);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
