'use server';

import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { PatientFormData, patientSchema } from '@/utils/validation';
import { calculateAge } from '@/utils/date';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { validatePatientAccess, requireSession } from '@/lib/auth-guards';

export async function createPatient(formData: PatientFormData & { userId: string }) {

  try {
    // Obtener sesión para extraer tenantId del profesional autenticado
    const session = await getServerSession(authOptions);

    // Extraer pwaPassword antes de enviar a Prisma (no es campo de BD)
    const { pwaPassword, ...restFormData } = formData;
    const validatedData = patientSchema.parse(formData);
    const chronologicalAge = calculateAge(validatedData.birthDate);

    // ================================================================
    // FASE 4 — PRE-CHECK: Verificar duplicado de identificación
    // Previene el error P2002 y devuelve un mensaje claro al usuario.
    // Fail Fast: detectar el conflicto antes de intentar el INSERT.
    // ================================================================
    const existingPatient = await prisma.patient.findUnique({
      where: { identification: validatedData.identification },
      select: { id: true },
    });

    if (existingPatient) {
      return {
        success: false,
        error: `El paciente con identificación ${validatedData.identification} ya existe en el sistema. Si este es tu paciente, contacte al Administrador para reasignarlo.`,
      };
    }

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
        tenantId: session?.user?.tenantId ?? null, // ← Asociar al tenant de la clínica
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
    // ── IDOR GUARD (Centralizado) ───────────────────────────────────────────────
    await validatePatientAccess(id);
    // ────────────────────────────────────────────────────────────────────────────

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

    // ── OCC: Incrementar version atómicamente ─────────────────────────────────
    // La plataforma web siempre gana (no envía version), pero al incrementarla
    // invalida el caché de la PWA y fuerza un re-fetch antes de sincronizar.
    updateData.version = { increment: 1 };
    // ────────────────────────────────────────────────────────────────────────────

    const patient = await prisma.patient.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/historias');
    revalidatePath(`/historias/${id}`);
    return { success: true, patient };
  } catch (error) {
    console.error('Error actualizando paciente:', error);
    const msg = error instanceof Error ? error.message : 'Error al actualizar el paciente';
    return { success: false, error: msg };
  }
}

export async function deletePatient(id: string) {
  try {
    // ── IDOR GUARD (Centralizado) ───────────────────────────────────────────────
    await validatePatientAccess(id);
    // ────────────────────────────────────────────────────────────────────────────

    // Soft Delete: actualizamos deletedAt en lugar de destruir el registro.
    // El historial clínico (tests, citas, guías) se preserva intacto en la BD.
    // OCC: incrementar version para invalidar el caché de la PWA.
    await prisma.patient.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        version: { increment: 1 },
      },
    });
    revalidatePath('/historias');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error eliminando paciente:', error);
    const msg = error instanceof Error ? error.message : 'Error al eliminar el paciente';
    return { success: false, error: msg };
  }
}

export async function getPatientDetails(id: string) {
  try {
    // ── IDOR GUARD (Centralizado) ───────────────────────────────────────────────
    await validatePatientAccess(id);
    // ────────────────────────────────────────────────────────────────────────────

    const patient = await prisma.patient.findUnique({
      where: { id },
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
    const msg = error instanceof Error ? error.message : 'Error al obtener el paciente';
    return { success: false, error: msg };
  }
}

export async function getPatientBiophysicsTrends(id: string) {
  try {
    // ── IDOR GUARD (Centralizado) ───────────────────────────────────────────────
    await validatePatientAccess(id);
    // ────────────────────────────────────────────────────────────────────────────

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
    const msg = error instanceof Error ? error.message : 'Error al obtener tendencias';
    return { success: false, error: msg, trends: [] };
  }
}


export async function getPaginatedPatients({ page = 1, limit = 10, userId }: { page?: number; limit?: number; userId?: string } = {}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw new Error("No autorizado");

    const skip = (page - 1) * limit;

    // ✅ MULTI-TENANT SCOPING
    // ADMIN: ve todo; MEDICO/COACH con tenantId: ve su clínica; fallback a userId.
    const { tenantId: sessionTenantId, role: sessionRole, id: sessionUserId } = session.user;
    const isAdmin = sessionRole === 'ADMIN';

    let where: Prisma.PatientWhereInput;
    if (isAdmin) {
      // Admin: filtro opcional por userId (para ver pacientes de un médico específico), siempre sin deletedAt
      where = userId ? { userId, deletedAt: null } : { deletedAt: null };
    } else if (sessionTenantId) {
      // Profesional con tenant: ve todos los pacientes de su clínica
      where = { tenantId: sessionTenantId, deletedAt: null };
    } else {
      // Fallback legacy: sin tenant, aislar por userId
      where = { userId: sessionUserId, deletedAt: null };
    }

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

    // ✅ MULTI-TENANT SCOPING para búsqueda
    const { tenantId: sessionTenantId, role: sessionRole, id: sessionUserId } = session.user;
    const isAdmin = sessionRole === 'ADMIN';

    // Construir filtro de scope según tenant
    const scopeFilter: Prisma.PatientWhereInput = isAdmin
      ? (userId ? { userId } : {})
      : sessionTenantId
        ? { tenantId: sessionTenantId }
        : { userId: sessionUserId };

    const queryParts = query.trim().split(/\s+/).filter(part => part.length > 0);
    const isNumericQuery = !isNaN(parseFloat(query)) && isFinite(Number(query));

    const whereClause: Prisma.PatientWhereInput = {
      AND: [
        scopeFilter,           // Filtro de scope: tenant, userId o vacío (admin)
        { deletedAt: null },   // Excluir pacientes eliminados lógicamente
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