
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const patientId = '12431453'; // Richard Jardine (Identification)
    const doctorName = 'Carolina Salvatori';

    console.log(`🔍 Buscando paciente con cédula: ${patientId}...`);
    const patient = await prisma.patient.findUnique({
        where: { identification: patientId },
    });

    if (!patient) {
        console.error(`❌ Paciente ${patientId} no encontrado.`);
        return;
    }

    console.log(`✅ Paciente encontrado: ${patient.firstName} ${patient.lastName} (ID: ${patient.id})`);

    console.log(`🔍 Buscando doctor(a): ${doctorName}...`);
    const doctor = await prisma.user.findFirst({
        where: {
            name: { contains: doctorName, mode: 'insensitive' },
            role: 'MEDICO'
        },
    });

    if (!doctor) {
        console.error(`❌ Doctor(a) ${doctorName} no encontrado(a).`);
        // Fallback search for any MEDICO
        const anyDoctor = await prisma.user.findFirst({ where: { role: 'MEDICO' } });
        if (anyDoctor) {
            console.log(`⚠️ Usando doctor alternativo: ${anyDoctor.name}`);
            await assign(patient.id, anyDoctor.id);
        }
        return;
    }

    await assign(patient.id, doctor.id);
}

async function assign(patientId: string, userId: string) {
    try {
        const updated = await prisma.patient.update({
            where: { id: patientId },
            data: { userId: userId }
        });
        console.log(`✅ ASIGNACIÓN EXITOSA: Paciente asignado al User ID ${userId}`);
    } catch (e) {
        console.error("❌ Error al asignar:", e);
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
