import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import * as z from 'zod';
import bcrypt from 'bcryptjs';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const professionalSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    role: z.enum(['ADMIN', 'MEDICO', 'COACH']),
    status: z.enum(['ACTIVO', 'INACTIVO']),
    cedula: z.string().optional(),
});

export async function GET() {
    try {
        const professionals = await prisma.user.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
            }
        });

        // Calcular balances del Ledger para cada profesional
        const professionalsWithBalances = await Promise.all(
            professionals.map(async (prof) => {
                const aggregations = await prisma.creditTransaction.groupBy({
                    by: ['testType'],
                    where: { userId: prof.id },
                    _sum: { amount: true },
                });

                const balances = {
                    BIOFISICA: 0,
                    BIOQUIMICA: 0,
                    ORTOMOLECULAR: 0,
                    GENETICA: 0,
                };

                for (const agg of aggregations) {
                    balances[agg.testType] = agg._sum.amount ?? 0;
                }

                return { ...prof, balances };
            })
        );

        return NextResponse.json(professionalsWithBalances);
    } catch (error) {
        console.error('Error fetching professionals:', error);
        return NextResponse.json({ error: 'Error fetching professionals' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password, role, status } = body;

        // 1. VALIDATION: Check if email exists before creating
        const existing = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() }
        });

        if (existing) {
            return NextResponse.json(
                { error: 'El correo electrónico ya está registrado' },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password || '123456', 10);

        // 2. CREATE user — sin quotaMax/quotaUsed (ahora usa Ledger)
        try {
            const newUser = await prisma.user.create({
                data: {
                    name,
                    email: email.toLowerCase().trim(),
                    password: hashedPassword,
                    role: role || 'MEDICO',
                    status: status || 'ACTIVO',
                }
            });

            return NextResponse.json(newUser);
        } catch (prismaError) {
            console.error('🔥 PRISMA ERROR:', prismaError);
            return NextResponse.json(
                { error: 'Error de base de datos al crear el usuario. Verifique los campos obligatorios.' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('🔥 SERVER ERROR:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, ...data } = body;

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                name: data.name,
                email: data.email,
                role: data.role,
                status: data.status,
            }
        });
        return NextResponse.json(updatedUser);
    } catch (error) {
        return NextResponse.json({ error: 'Error updating professional' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await prisma.user.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting professional' }, { status: 500 });
    }
}
