// src/lib/actions/appointments.actions.ts
'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { validatePatientAccess, validateAppointmentAccess, requireSession } from '@/lib/auth-guards';

// --- CORRECCIÓN: Se elimina 'userId' del esquema de creación. ---
// La cita se relaciona con el usuario a través del paciente, por lo que
// userId no es un campo directo del modelo Appointment.
const appointmentSchema = z.object({
  patientId: z.string().min(1, "El paciente es requerido."),
  date: z.date({ required_error: "La fecha es requerida." }),
  reason: z.string().min(3, "El motivo debe tener al menos 3 caracteres."),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).default('SCHEDULED'),
});

/**
 * Crea una nueva cita en la base de datos.
 * @param data - Datos de la cita a crear.
 */
export async function createAppointment(data: {
  patientId: string;
  userId: string; // Se mantiene para futuras validaciones de permisos, pero no se inserta.
  date: Date;
  reason: string;
}) {
  try {
    // IDOR GUARD: verificar acceso al paciente antes de crear la cita
    await validatePatientAccess(data.patientId);

    // Se validan solo los datos que corresponden al modelo Appointment.
    const validatedData = appointmentSchema.parse({
      patientId: data.patientId,
      date: data.date,
      reason: data.reason,
    });
    
    // Se crea la cita solo con los campos validados del esquema.
    const appointment = await prisma.appointment.create({
      data: validatedData,
    });

    revalidatePath('/citas');
    revalidatePath(`/historias/${data.patientId}`);

    return { success: true, appointment };
  } catch (error) {
    console.error("Error al crear la cita:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Datos inválidos.", details: error.errors };
    }
    return { success: false, error: "No se pudo crear la cita." };
  }
}

/**
 * Obtiene las citas para un mes y usuario específicos.
 * @param userId - ID del usuario (profesional).
 * @param month - Fecha del mes a consultar.
 */
export async function getAppointmentsByMonth(userId: string, month: Date) {
  try {
    // Multi-Tenant scoping para citas
    const { session } = await requireSession();
    const isAdmin = session.user.role === 'ADMIN';
    const patientFilter = isAdmin
      ? {}
      : session.user.tenantId
        ? { tenantId: session.user.tenantId, deletedAt: null }
        : { userId: session.user.id, deletedAt: null };

    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const appointments = await prisma.appointment.findMany({
      where: {
        patient: patientFilter,
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return { success: true, appointments };
  } catch (error: any) {
    console.error("Error al obtener las citas:", error);
    return { success: false, error: error.message || "No se pudieron obtener las citas." };
  }
}

/**
 * Actualiza una cita existente.
 * @param id - ID de la cita a actualizar.
 * @param data - Datos a modificar.
 */
export async function updateAppointment(id: string, data: Partial<{
  patientId: string;
  date: Date;
  reason: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
}>) {
  try {
    // IDOR GUARD: verificar acceso a la cita antes de modificar
    await validateAppointmentAccess(id);

    const appointment = await prisma.appointment.update({
      where: { id },
      data,
    });

    revalidatePath('/citas');
    revalidatePath(`/historias/${appointment.patientId}`);
    
    return { success: true, appointment };
  } catch (error: any) {
    console.error("Error al actualizar la cita:", error);
    return { success: false, error: error.message || "No se pudo actualizar la cita." };
  }
}

/**
 * Elimina una cita de la base de datos.
 * @param id - ID de la cita a eliminar.
 */
export async function deleteAppointment(id: string) {
  try {
    // IDOR GUARD: verificar acceso a la cita antes de eliminar
    await validateAppointmentAccess(id);

    const appointment = await prisma.appointment.delete({
      where: { id },
    });

    revalidatePath('/citas');
    revalidatePath(`/historias/${appointment.patientId}`);

    return { success: true };
  } catch (error: any) {
    console.error("Error al eliminar la cita:", error);
    return { success: false, error: error.message || "No se pudo eliminar la cita." };
  }
}
