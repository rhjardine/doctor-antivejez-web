'use server';

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TestType } from '@prisma/client';

// =============================================================================
// TYPES
// =============================================================================
export type DoctorBalances = Record<TestType, number>;

// =============================================================================
// getDoctorBalances — Calcula el saldo por tipo de test usando SUM agrupado
// =============================================================================
export async function getDoctorBalances(doctorId: string): Promise<DoctorBalances> {
    const aggregations = await db.creditTransaction.groupBy({
        by: ['testType'],
        where: { userId: doctorId },
        _sum: { amount: true },
    });

    // Inicializar todos los tipos en 0
    const balances: DoctorBalances = {
        BIOFISICA: 0,
        BIOQUIMICA: 0,
        ORTOMOLECULAR: 0,
        GENETICA: 0,
    };

    // Llenar con los valores reales del aggregation
    for (const agg of aggregations) {
        balances[agg.testType] = agg._sum.amount ?? 0;
    }

    return balances;
}

// =============================================================================
// rechargeCredits — Solo ADMIN. Inserta registro positivo en el Ledger.
// =============================================================================
export async function rechargeCredits(
    doctorId: string,
    testType: TestType,
    amount: number
) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
        return { success: false, error: 'No autorizado. Solo ADMIN puede recargar créditos.' };
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0 || numericAmount > 100) {
        return { success: false, error: 'Cantidad inválida (debe ser entre 1 y 100).' };
    }

    try {
        // Verificar que el saldo resultante no exceda 100
        const currentBalances = await getDoctorBalances(doctorId);
        const newBalance = currentBalances[testType] + numericAmount;

        if (newBalance > 100) {
            return {
                success: false,
                error: `Excede el máximo de 100 créditos. Saldo actual: ${currentBalances[testType]}, intento de recarga: ${numericAmount}.`,
            };
        }

        await db.creditTransaction.create({
            data: {
                userId: doctorId,
                testType,
                amount: numericAmount,
                description: `Recarga Admin (${session.user.name || 'SuperAdmin'})`,
            },
        });

        revalidatePath('/profesionales');
        return { success: true, newBalance };
    } catch (error) {
        console.error('Error recharging credits:', error);
        return { success: false, error: 'Error al recargar créditos.' };
    }
}

// =============================================================================
// consumeTestCredit — Usa $transaction para atomicidad. Debita 1 crédito.
// =============================================================================
export async function consumeTestCredit(
    doctorId: string,
    testType: TestType,
    description: string
): Promise<{ success: boolean; error?: string }> {
    return await db.$transaction(async (tx) => {
        // 1. Calcular saldo actual DENTRO de la transacción
        const aggregation = await tx.creditTransaction.aggregate({
            where: { userId: doctorId, testType },
            _sum: { amount: true },
        });

        const currentBalance = aggregation._sum.amount ?? 0;

        if (currentBalance <= 0) {
            throw new Error(
                `Créditos insuficientes para ${testType}. Saldo actual: ${currentBalance}. Contacte al administrador.`
            );
        }

        // 2. Insertar registro de consumo (-1)
        await tx.creditTransaction.create({
            data: {
                userId: doctorId,
                testType,
                amount: -1,
                description,
            },
        });

        return { success: true };
    }).catch((error) => {
        console.error('Error consuming test credit:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error al consumir crédito.',
        };
    });
}
