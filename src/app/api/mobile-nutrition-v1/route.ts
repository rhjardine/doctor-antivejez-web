import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { getCorsHeaders, handleCorsPreflightOrReject } from "@/lib/cors";

export const dynamic = 'force-dynamic';

export async function OPTIONS(req: Request) {
    return handleCorsPreflightOrReject(req, "GET, OPTIONS");
}

export async function GET(req: Request) {
    const corsHeaders = getCorsHeaders(req, "GET, OPTIONS");

    try {
        // 1. Authorization Check
        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
        }

        const token = authHeader.split(" ")[1];
        const decoded = await verifyToken(token);

        if (!decoded || !decoded.id) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401, headers: corsHeaders });
        }

        // 2. Get Patient Blood Type
        const patient = await db.patient.findUnique({
            where: { id: decoded.id },
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
