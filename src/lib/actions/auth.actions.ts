'use server';

import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const signUpSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().min(1, 'El nombre es requerido'),
  role: z.enum(['MEDICO', 'ADMIN']).default('MEDICO'),
});

const signInSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export async function signUp(formData: z.infer<typeof signUpSchema>) {
  try {
    const validatedData = signUpSchema.parse(formData);

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return { success: false, error: 'El email ya está registrado' };
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        role: validatedData.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return { success: true, user };
  } catch (error) {
    console.error('Error en registro:', error);
    return { success: false, error: 'Error al registrar el usuario' };
  }
}

export async function signIn(formData: z.infer<typeof signInSchema>) {
  try {
    const validatedData = signInSchema.parse(formData);

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      return { success: false, error: 'Credenciales inválidas' };
    }

    const passwordMatch = await bcrypt.compare(validatedData.password, user.password!);

    if (!passwordMatch) {
      return { success: false, error: 'Credenciales inválidas' };
    }

    const { password, ...userWithoutPassword } = user;

    return { success: true, user: userWithoutPassword };
  } catch (error) {
    console.error('Error en login:', error);
    return { success: false, error: 'Error al iniciar sesión' };
  }
}

export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        // ===== INICIO DE LA CORRECCIÓN =====
        // Se cambia 'avatar' por 'image' para que coincida con el schema.prisma actual.
        image: true,
        // ===== FIN DE LA CORRECCIÓN =====
      },
    });

    if (!user) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    return { success: true, user };
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return { success: false, error: 'Error al obtener el usuario' };
  }
}

export async function updateMyPassword(newPassword: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "No autenticado" };
    }

    // 1. Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 2. Extraer permisos actuales y retirar el flag
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    const currentPerms = (user?.permissions as Record<string, boolean>) || {};

    // 3. Actualizar el usuario actual
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        password: hashedPassword,
        permissions: { ...currentPerms, forcePasswordChange: false }
      },
    });

    console.log(`✅ [updateMyPassword] Contraseña actualizada para user=${session.user.id}`);

    return {
      success: true,
      message: "Credenciales actualizadas exitosamente."
    };
  } catch (error) {
    console.error("❌ [updateMyPassword] Error al actualizar:", error);
    return {
      success: false,
      error: "Error interno al actualizar las credenciales."
    };
  }
}
