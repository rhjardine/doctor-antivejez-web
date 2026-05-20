/**
 * auth-guards.ts — Blindaje Anti-IDOR centralizado (P0)
 *
 * Helper DRY reutilizable para validación Multi-Tenant Zero-Trust.
 * Todas las Server Actions que acceden a registros clínicos sensibles
 * (pacientes, tests, guías, citas) deben invocar este guard.
 *
 * Principios:
 *  - Fail-Fast: Zod valida IDs antes de tocar la BD.
 *  - Zero-Trust: ADMIN = bypass; MEDICO/COACH = tenantId ∨ userId.
 *  - HIPAA-Safe Logging: Solo IDs opacos, nunca PHI (nombres, emails, docs).
 *  - DRY: Un solo punto de mantenimiento para la lógica de acceso.
 */

import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// ─── Zod Schemas ─── Fail-Fast validation ───────────────────────────────────

/** Valida que un ID sea un string CUID no vacío (formato Prisma default). */
const cuidSchema = z.string().min(1, 'ID requerido').max(30, 'ID inválido');

// ─── Return Types ───────────────────────────────────────────────────────────

export interface AuthorizedSession {
  session: {
    user: {
      id: string;
      role: string;
      tenantId?: string | null;
      [key: string]: any;
    };
  };
}

export interface PatientAccessResult extends AuthorizedSession {
  patient: {
    userId: string;
    tenantId: string | null;
  };
}

// ─── Error Codes ────────────────────────────────────────────────────────────

export const AUTH_ERRORS = {
  INVALID_ID: 'INVALID_INPUT: ID no válido o ausente',
  UNAUTHORIZED: 'UNAUTHORIZED: Sesión no válida',
  NOT_FOUND: 'NOT_FOUND: Registro no encontrado',
  FORBIDDEN: 'FORBIDDEN: Acceso denegado — Violación de aislamiento',
} as const;

// ─── Core Guard: Session ────────────────────────────────────────────────────

/**
 * Resuelve y valida la sesión del servidor.
 * @throws Error con código UNAUTHORIZED si la sesión es inválida.
 */
export async function requireSession(): Promise<AuthorizedSession> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error(AUTH_ERRORS.UNAUTHORIZED);
  }
  return { session } as AuthorizedSession;
}

// ─── Core Guard: Patient Tenant Access ──────────────────────────────────────

/**
 * Valida que el usuario en sesión tiene acceso al paciente especificado.
 *
 * Regla Zero-Trust:
 *  - ADMIN → bypass (acceso global).
 *  - MEDICO/COACH → tenantId coincide ∨ userId coincide (fallback legacy).
 *  - Ninguna coincidencia → FORBIDDEN + audit log seguro (sin PHI).
 *
 * @param patientId - ID del paciente a verificar (validado con Zod).
 * @returns Sesión autorizada + datos mínimos del paciente.
 * @throws Error con código semántico si falla cualquier validación.
 */
export async function validatePatientAccess(patientId: string): Promise<PatientAccessResult> {
  // 1. Fail-Fast: Zod valida formato del ID antes de tocar la BD
  const parseResult = cuidSchema.safeParse(patientId);
  if (!parseResult.success) {
    throw new Error(AUTH_ERRORS.INVALID_ID);
  }

  // 2. Resolver sesión
  const { session } = await requireSession();

  // 3. Lookup mínimo (solo campos de autorización, nunca PHI)
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { userId: true, tenantId: true },
  });

  if (!patient) {
    throw new Error(AUTH_ERRORS.NOT_FOUND);
  }

  // 4. Zero-Trust evaluation
  const isAdmin = session.user.role === 'ADMIN';
  const isOwner = patient.userId === session.user.id;
  const isSameTenant = Boolean(
    session.user.tenantId &&
    patient.tenantId &&
    session.user.tenantId === patient.tenantId
  );

  if (!isAdmin && !isOwner && !isSameTenant) {
    // Audit log HIPAA-safe: solo IDs opacos, nunca nombres/emails/documentos
    console.warn(
      `[SECURITY WARN] IDOR blocked | ` +
      `actor=${session.user.id} role=${session.user.role} ` +
      `actorTenant=${session.user.tenantId ?? 'NULL'} | ` +
      `target=patient:${patientId} ownerTenant=${patient.tenantId ?? 'NULL'}`
    );
    throw new Error(AUTH_ERRORS.FORBIDDEN);
  }

  return { session, patient } as PatientAccessResult;
}

// ─── Convenience: Validate Test ID via Patient ──────────────────────────────

/**
 * Para operaciones sobre tests (biofísica, bioquímica, etc.) donde se recibe
 * el testId y el patientId. Valida ambos IDs con Zod y luego verifica acceso
 * al paciente asociado.
 *
 * @param testId - ID del test (validado con Zod).
 * @param patientId - ID del paciente dueño del test (validado con Zod).
 * @returns Sesión autorizada + datos del paciente.
 */
export async function validateTestAccess(
  testId: string,
  patientId: string
): Promise<PatientAccessResult> {
  // Fail-Fast: ambos IDs deben ser válidos
  const testParse = cuidSchema.safeParse(testId);
  const patientParse = cuidSchema.safeParse(patientId);

  if (!testParse.success || !patientParse.success) {
    throw new Error(AUTH_ERRORS.INVALID_ID);
  }

  // Delegar al guard de paciente (el test hereda el aislamiento del paciente)
  return validatePatientAccess(patientId);
}

// ─── Convenience: Validate Appointment via Patient ──────────────────────────

/**
 * Para operaciones sobre citas. Resuelve el patientId de la cita
 * y delega la verificación de acceso al guard de paciente.
 *
 * @param appointmentId - ID de la cita (validado con Zod).
 * @returns Sesión autorizada + datos del paciente vinculado.
 */
export async function validateAppointmentAccess(
  appointmentId: string
): Promise<PatientAccessResult> {
  const parse = cuidSchema.safeParse(appointmentId);
  if (!parse.success) {
    throw new Error(AUTH_ERRORS.INVALID_ID);
  }

  const { session } = await requireSession();

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { patientId: true },
  });

  if (!appointment) {
    throw new Error(AUTH_ERRORS.NOT_FOUND);
  }

  // Delegar al guard de paciente
  return validatePatientAccess(appointment.patientId);
}
