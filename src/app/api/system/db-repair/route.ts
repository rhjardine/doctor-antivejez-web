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

        // 3. Create alimentacion_nutrigenomica table
        await db.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "alimentacion_nutrigenomica" (
                "id" TEXT NOT NULL,
                "patientId" TEXT NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "grupoSanguineo" TEXT NOT NULL DEFAULT 'O_B',
                "tipoNino" BOOLEAN NOT NULL DEFAULT false,
                "tipoMetabolica" BOOLEAN NOT NULL DEFAULT false,
                "tipoAntidiabetica" BOOLEAN NOT NULL DEFAULT false,
                "tipoCitostatica" BOOLEAN NOT NULL DEFAULT false,
                "tipoRenal" BOOLEAN NOT NULL DEFAULT false,
                "alimentosEvitar" TEXT,
                "sustitutos" TEXT,
                "planAlimentario" JSONB,
                "combinaciones" JSONB,
                "actividadFisica" JSONB,
                "claves5a" JSONB,
                "notasMedico" TEXT,
                "enviada" BOOLEAN NOT NULL DEFAULT false,
                "enviadaAt" TIMESTAMP(3),

                CONSTRAINT "alimentacion_nutrigenomica_pkey" PRIMARY KEY ("id")
            );
        `);
        console.log("✅ [DB-Repair] Table 'alimentacion_nutrigenomica' verified/created.");

        await db.$executeRawUnsafe(`
            CREATE UNIQUE INDEX IF NOT EXISTS "alimentacion_nutrigenomica_patientId_key" ON "alimentacion_nutrigenomica"("patientId");
        `);

        await db.$executeRawUnsafe(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM information_schema.table_constraints
                    WHERE constraint_name = 'alimentacion_nutrigenomica_patientId_fkey'
                ) THEN
                    ALTER TABLE "alimentacion_nutrigenomica" ADD CONSTRAINT "alimentacion_nutrigenomica_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
                END IF;
            END $$;
        `);
        console.log("✅ [DB-Repair] Foreign keys for 'alimentacion_nutrigenomica' verified/created.");

        // 4. Safely add NEW columns to alimentacion_nutrigenomica (additive-only, IF NOT EXISTS)
        // These were added in a recent schema update and may not exist in older DB instances.
        const newColumns = [
            { name: 'terapias4r', type: 'JSONB' },
            { name: 'alimentosEvitar', type: 'TEXT' },
            { name: 'sustitutos', type: 'TEXT' },
        ];

        for (const col of newColumns) {
            await db.$executeRawUnsafe(`
                DO $$ BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_name = 'alimentacion_nutrigenomica'
                          AND column_name = '${col.name}'
                    ) THEN
                        ALTER TABLE "alimentacion_nutrigenomica" ADD COLUMN "${col.name}" ${col.type};
                    END IF;
                END $$;
            `);
            console.log(`✅ [DB-Repair] Column '${col.name}' verified/added to 'alimentacion_nutrigenomica'.`);
        }

        return NextResponse.json({
            success: true,
            message: "Database schema repaired successfully.",
            applied_actions: [
                "Created/Verified ENUM 'FoodCategory'",
                "Added column 'category' to 'food_items' table (if missing)",
                "Created table 'alimentacion_nutrigenomica' and relations (if missing)",
                "Added columns 'terapias4r', 'alimentosEvitar', 'sustitutos' (if missing)"
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
