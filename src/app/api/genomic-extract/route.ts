// src/app/api/genomic-extract/route.ts
// Genomic Intelligence Module — API Endpoint
// Handles PDF upload, AI extraction, and LabReport lifecycle

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractGenomicData } from "@/lib/ai/genomic-parser";

export const dynamic = 'force-dynamic';

// Maximum processing time for large PDFs (71-page NutriGen)
export const maxDuration = 60;

const ALLOWED_ORIGINS = [
    "https://doctorantivejez-patients.onrender.com",
    "https://doctor-antivejez-web.onrender.com",
];

function getCorsHeaders(req: Request) {
    const origin = req.headers.get("origin") || "";
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    return {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
    };
}

export async function OPTIONS(req: Request) {
    return NextResponse.json({}, { headers: getCorsHeaders(req) });
}

export async function POST(req: Request) {
    const corsHeaders = getCorsHeaders(req);

    try {
        const body = await req.json();
        const { pdfBase64, patientId, reportType, testDate } = body;

        console.log(`[GenomicExtract API] Request received: patient=${patientId}, type=${reportType}, bodyLength=${JSON.stringify(body).length}`);

        // ── Validation ──────────────────────────────────────────
        if (!pdfBase64) {
            return NextResponse.json(
                { error: "El archivo PDF es requerido." },
                { status: 400, headers: corsHeaders }
            );
        }
        if (!patientId) {
            return NextResponse.json(
                { error: "El ID del paciente es requerido." },
                { status: 400, headers: corsHeaders }
            );
        }
        if (!reportType || !['TELOTEST', 'NUTRIGEN'].includes(reportType)) {
            return NextResponse.json(
                { error: "El tipo de reporte debe ser TELOTEST o NUTRIGEN." },
                { status: 400, headers: corsHeaders }
            );
        }

        // ── Verify patient exists ───────────────────────────────
        const patient = await prisma.patient.findUnique({
            where: { id: patientId },
            select: { id: true, firstName: true, lastName: true },
        });

        if (!patient) {
            return NextResponse.json(
                { error: "Paciente no encontrado." },
                { status: 404, headers: corsHeaders }
            );
        }

        // ── File size check (20MB limit) ────────────────────────
        const estimatedSize = (pdfBase64.length * 3) / 4; // base64 → bytes
        const MAX_SIZE = 20 * 1024 * 1024; // 20MB
        if (estimatedSize > MAX_SIZE) {
            return NextResponse.json(
                { error: "El archivo excede el tamaño máximo de 20MB." },
                { status: 413, headers: corsHeaders }
            );
        }

        // ── Create LabReport record (PENDING) ───────────────────
        const labReport = await prisma.labReport.create({
            data: {
                patientId,
                reportType: reportType as 'TELOTEST' | 'NUTRIGEN',
                fileName: body.fileName || `${reportType}_${Date.now()}.pdf`,
                processingStatus: 'PENDING',
                testDate: testDate ? new Date(testDate) : new Date(),
            },
        });

        // ── Update status to PROCESSING ─────────────────────────
        await prisma.labReport.update({
            where: { id: labReport.id },
            data: { processingStatus: 'PROCESSING' },
        });

        // ── AI Extraction ───────────────────────────────────────
        console.log(`[GenomicExtract API] Starting AI extraction...`);
        const result = await extractGenomicData(pdfBase64, reportType);
        console.log(`[GenomicExtract API] AI Extraction finished: success=${result.success}`);

        if (!result.success || !result.data) {
            // Update LabReport with ERROR status
            await prisma.labReport.update({
                where: { id: labReport.id },
                data: {
                    processingStatus: 'ERROR',
                    errorMessage: result.clinicalError || 'Error desconocido en el procesamiento.',
                },
            });

            return NextResponse.json(
                {
                    labReportId: labReport.id,
                    processingStatus: 'ERROR',
                    clinicalError: result.clinicalError,
                },
                { status: 422, headers: corsHeaders }
            );
        }

        // ── Save extracted data (COMPLETED) ─────────────────────
        const updatedReport = await prisma.labReport.update({
            where: { id: labReport.id },
            data: {
                processingStatus: 'COMPLETED',
                extractedData: result.data as any,
            },
        });

        return NextResponse.json(
            {
                labReportId: updatedReport.id,
                processingStatus: 'COMPLETED',
                extractedData: result.data,
                patientName: `${patient.firstName} ${patient.lastName}`,
            },
            { headers: corsHeaders }
        );

    } catch (error: any) {
        console.error("[GenomicExtract API] Error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor al procesar el informe genómico." },
            { status: 500, headers: getCorsHeaders(req) }
        );
    }
}
