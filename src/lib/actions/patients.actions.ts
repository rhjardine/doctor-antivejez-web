'use server';

import { prisma } from '@/lib/db';
import { Patient } from '@prisma/client';
import { PatientFormData, patientSchema } from '@/utils/validation';
import { calculateAge } from '@/utils/date';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

export async function createPatient(formData: PatientFormData & { userId: string }) {
  console.log('--- createPatient formData ---', formData);
  console.log('--- createPatient formData.userId ---', formData?.userId);
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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002: Unique constraint failed
      if (error.code === 'P2002') {
        const target = (error.meta?.target as string[])?.join(', ');
        if (target === 'identification') { // Asegúrate de que es por el campo 'identification'
          return {
            success: false,
            error: `Ya existe un paciente con esta identificación (${formData.identification}). Por favor, inicie una búsqueda.`,
            errorCode: 'PATIENT_EXISTS', // Código de error personalizado para el frontend
            identification: formData.identification,
          };
        }
      }
    }
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
    await prisma.biophysicsTest.deleteMany({
      where: { patientId: id },
    });
    await prisma.patient.delete({
      where: { id },
    });
    revalidatePath('/historias');
    return { success: true };
  } catch (error) {
    console.error('Error eliminando paciente:', error);
    return { success: false, error: 'Error al eliminar el paciente' };
  }
}

export async function getPatientWithTests(id: string) {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        biophysicsTests: {
          orderBy: { testDate: 'desc' },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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

export async function getAllPatients(userId?: string) {
  try {
    const where = userId ? { userId } : {};
    const patients = await prisma.patient.findMany({
      where,
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
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, patients };
  } catch (error) {
    console.error('Error obteniendo pacientes:', error);
    return { success: false, error: 'Error al obtener los pacientes', patients: [] };
  }
}

export async function searchPatients(query: string) {
  try {
    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { identification: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, patients };
  } catch (error) {
    console.error('Error buscando pacientes:', error);
    return { success: false, error: 'Error al buscar pacientes', patients: [] };
  }
}