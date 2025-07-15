'use server';

import { prisma } from '@/lib/db';
import { Prisma, Patient } from '@prisma/client';
import { PatientFormData, patientSchema } from '@/utils/validation';
import { calculateAge } from '@/utils/date';
import { revalidatePath } from 'next/cache';

export async function createPatient(formData: PatientFormData & { userId: string }) {
  try {
    const validatedData = patientSchema.parse(formData);
    const chronologicalAge = calculateAge(validatedData.birthDate);

    const patient = await prisma.patient.create({
      data: {
        ...validatedData,
        userId: formData.userId,
        historyDate: new Date(validatedData.historyDate),
        birthDate: new Date(validatedData.birthDate),
        chronologicalAge,
      },
    });

    revalidatePath('/historias');
    return { success: true, patient };
  } catch (error) {
    console.error('Error creando paciente:', error);
    return { success: false, error: 'Error al crear el paciente' };
  }
}

export async function updatePatient(id: string, formData: Partial<PatientFormData>) {
  try {
    let updateData: any = { ...formData };

    if (formData.birthDate) {
      updateData.birthDate = new Date(formData.birthDate);
      updateData.chronologicalAge = calculateAge(formData.birthDate);
    }
    if (formData.historyDate) {
      updateData.historyDate = new Date(formData.historyDate);
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
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        biophysicsTests: {
          orderBy: { testDate: 'desc' },
        },
        biochemistryTests: {
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
        }
      },
    });

    if (!patient) {
      return { success: false, error: 'Paciente no encontrado' };
    }
    return { success: true, patient };
  } catch (error) {
    console.error('Error obteniendo paciente:', error);
    return { success: false, error: 'Error al obtener el paciente' };
  }
}


export async function getPaginatedPatients({ page = 1, limit = 10, userId }: { page?: number; limit?: number; userId?: string } = {}) {
  try {
    const skip = (page - 1) * limit;
    const where = userId ? { userId } : {};

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

    const totalPages = Math.ceil(totalPatients / limit);
    return { success: true, patients, totalPages, currentPage: page };
  } catch (error) {
    console.error('Error obteniendo pacientes:', error);
    return { success: false, error: 'Error al obtener los pacientes', patients: [], totalPages: 0, currentPage: 1 };
  }
}

// ===== INICIO DE LA MODIFICACIÓN =====
// Se añade el parámetro `userId` a la función y a la consulta.
export async function searchPatients({ query, userId, page = 1, limit = 10 }: { query: string; userId: string; page?: number; limit?: number; }) {
  try {
    const isNumericQuery = !isNaN(parseFloat(query)) && isFinite(Number(query));
    
    // La cláusula `where` ahora requiere que el `userId` coincida Y que se cumpla una de las condiciones de búsqueda.
    const whereClause: Prisma.PatientWhereInput = {
      AND: [
        { userId: userId },
        {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { identification: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
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
    
    const totalPages = Math.ceil(totalPatients / limit);
    return { success: true, patients, totalPages, currentPage: page };
  } catch (error) {
    console.error('Error buscando pacientes:', error);
    return { success: false, error: 'Error al buscar pacientes', patients: [], totalPages: 0, currentPage: 1 };
  }
}
