'use server';

import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { PatientFormData, patientSchema } from '@/utils/validation';
import { calculateAge } from '@/utils/date';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function createPatient(formData: PatientFormData & { userId: string }) {

  try {
    // Extraer pwaPassword antes de enviar a Prisma (no es campo de BD)
    const { pwaPassword, ...restFormData } = formData;
    const validatedData = patientSchema.parse(formData);
    const chronologicalAge = calculateAge(validatedData.birthDate);

    // ✅ SEGURIDAD: hashear la contraseña antes de persistir
    let passwordHash: string | undefined = undefined;
    if (pwaPassword && pwaPassword.trim() !== '') {
      passwordHash = await bcrypt.hash(pwaPassword.trim(), 12);
    }

    // Desestructurar para excluir pwaPassword del objeto que va a Prisma
    const { pwaPassword: _pw, ...prismaFields } = validatedData;

    const patient = await prisma.patient.create({
      data: {
        ...prismaFields,
        userId: formData.userId,
        historyDate: new Date(validatedData.historyDate),
        birthDate: new Date(validatedData.birthDate),
        chronologicalAge,
        ...(passwordHash ? { passwordHash } : {}),
      },
    });

    revalidatePath('/historias');
    revalidatePath('/dashboard');

    return { success: true, patient };
  } catch (error) {
    console.error('Error creando paciente:', error);

    // ✅ ÚNICO CAMBIO: Se mejora el manejo de errores para detectar duplicados.
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = error.meta?.target as string[];
        if (target && target.includes('identification')) {
          return { success: false, error: 'Ya existe un paciente con este número de identificación.' };
        }
      }
    }

    // Se mantiene el error genérico para otros casos.
    return { success: false, error: 'Error al crear el paciente' };
  }
}

// --- EL RESTO DEL ARCHIVO PERMANECE EXACTAMENTE IGUAL ---

export async function updatePatient(id: string, formData: Partial<PatientFormData>) {
  try {
    // Extraer pwaPassword del formData antes de pasar a Prisma
    const { pwaPassword, ...restFormData } = formData;
    let updateData: any = { ...restFormData };

    if (restFormData.birthDate) {
      updateData.birthDate = new Date(restFormData.birthDate);
      updateData.chronologicalAge = calculateAge(restFormData.birthDate);
    }
    if (restFormData.historyDate) {
      updateData.historyDate = new Date(restFormData.historyDate);
    }

    // ✅ SEGURIDAD: solo actualizar passwordHash si el médico ingresó nueva contraseña
    if (pwaPassword && pwaPassword.trim() !== '') {
      updateData.passwordHash = await bcrypt.hash(pwaPassword.trim(), 12);
    }

    const patient = await prisma.patient.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/historias');
    revalidatePath(`/historias/${id}`);
    return { success: true, patient };
  } catch (error) {
    console.error('Error actualizando paciente:', error);
    return { success: false, error: 'Error al actualizar el paciente' };
  }
}

export async function deletePatient(id: string) {
  try {
    await prisma.$transaction([
      prisma.appointment.deleteMany({ where: { patientId: id } }),
      prisma.biochemistryTest.deleteMany({ where: { patientId: id } }),
      prisma.biophysicsTest.deleteMany({ where: { patientId: id } }),
      prisma.patient.delete({ where: { id } }),
    ]);
    revalidatePath('/historias');
    return { success: true };
  } catch (error) {
    console.error('Error eliminando paciente:', error);
    return { success: false, error: 'Error al eliminar el paciente' };
  }
}

export async function getPatientDetails(id: string) {
  try {
    // ✅ SECURITY: Ownership check — un médico solo ve sus propios pacientes
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: 'No autorizado' };
    }

    // ADMIN ve todos, MEDICO/COACH solo los suyos
    const whereClause = session.user.role === 'ADMIN'
      ? { id }
      : { id, userId: session.user.id };

    const patient = await prisma.patient.findFirst({
      where: whereClause,
      include: {
        biophysicsTests: {
          orderBy: { testDate: 'desc' },
        },
        biochemistryTests: {
          orderBy: { testDate: 'desc' },
        },
        orthomolecularTests: {
          orderBy: { testDate: 'desc' },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        appointments: {
          orderBy: { date: 'asc' },
        },
        guides: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
    });

    if (!patient) {
      return { success: false, error: 'Paciente no encontrado' };
    }

    // [FIX] Recalculate age dynamically to ensure accuracy (fix stale DB data)
    if (patient.birthDate) {
      patient.chronologicalAge = calculateAge(patient.birthDate);
    }

    // ✅ SEGURIDAD: excluir passwordHash antes de retornar al cliente
    const { passwordHash: _ph, ...safePatient } = patient as any;
    return { success: true, patient: safePatient };
  } catch (error) {
    console.error('Error obteniendo paciente:', error);
    return { success: false, error: 'Error al obtener el paciente' };
  }
}

