import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCorsHeaders, handleCorsPreflightOrReject } from "@/lib/cors";
import { validateMobileSession } from '@/lib/auth-guards';

export const dynamic = 'force-dynamic';

export async function OPTIONS(req: Request) {
    return handleCorsPreflightOrReject(req, "GET, OPTIONS");
}

export async function GET(req: Request) {
    const corsHeaders = getCorsHeaders(req, "GET, OPTIONS");

    try {
        // ── MOBILE AUTH GUARD (Centralizado) ──────────────────────────────────
        const session = await validateMobileSession(req);
        // ────────────────────────────────────────────────────────────────────────

        // Multi-Tenant + Soft Delete filter
        const tenantFilter = session.tenantId
            ? { id: session.id, tenantId: session.tenantId, deletedAt: null }
            : { id: session.id, deletedAt: null };

        // 2. Get Patient Blood Type
        const patient = await db.patient.findFirst({
            where: tenantFilter,
            select: { bloodType: true }
        });

        if (!patient) {
            return NextResponse.json({ error: "Patient not found" }, { status: 404, headers: corsHeaders });
        }

        const bloodType = patient.bloodType || 'O';

        // 3. Determine Goal Group
        const targetGroup = (bloodType.includes('A') || bloodType.includes('AB')) ? 'A_AB' : 'O_B';

        // 4. Fetch Food Items
        const foodItems = await db.foodItem.findMany({
            where: {
                OR: [
                    { bloodTypeGroup: 'ALL' },
                    { bloodTypeGroup: targetGroup }
                ]
            },
            orderBy: { name: 'asc' }
        });

        // 5. Structure Response
        return NextResponse.json({
            success: true,
            bloodType: bloodType,
            compatibilityGroup: targetGroup,
            items: foodItems
        }, { headers: corsHeaders });

    } catch (error) {
        console.error("[MobileNutrition] Error:", (error as Error).message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: corsHeaders });
    }
}
