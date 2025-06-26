// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret) {
    console.error('Error: La variable de entorno NEXTAUTH_SECRET no está definida.');
    // En un entorno de producción, podrías redirigir a una página de error.
    // Por ahora, permitimos el acceso en desarrollo si no hay secret, pero con una advertencia.
    return NextResponse.next();
  }

  const token = await getToken({ req, secret });

  const { pathname } = req.nextUrl;

  // Si el usuario no está autenticado (no hay token) E intenta acceder a una ruta protegida
  if (!token && pathname.startsWith('/dashboard')) {
    // Redirige a la página de login
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname); // Opcional: para redirigir de vuelta después del login
    return NextResponse.redirect(loginUrl);
  }

  // Si el usuario está autenticado (hay token) E intenta acceder a la página de login o registro
  if (token && (pathname === '/login' || pathname === '/register')) {
    // Redirige al dashboard
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Si no se cumple ninguna de las condiciones anteriores, permite que la solicitud continúe.
  return NextResponse.next();
}

// Configuración del Matcher: Especifica qué rutas serán interceptadas por el middleware.
export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas de solicitud excepto las que comienzan con:
     * - api (rutas de API)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (archivo de favicon)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};