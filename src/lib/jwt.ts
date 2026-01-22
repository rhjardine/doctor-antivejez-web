import { SignJWT, jwtVerify } from 'jose';

const secretString = process.env.NEXTAUTH_SECRET || 'development-secret-key-min-32-chars-long';
if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('NEXTAUTH_SECRET is not defined in production environment');
}
const secret = new TextEncoder().encode(secretString);

export const signToken = async (payload: any) => {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d') // Token válido por 30 días para mobile
        .sign(secret);
};

export const verifyToken = async (token: string) => {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload as { id: string; role: string };
    } catch (error) {
        return null;
    }
};
