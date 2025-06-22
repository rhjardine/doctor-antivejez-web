
'use server';

import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const signUpSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().min(1, 'El nombre es requerido'),
  role: z.enum(['MEDICO', 'ADMINISTRATIVO']).default('MEDICO'),
});

const signInSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export async function signUp(formData: z.infer<typeof signUpSchema>) {
  try {
    const validatedData = signUpSchema.parse(formData);

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return { success: false, error: 'El email ya está registrado' };
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Crear el usuario
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

    // Buscar el usuario
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      return { success: false, error: 'Credenciales inválidas' };
    }

    // Verificar la contraseña
    const passwordMatch = await bcrypt.compare(validatedData.password, user.password);

    if (!passwordMatch) {
      return { success: false, error: 'Credenciales inválidas' };
    }

    // Retornar usuario sin la contraseña
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
        avatar: true,
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
