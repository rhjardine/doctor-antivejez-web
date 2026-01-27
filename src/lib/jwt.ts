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
