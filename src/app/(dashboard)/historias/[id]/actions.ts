'use server';

import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function saveAlimentacion(data: {
    patientId: string;
    grupoSanguineo: string;
    nino: boolean;
    metabolica: boolean;
    antidiabetica: boolean;
    citostatica: boolean;
    renal: boolean;
    notasMedico?: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error('No autorizado');

    await db.alimentacionNutrigenomica.upsert({
        where: { patientId: data.patientId },
        create: {
            patientId: data.patientId,
            grupoSanguineo: data.grupoSanguineo,
            tipoNino: data.nino,
            tipoMetabolica: data.metabolica,
            tipoAntidiabetica: data.antidiabetica,
            tipoCitostatica: data.citostatica,
            tipoRenal: data.renal,
            notasMedico: data.notasMedico || null,
        },
        update: {
            grupoSanguineo: data.grupoSanguineo,
            tipoNino: data.nino,
            tipoMetabolica: data.metabolica,
            tipoAntidiabetica: data.antidiabetica,
            tipoCitostatica: data.citostatica,
            tipoRenal: data.renal,
            notasMedico: data.notasMedico || null,
            updatedAt: new Date(),
        },
    });

    revalidatePath(`/historias/${data.patientId}`);
}

export async function sendAlimentacionToPWA(data: { patientId: string }) {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error('No autorizado');

    await db.alimentacionNutrigenomica.update({
        where: { patientId: data.patientId },
        data: {
            enviada: true,
            enviadaAt: new Date(),
        },
    });

    revalidatePath(`/historias/${data.patientId}`);
}
