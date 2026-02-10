// src/lib/actions/genetics.actions.ts
'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

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
        const test = await prisma.geneticTest.create({
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

        revalidatePath(`/historias/${data.patientId}`);
        return { success: true, data: test };
    } catch (error: any) {
        console.error('Error creating genetic test:', error);
        return { success: false, error: error.message || 'Error desconocido al guardar el test genético' };
    }
}

export async function getGeneticTests(patientId: string) {
    try {
        const tests = await prisma.geneticTest.findMany({
            where: { patientId },
            orderBy: { testDate: 'desc' },
        });
        return { success: true, data: tests };
    } catch (error: any) {
        console.error('Error fetching genetic tests:', error);
        return { success: false, error: 'Error al obtener los tests genéticos' };
    }
}
