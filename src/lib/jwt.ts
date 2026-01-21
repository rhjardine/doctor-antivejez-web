import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

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
