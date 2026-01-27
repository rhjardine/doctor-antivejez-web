import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("Authorization");
        const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

        if (!token) {
            return NextResponse.json({ error: "Token missing" }, { status: 401 });
        }

        // Security: Verify token and extract ID from payload, NOT body
        const payload = await verifyToken(token);

        if (!payload || !payload.id || payload.role !== 'PATIENT') {
            // Strict Role Check: Only PATIENT role can submit adherence
            return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
        }

        // Extract data from body, but ignore any patientId passed manually
        const { type, points, notes, metadata } = await req.json();

        if (!type || !points) {
            return NextResponse.json({ error: "Invalid data structure" }, { status: 400 });
        }

        // Clinical Rigor: Create transaction tied strictly to the authenticated user ID
        // First, find the patient record associated with this User ID
        const patient = await db.patient.findFirst({
            where: { userId: payload.id }
        });

        if (!patient) {
            return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });
        }

        const transaction = await db.omicTransaction.create({
            data: {
                patientId: patient.id, // SECURE: sourced from DB relation to verified Token ID
                type,
                pointsEarned: points,
                pointsPotential: 100, // Default potential
                source: 'MANUAL',     // Defaulting to MANUAL for mobile check-ins
                notes: notes || null,
                metadata: metadata || undefined
            }
        });

        return NextResponse.json({ success: true, transactionId: transaction.id });
    } catch (error) {
        console.error("Adherence Sync Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
