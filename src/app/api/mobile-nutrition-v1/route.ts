import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/jwt";

export const dynamic = 'force-dynamic';

const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // Allow mobile app access
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: Request) {
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

        const bloodType = patient.bloodType || 'O'; // Default to O if not set

        // 3. Determine Goal Group (A/AB -> A_AB, O/B -> O_B)
        // Logic: 
        // If patient is A or AB -> wants A_AB + ALL
        // If patient is O or B -> wants O_B + ALL
        // We filter out items that are specifically for the OTHER group.

        const targetGroup = (bloodType.includes('A') || bloodType.includes('AB')) ? 'A_AB' : 'O_B';

        // 4. Fetch Food Items
        // We fetch items that are either for ALL or match the specific target group
        const foodItems = await db.foodItem.findMany({
            where: {
                OR: [
                    { bloodTypeGroup: 'ALL' },
                    { bloodTypeGroup: targetGroup }
                ]
            },
            orderBy: {
                name: 'asc'
            }
        });

        // 5. Structure Response
        return NextResponse.json({
            success: true,
            bloodType: bloodType,
            compatibilityGroup: targetGroup,
            items: foodItems
        }, { headers: corsHeaders });

    } catch (error) {
        console.error("[MobileNutrition] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: corsHeaders });
    }
}
