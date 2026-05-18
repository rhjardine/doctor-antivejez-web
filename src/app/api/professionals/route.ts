import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function requireAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return null; // null = autorizado
}

// ─── Zod Schemas (Tolerantes a Mayúsculas/Minúsculas) ─────────────────────────

const ProfessionalSchema = z.object({
    name: z.string().min(2, "Nombre requerido"),
    email: z.string().email("Email inválido"),
    password: z.string().optional(),
    // z.preprocess transforma el valor entrante a MAYÚSCULAS antes de validar
    role: z.preprocess(
        (val) => (typeof val === 'string' ? val.toUpperCase() : val),
        z.enum(['ADMIN', 'MEDICO', 'COACH', 'ADMINISTRATIVO'])
    ),
    status: z.preprocess(
        (val) => (typeof val === 'string' ? val.toUpperCase() : val),
        z.string().optional()
    ),
});

const UpdateProfessionalSchema = ProfessionalSchema.extend({
    id: z.string().min(1, "ID requerido"),
}).partial({ password: true });

// ─── GET — Listar profesionales (N+1 eliminado) ───────────────────────────────

export async function GET() {
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        // 1. Un solo round-trip: todos los usuarios (usando select explícito para asegurar tipos)
        const professionalsRaw = await prisma.user.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                // NO incluimos password aquí para evitar fugas
                permissions: true,
                availableTests: true
            }
        });

        // 2. Extraer IDs para el filtro del groupBy global
        const userIds = professionalsRaw.map(p => p.id);

        // 3. Un único groupBy para TODOS los usuarios — elimina el N+1
        const allBalances = await prisma.creditTransaction.groupBy({
            by: ['userId', 'testType'],
            where: { userId: { in: userIds } },
            _sum: { amount: true },
        });

        // 4. Reducción en memoria: O(M) donde M = filas del groupBy, no O(N×queries)
        const emptyBalances = () => ({ BIOFISICA: 0, BIOQUIMICA: 0, ORTOMOLECULAR: 0, GENETICA: 0 });

        const balancesByUserId = allBalances.reduce((acc, curr) => {
            if (!acc[curr.userId]) acc[curr.userId] = emptyBalances();
            acc[curr.userId][curr.testType] = curr._sum.amount ?? 0;
            return acc;
        }, {} as Record<string, ReturnType<typeof emptyBalances>>);

        // 5. Ensamblar respuesta final normalizando el estado
        const professionalsWithBalances = professionalsRaw.map(prof => ({
            ...prof,
            // Garantizamos que nunca devuelva null y siempre esté en mayúscula para la UI
            status: prof.status ? prof.status.toUpperCase() : 'ACTIVO',
            balances: balancesByUserId[prof.id] ?? emptyBalances(),
        }));

        return NextResponse.json(professionalsWithBalances);
    } catch (error) {
        console.error('Error fetching professionals:', error);
        return NextResponse.json({ error: 'Error al obtener profesionales' }, { status: 500 });
    }
}

// ─── POST — Crear profesional ─────────────────────────────────────────────────

export async function POST(req: Request) {
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        const body = await req.json();

        // Validación Zod
        const parsed = ProfessionalSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { name, email, password, role, status } = parsed.data;

        const existing = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'El correo electrónico ya está registrado' },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password || '123456', 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                role: role as any,
                status: status || 'ACTIVO',
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                permissions: true,
                availableTests: true
            }
        });

        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        console.error('Error creating professional:', error);
        return NextResponse.json(
            { error: 'Error al crear el profesional' },
            { status: 500 }
        );
    }
}

// ─── PUT — Actualizar profesional ─────────────────────────────────────────────

export async function PUT(req: Request) {
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        const body = await req.json();

        // Validación Zod
        const parsed = UpdateProfessionalSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { id, name, email, role, status } = parsed.data;

        const updatedUser = await prisma.user.update({
            where: { id },
            // Prisma ignorará automáticamente los campos que vengan como "undefined"
            data: {
                name,
                email,
                role: role as any,
                status
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                permissions: true,
                availableTests: true
            }
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error updating professional:', error);
        return NextResponse.json({ error: 'Error al actualizar el profesional' }, { status: 500 });
    }
}

// ─── DELETE — Eliminar profesional ────────────────────────────────────────────

export async function DELETE(req: Request) {
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
        }

        await prisma.user.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting professional:', error);
        return NextResponse.json({ error: 'Error al eliminar el profesional' }, { status: 500 });
    }
}