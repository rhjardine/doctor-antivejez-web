// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;

  // Si no hay secret configurado en el entorno, no se puede validar.
  // Es importante que esta variable esté en Render.
  if (!secret) {
    console.error('Error: La variable de entorno NEXTAUTH_SECRET no está definida.');
    return NextResponse.next();
  }

  const token = await getToken({ req, secret });
  const { pathname } = req.nextUrl;

  // Lista de rutas que son públicas y no requieren autenticación
  const publicPaths = ['/login', '/register'];

  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Si el usuario no está autenticado (no hay token) Y la ruta no es pública
  if (!token && !isPublicPath) {
    // Redirige a la página de login
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si el usuario está autenticado Y está intentando acceder a una ruta pública
  if (token && isPublicPath) {
    // Redirige al dashboard
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

// Configuración del Matcher: Rutas que serán interceptadas por el middleware.
export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas excepto las que son para archivos estáticos,
     * imágenes o llamadas a la API de Next.js.
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};