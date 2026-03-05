import { NextResponse } from "next/server";
import { signMobileAccessToken, verifyMobileRefreshToken } from "@/lib/jwt";

/**
 * POST /api/auth/refresh
 * Renueva el access token del paciente usando un refresh token válido.
 * Llamado automáticamente por el interceptor 401 de apiClient.ts en la PWA.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { refreshToken } = body;

        if (!refreshToken) {
            return NextResponse.json(
                { error: "Token requerido" },
                { status: 401 }
            );
        }

        // Verificar el refresh token — lanza error si expiró o tipo incorrecto
        const payload = await verifyMobileRefreshToken(refreshToken);

        // Emitir nuevo access token (15 min)
        const newAccessToken = await signMobileAccessToken({
            id: payload.sub,
            role: "PATIENT",
        });

        // ✅ apiClient.ts:46 lee `data.accessToken` — usar ese nombre exacto
        return NextResponse.json({ accessToken: newAccessToken });

    } catch {
        return NextResponse.json(
            { error: "Token expirado o inválido" },
            { status: 401 }
        );
    }
}
