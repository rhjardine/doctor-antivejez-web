// src/lib/actions/lab-report.actions.ts
// Server actions for LabReport management
'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * Get all lab reports for a patient
 */
export async function getLabReports(patientId: string) {
    try {
        const reports = await prisma.labReport.findMany({
            where: { patientId },
            orderBy: { createdAt: 'desc' },
        });
        return { success: true, data: reports };
    } catch (error: any) {
        console.error('Error fetching lab reports:', error);
        return { success: false, error: 'Error al obtener los informes de laboratorio.' };
    }
}

/**
 * Validate and save extracted data — creates a GeneticTest record from validated data
 * Maps patientId and testDate exactly from the validated form
 */
export async function validateLabReport(
    labReportId: string,
    validatedData: any,
    patientId: string,
    testDate: string,
    chronologicalAge: number
) {
    try {
        // 1. Update LabReport with validated data
        await prisma.labReport.update({
            where: { id: labReportId },
            data: {
                validatedData: validatedData,
                isValidated: true,
            },
        });

        // 2. Create a GeneticTest record with exact patient/date mapping
        if (validatedData.reportType === 'TELOTEST') {
            await prisma.geneticTest.create({
                data: {
                    patientId: patientId, // Exact mapping from validated form
                    chronologicalAge: chronologicalAge,
                    averageTelomereLength: validatedData.averageTelomereLength || '',
                    biologicalAge: validatedData.estimatedBiologicalAge || 0,
                    differentialAge: validatedData.agingDifference || 0,
                    interpretation: validatedData.interpretation || null,
                    therapeuticResults: validatedData.therapeuticRecommendations || null,
                    recommendations: validatedData.generalRecommendations || null,
                    testDate: new Date(testDate), // Exact mapping from validated form
                },
            });
        }

        revalidatePath(`/historias/${patientId}`);
        return { success: true };
    } catch (error: any) {
        console.error('Error validating lab report:', error);
        return { success: false, error: error.message || 'Error al validar el informe.' };
    }
}
