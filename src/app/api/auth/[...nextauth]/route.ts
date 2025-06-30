// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth'; // <--- IMPORTA authOptions desde el nuevo archivo

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };