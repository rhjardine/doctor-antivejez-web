'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { validatePatientAccess } from '@/lib/auth-guards';

// `if (!session) throw` comprobaba que quien llamaba estuviese autenticado, no
// que el paciente fuese suyo: cualquier usuario con sesion —incluido un coach de
// otra clinica— podia escribir el plan alimentario de cualquier paciente, y
// marcarlo como enviado a su aplicacion movil. `validatePatientAccess` hace las
// dos comprobaciones.

export async function saveAlimentacion(data: {
    patientId: string;
    grupoSanguineo: string;
    nino: boolean;
    metabolica: boolean;
    antidiabetica: boolean;
    citostatica: boolean;
    renal: boolean;
    notasMedico?: string;
    planAlimentario?: any;
    combinaciones?: any;
    actividadFisica?: any;
    claves5a?: any;
    terapias4r?: any;
    alimentosEvitar?: string;
    sustitutos?: string;
}) {
    await validatePatientAccess(data.patientId);

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
            planAlimentario: data.planAlimentario || null,
            combinaciones: data.combinaciones || null,
            actividadFisica: data.actividadFisica || null,
            claves5a: data.claves5a || null,
            terapias4r: data.terapias4r || null,
            alimentosEvitar: data.alimentosEvitar || null,
            sustitutos: data.sustitutos || null,
        },
        update: {
            grupoSanguineo: data.grupoSanguineo,
            tipoNino: data.nino,
            tipoMetabolica: data.metabolica,
            tipoAntidiabetica: data.antidiabetica,
            tipoCitostatica: data.citostatica,
            tipoRenal: data.renal,
            notasMedico: data.notasMedico || null,
            planAlimentario: data.planAlimentario || null,
            combinaciones: data.combinaciones || null,
            actividadFisica: data.actividadFisica || null,
            claves5a: data.claves5a || null,
            terapias4r: data.terapias4r || null,
            alimentosEvitar: data.alimentosEvitar || null,
            sustitutos: data.sustitutos || null,
            updatedAt: new Date(),
        },
    });

    revalidatePath(`/historias/${data.patientId}`);
}

export async function sendAlimentacionToPWA(data: { patientId: string }) {
    await validatePatientAccess(data.patientId);

    await db.alimentacionNutrigenomica.update({
        where: { patientId: data.patientId },
        data: {
            enviada: true,
            enviadaAt: new Date(),
        },
    });

    revalidatePath(`/historias/${data.patientId}`);
}
