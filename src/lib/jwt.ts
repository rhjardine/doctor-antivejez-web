import { jwtVerify, SignJWT } from 'jose';

export async function signToken(payload: any) {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d')
        .sign(secret);
}

export async function verifyToken(token: string | undefined) {
    if (!token) return null;

    try {
        const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload as any;
    } catch (error) {
        console.error('JWT Verification Error:', error);
        return null;
    }
}

// ─── Mobile Dual-Token (access + refresh) ────────────────────────────────────
// Secretos separados de NEXTAUTH_SECRET para aislar sesiones de pacientes
// de las sesiones de médicos. Si las env vars no están definidas, se usa
// NEXTAUTH_SECRET como fallback para evitar que el backend falle en arranque.

const getMobileAccessSecret = () =>
    new TextEncoder().encode(process.env.MOBILE_JWT_SECRET || process.env.NEXTAUTH_SECRET);

const getMobileRefreshSecret = () =>
    new TextEncoder().encode(process.env.MOBILE_REFRESH_SECRET || process.env.NEXTAUTH_SECRET);

/** Access token para la PWA — corta duración (15 min) */
export async function signMobileAccessToken(payload: { id: string; role: string }) {
    return new SignJWT({ sub: payload.id, role: payload.role, type: 'access' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('15m')
        .sign(getMobileAccessSecret());
}

/** Refresh token para la PWA — larga duración (7 días) */
export async function signMobileRefreshToken(payload: { id: string }) {
    return new SignJWT({ sub: payload.id, type: 'refresh' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(getMobileRefreshSecret());
}

/** Verifica un refresh token móvil y retorna el payload */
export async function verifyMobileRefreshToken(token: string) {
    const { payload } = await jwtVerify(token, getMobileRefreshSecret());
    if (payload.type !== 'refresh') {
        throw new Error('Tipo de token incorrecto');
    }
    return payload as { sub: string; type: string };
}

/** Verifica un access token de la PWA — usa MOBILE_JWT_SECRET (NO NEXTAUTH_SECRET) */
export async function verifyMobileAccessToken(token: string | undefined) {
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, getMobileAccessSecret());
        if (payload.type !== 'access') return null;
        return payload as { sub: string; role: string; type: string };
    } catch (error) {
        console.error('JWT Verification Error:', error);
        return null;
    }
}
