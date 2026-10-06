// src/lib/actions/genetics.actions.ts
'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { validatePatientAccess } from '@/lib/auth-guards';
// El cobro vive en `@/lib/credits`: aislamiento Serializable, débito al
// profesional que actúa y reintento real ante un choque entre transacciones.
import { cobrarCredito, enTransaccionDeCredito } from '@/lib/credits/consume';

export async function createGeneticTest(data: {
    patientId: string;
    chronologicalAge: number;
    averageTelomereLength: string;
    biologicalAge: number;
    differentialAge: number;
    interpretation?: string;
    therapeuticResults?: any;
    recommendations?: any;
    testDate: Date;
}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return { success: false, error: 'No autorizado. Debes iniciar sesión.' };
        }
        await validatePatientAccess(data.patientId);

        const patient = await prisma.patient.findUnique({
            where: { id: data.patientId },
            include: { user: { select: { id: true, role: true } } },
        });

        if (!patient || !patient.user) {
            return { success: false, error: 'Error de integridad: Paciente o Médico no encontrados.' };
        }

        // ================================================================
        // TRANSACCIÓN ATÓMICA: Crédito + Test en un único bloque.
        // Si el INSERT falla → el débito hace ROLLBACK automático.
        // ================================================================
        // Cobra a quien ACTÚA, no al dueño del paciente.
        const actor = { id: session.user.id, role: session.user.role };

        const test = await enTransaccionDeCredito(async (tx) => {
            await cobrarCredito(tx, actor, 'GENETICA', `Test Genético consumido — Paciente ${data.patientId}`);

            return await tx.geneticTest.create({
                data: {
                    patientId: data.patientId,
                    chronologicalAge: data.chronologicalAge,
                    averageTelomereLength: data.averageTelomereLength,
                    biologicalAge: data.biologicalAge,
                    differentialAge: data.differentialAge,
                    interpretation: data.interpretation,
                    therapeuticResults: data.therapeuticResults,
                    recommendations: data.recommendations,
                    testDate: data.testDate,
                },
            });
        });

        revalidatePath(`/historias/${data.patientId}`);
        return { success: true, data: test };
    } catch (error: any) {
        console.error('Error creating genetic test:', error);
        return { success: false, error: error.message || 'Error desconocido al guardar el test genético' };
    }
}

export async function getGeneticTests(patientId: string) {
    try {
        await validatePatientAccess(patientId);
        const tests = await prisma.geneticTest.findMany({
            where: { patientId },
            orderBy: { testDate: 'desc' },
        });
        return { success: true, data: tests };
    } catch (error: any) {
        console.error('Error fetching genetic tests:', error);
        return { success: false, error: error.message || 'Error al obtener los tests genéticos' };
    }
}
