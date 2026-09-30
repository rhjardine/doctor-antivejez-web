// src/lib/actions/lab-report.actions.ts
// Server actions for LabReport management
'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { validatePatientAccess } from '@/lib/auth-guards';
import { mensajeDeErrorDeAcceso, MENSAJE_SIN_ACCESO } from '@/lib/scope/access-errors';

/**
 * Get all lab reports for a patient
 */
export async function getLabReports(patientId: string) {
    try {
        // Este modulo no comprobaba sesion en ninguna de sus dos acciones.
        await validatePatientAccess(patientId);

        const reports = await prisma.labReport.findMany({
            where: { patientId },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        return { success: true, data: reports };
    } catch (error: any) {
        const errorDeAcceso = mensajeDeErrorDeAcceso(error);
        if (errorDeAcceso) return { success: false, error: errorDeAcceso };

        console.error('Error fetching lab reports:', error);
        return { success: false, error: 'Error al obtener los informes de laboratorio.' };
    }
}

/**
 * Validate and save extracted data — creates a GeneticTest record from validated data
 *
 * El `patientId` que llega NO se usa para decidir donde se escribe. Se resuelve
 * el informe, se toma SU dueño real, y se autoriza sobre ese. Es el mismo patron
 * con el que se cerro el IDOR de los borrados.
 *
 * Antes se recibian `labReportId` y `patientId` sin contrastarlos y sin
 * comprobar sesion: bastaba invocar la accion para insertar un `GeneticTest`
 * —con edad biologica e interpretacion— en la historia clinica de cualquier
 * paciente. Un dato clinico falso en una historia ajena es una fuente directa
 * de error medico, no solo una fuga.
 */
export async function validateLabReport(
    labReportId: string,
    validatedData: any,
    patientId: string,
    testDate: string,
    chronologicalAge: number
) {
    try {
        if (!labReportId || !patientId) {
            return { success: false, error: 'Faltan datos para validar el informe.' };
        }

        // 1. Resolver el dueño REAL del informe antes de autorizar nada.
        const informe = await prisma.labReport.findUnique({
            where: { id: labReportId },
            select: { patientId: true },
        });

        if (!informe) {
            return { success: false, error: MENSAJE_SIN_ACCESO };
        }

        // 2. El desajuste corta aqui. No se «corrige» silenciosamente usando el
        //    dueño real: si los dos identificadores no cuadran, la peticion no
        //    es la que el formulario legitimo produce, y se rechaza.
        if (informe.patientId !== patientId) {
            console.warn(
                `[SECURITY WARN] IDOR blocked | labReport=${labReportId} ` +
                `owner=patient:${informe.patientId} recibido=patient:${patientId}`
            );
            return { success: false, error: MENSAJE_SIN_ACCESO };
        }

        // 3. Y ahora si: autorizar sobre el dueño real.
        await validatePatientAccess(informe.patientId);

        // 4. Las dos escrituras van juntas. Antes, si el `create` fallaba, el
        //    informe quedaba marcado como validado sin que existiera el test.
        await prisma.$transaction(async (tx) => {
            await tx.labReport.update({
                where: { id: labReportId },
                data: {
                    validatedData: validatedData,
                    isValidated: true,
                },
            });

            if (validatedData?.reportType === 'TELOTEST') {
                await tx.geneticTest.create({
                    data: {
                        patientId: informe.patientId,
                        chronologicalAge: chronologicalAge,
                        averageTelomereLength: validatedData.averageTelomereLength || '',
                        biologicalAge: validatedData.estimatedBiologicalAge || 0,
                        differentialAge: validatedData.agingDifference || 0,
                        interpretation: validatedData.interpretation || null,
                        therapeuticResults: validatedData.therapeuticRecommendations || null,
                        recommendations: validatedData.generalRecommendations || null,
                        testDate: new Date(testDate),
                    },
                });
            }
        });

        revalidatePath(`/historias/${informe.patientId}`);
        return { success: true };
    } catch (error: any) {
        const errorDeAcceso = mensajeDeErrorDeAcceso(error);
        if (errorDeAcceso) return { success: false, error: errorDeAcceso };

        console.error('Error validating lab report:', error);
        // El mensaje del error interno no se devuelve al cliente: puede llevar
        // dentro nombres de columna o fragmentos de la consulta.
        return { success: false, error: 'Error al validar el informe.' };
    }
}
