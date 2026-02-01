'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function rechargeProfessionalQuota(userId: string, amount: number) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
        return { success: false, error: 'No autorizado' };
    }

    try {
        const numericAmount = Number(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return { success: false, error: 'Cantidad inválida' };
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                quotaMax: {
                    increment: numericAmount
                }
            }
        });

        revalidatePath('/profesionales');
        return { success: true, newQuota: updatedUser.quotaMax - updatedUser.quotaUsed };
    } catch (error) {
        console.error('Error recharging quota:', error);
        return { success: false, error: 'Error al recargar cuota' };
    }
}