export async function getPatientBiophysicsTrends(id: string) {
  try {
    const trends = await prisma.biophysicsTest.findMany({
      where: { patientId: id },
      select: {
        testDate: true,
        chronologicalAge: true,
        biologicalAge: true,
      },
      orderBy: { testDate: 'asc' }, // Ascending for time series chart
    });

    return { success: true, trends };
  } catch (error) {
    console.error('Error obteniendo tendencias:', error);
    return { success: false, error: 'Error al obtener tendencias', trends: [] };
  }
}


export async function getPaginatedPatients({ page = 1, limit = 10, userId }: { page?: number; limit?: number; userId?: string } = {}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("No autorizado");

    const skip = (page - 1) * limit;

    // ✅ VISIBILIDAD DE DATOS (Protección Richard Jardine)
    // Si es ADMIN, ve todo (o filtro opcional userId). 
    // Si es MEDICO/COACH, forzamos su propio ID.
    const effectiveUserId = session.user.role === 'ADMIN'
      ? userId
      : session.user.id;

    const where = effectiveUserId ? { userId: effectiveUserId } : {};

    const [patients, totalPatients] = await prisma.$transaction([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          biophysicsTests: {
            orderBy: { testDate: 'desc' },
            take: 1,
          },
          appointments: {
            where: {
              date: {
                gte: new Date()
              },
              status: 'SCHEDULED'
            },
            orderBy: {
              date: 'asc'
            },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.patient.count({ where }),
    ]);

    // ✅ SEGURIDAD: excluir passwordHash de cada paciente
    const safePatients = patients.map(({ passwordHash, ...rest }: any) => rest);
    const totalPages = Math.ceil(totalPatients / limit);
    return { success: true, patients: safePatients, totalPages, currentPage: page };
  } catch (error) {
    console.error('Error obteniendo pacientes:', error);
    return { success: false, error: 'Error al obtener los pacientes', patients: [], totalPages: 0, currentPage: 1 };
  }
}

export async function searchPatients({ query, userId, page = 1, limit = 10 }: { query: string; userId: string; page?: number; limit?: number; }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("No autorizado");

    // ✅ VISIBILIDAD DE DATOS
    const effectiveUserId = session.user.role === 'ADMIN'
      ? userId
      : session.user.id;

    const queryParts = query.trim().split(/\s+/).filter(part => part.length > 0);
    const isNumericQuery = !isNaN(parseFloat(query)) && isFinite(Number(query));

    const whereClause: Prisma.PatientWhereInput = {
      AND: [
        ...(effectiveUserId ? [{ userId: effectiveUserId }] : []),
        {
          OR: [
            // Búsqueda por partes (Nombre y Apellido)
            ...queryParts.map(part => ({
              OR: [
                { firstName: { contains: part, mode: 'insensitive' as const } },
                { lastName: { contains: part, mode: 'insensitive' as const } },
              ]
            })),
            // Búsqueda exacta/parcial por identificación
            { identification: { contains: query, mode: 'insensitive' as const } },
            // Búsqueda por email
            { email: { contains: query, mode: 'insensitive' as const } },
            // Búsqueda por número de control si es numérico
            ...(isNumericQuery ? [{ controlNumber: { equals: Number(query) } }] : []),
          ],
        }
      ]
    };

    const skip = (page - 1) * limit;

    const [patients, totalPatients] = await prisma.$transaction([
      prisma.patient.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          biophysicsTests: {
            orderBy: { testDate: 'desc' },
            take: 1,
          },
          appointments: {
            where: {
              date: {
                gte: new Date()
              },
              status: 'SCHEDULED'
            },
            orderBy: {
              date: 'asc'
            },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.patient.count({ where: whereClause })
    ]);

    // ✅ SEGURIDAD: excluir passwordHash de cada paciente
    const safePatients = patients.map(({ passwordHash, ...rest }: any) => rest);
    const totalPages = Math.ceil(totalPatients / limit);
    return { success: true, patients: safePatients, totalPages, currentPage: page };
  } catch (error) {
    console.error('Error buscando pacientes:', error);
    return { success: false, error: 'Error al buscar pacientes', patients: [], totalPages: 0, currentPage: 1 };
  }
}