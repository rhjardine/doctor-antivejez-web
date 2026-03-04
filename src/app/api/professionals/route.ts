import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function requireAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return null; // null = autorizado
}

// ─── GET — Listar profesionales ───────────────────────────────────────────────

export async function GET() {
    // ✅ FIX: Protegido. Antes: cualquier request podía listar todos los médicos.
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        const professionals = await prisma.user.findMany({
            orderBy: { name: 'asc' },
            select: { id: true, name: true, email: true, role: true, status: true },
        });

        const professionalsWithBalances = await Promise.all(
            professionals.map(async (prof) => {
                const aggregations = await prisma.creditTransaction.groupBy({
                    by: ['testType'],
                    where: { userId: prof.id },
                    _sum: { amount: true },
                });

                const balances = { BIOFISICA: 0, BIOQUIMICA: 0, ORTOMOLECULAR: 0, GENETICA: 0 };
                for (const agg of aggregations) {
                    balances[agg.testType] = agg._sum.amount ?? 0;
                }

                return { ...prof, balances };
            })
        );

        return NextResponse.json(professionalsWithBalances);
    } catch (error) {
        console.error('Error fetching professionals:', error);
        return NextResponse.json({ error: 'Error al obtener profesionales' }, { status: 500 });
    }
}

// ─── POST — Crear profesional ─────────────────────────────────────────────────

export async function POST(req: Request) {
    // ✅ POST también requiere ADMIN
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        const body = await req.json();
        const { name, email, password, role, status } = body;

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
                role: role || 'MEDICO',
                status: status || 'ACTIVO',
            },
        });

        return NextResponse.json(newUser);
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
    // ✅ FIX: Protegido. Antes: cualquier request podía editar roles y datos.
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        const body = await req.json();
        const { id, name, email, role, status } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { name, email, role, status },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error updating professional:', error);
        return NextResponse.json({ error: 'Error al actualizar el profesional' }, { status: 500 });
    }
}

// ─── DELETE — Eliminar profesional ────────────────────────────────────────────

export async function DELETE(req: Request) {
    // ✅ FIX: Protegido. Antes: cualquier request podía eliminar usuarios.
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
