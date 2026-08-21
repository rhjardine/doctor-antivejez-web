import { NextResponse } from "next/server";
import {
    signMobileAccessToken,
    signMobileRefreshToken,
    verifyMobileRefreshToken,
} from "@/lib/jwt";
import { db } from "@/lib/db";
import { getCorsHeaders, handleCorsPreflightOrReject } from "@/lib/cors";

// Responder al preflight CORS (interceptor PWA envía OPTIONS antes del POST)
export async function OPTIONS(req: Request) {
    return handleCorsPreflightOrReject(req, "POST, OPTIONS");
}

/**
 * POST /api/auth/refresh
 * Renueva la sesión del paciente a partir de un refresh token válido.
 * Lo invoca el interceptor 401 de apiClient.ts en la PWA.
 *
 * ═══ S5 — CONTRATO DE ROTACIÓN (dueño: ESTE ENDPOINT) ═══
 *
 * La PWA ya ejecuta `localStorage.setItem('refresh_token', data.refreshToken)`
 * tras cada refresco, pero este endpoint solo devolvía `accessToken`. El
 * resultado era que la PWA guardaba `undefined`, y el siguiente 401 encontraba
 * un refresh token corrupto, fallaba y expulsaba al paciente con
 * `localStorage.clear()`. En la práctica: cierre de sesión cada 15 minutos.
 *
 * Se resuelve del lado del servidor —el endpoint pasa a emitir también un
 * refreshToken rotado— porque así el código de la PWA funciona tal cual está,
 * sin necesidad de desplegarla. Es además la práctica correcta: rotar el
 * refresh token en cada uso limita la ventana de un token robado.
 *
 * Contrato estable: `{ accessToken, refreshToken }`.
 *
 * ═══ S5 — VALIDACIÓN CONTRA BASE DE DATOS ═══
 *
 * Antes se re-firmaba a ciegas: bastaba un refresh token de 7 días para seguir
 * operando aunque el paciente hubiera sido eliminado. Y el nuevo access token
 * se emitía sin `tenantId`, degradando el aislamiento multi-tenant en cada
 * renovación. Ahora se consulta el paciente y se rechaza si no existe o está
 * borrado.
 */
export async function POST(req: Request) {
    const corsHeaders = getCorsHeaders(req, "POST, OPTIONS");

    try {
        const body = await req.json();
        const { refreshToken } = body;

        if (!refreshToken) {
            return NextResponse.json(
                { error: "Token requerido" },
                { status: 401, headers: corsHeaders }
            );
        }

        // Verificar el refresh token — lanza si expiró o el tipo es incorrecto
        const payload = await verifyMobileRefreshToken(refreshToken);

        // ─── Validación contra BD: existencia y estado ──────────────────────
        const patient = await db.patient.findUnique({
            where: { id: payload.sub },
            select: { id: true, tenantId: true, deletedAt: true },
        });

        if (!patient || patient.deletedAt !== null) {
            console.warn(
                `[SECURITY] Refresh rechazado para paciente inexistente o eliminado: ${payload.sub}`
            );
            return NextResponse.json(
                { error: "Sesión no válida" },
                { status: 401, headers: corsHeaders }
            );
        }
        // ────────────────────────────────────────────────────────────────────

        const [accessToken, rotatedRefreshToken] = await Promise.all([
            signMobileAccessToken({
                id: patient.id,
                role: "PATIENT",
                tenantId: patient.tenantId,
            }),
            signMobileRefreshToken({ id: patient.id }),
        ]);

        return NextResponse.json(
            { accessToken, refreshToken: rotatedRefreshToken },
            { headers: corsHeaders }
        );

    } catch {
        return NextResponse.json(
            { error: "Token expirado o inválido" },
            { status: 401, headers: corsHeaders }
        );
    }
}
