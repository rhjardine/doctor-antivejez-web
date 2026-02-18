import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log("🛠️ [DB-Repair] Starting database schema repair...");

        // 1. Create FoodCategory ENUM if it doesn't exist
        await db.$executeRawUnsafe(`
            DO $$ BEGIN
                CREATE TYPE "FoodCategory" AS ENUM ('BENEFICIAL', 'NEUTRAL', 'AVOID');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);
        console.log("✅ [DB-Repair] Enum FoodCategory verified/created.");

        // 2. Add category column to food_items
        // We use a DO block to check if column exists before adding to prevent errors
        await db.$executeRawUnsafe(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name = 'food_items' AND column_name = 'category'
                ) THEN
                    ALTER TABLE "food_items" ADD COLUMN "category" "FoodCategory" NOT NULL DEFAULT 'BENEFICIAL';
                END IF;
            END $$;
        `);
        console.log("✅ [DB-Repair] Column 'category' added to 'food_items'.");

        // 3. Optional: Verify alignment for other potential missing fields in relevant tables
        // For now, focusing on the blocker identified: food_items.category

        return NextResponse.json({
            success: true,
            message: "Database schema repaired successfully.",
            applied_actions: [
                "Created/Verified ENUM 'FoodCategory'",
                "Added column 'category' to 'food_items' table"
            ]
        });
    } catch (error) {
        console.error("🔥 [DB-Repair] Error:", error);
        return NextResponse.json({
            success: false,
            error: (error as Error).message
        }, { status: 500 });
    }
}
