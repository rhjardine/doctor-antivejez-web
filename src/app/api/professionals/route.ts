import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import * as z from 'zod';
import bcrypt from 'bcryptjs';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const professionalSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    role: z.enum(['ADMIN', 'MEDICO', 'COACH']), // Updated roles
    status: z.enum(['ACTIVO', 'INACTIVO']),
    cedula: z.string().optional(), // Adding fields mentioned in requirement if they exist or map to something
    // In User model we only have name, email, password, role, status. 
    // Should we store cedula? The User model in schema.prisma doesn't have cedula.
    // The requirement says: "Create/Edit Form: Include fields for Nationality, ID, Birthdate, Phone..."
    // If these fields are NOT in the User model, we can't store them unless we add them to schema.prisma or put them in a separate Profile model.
    // Given the instruction "Update schema.prisma. Ensure the User model includes: role, status, quotaMax, quotaUsed", 
    // it implies ONLY those fields were added.
    // User might expect us to add other fields too?
    // "Create/Edit Form: Include fields for Nationality, ID (cedula), Birthdate, Phone, Occupation..."
    // If I strictly follow "Ensure the User model includes: role, status, quotaMax, quotaUsed", then other fields are missing.
    // I will add them to the schema now to be safe and consistent with the form requirement.
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
                quotaMax: true,
                quotaUsed: true,
                // Add other fields if schema updated
            }
        });
        return NextResponse.json(professionals);
    } catch (error) {
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

        // 2. DEFAULT DATA & CREATE with Logging
        try {
            const newUser = await prisma.user.create({
                data: {
                    name,
                    email: email.toLowerCase().trim(),
                    password: hashedPassword,
                    role: role || 'MEDICO',
                    status: status || 'ACTIVO',
                    quotaMax: 100, // Explicitly sending default as requested
                    quotaUsed: 0,  // Explicitly sending 0 to avoid null constraints
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
                // quotaMax usually updated via recharge, but can be edited here too
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
