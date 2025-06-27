// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// import { getToken } from 'next-auth/jwt'; // Comentar esta línea

export async function middleware(req: NextRequest) {
  // const secret = process.env.NEXTAUTH_SECRET; // Comentar esta línea

  // if (!secret) {
  //   console.error('Error: La variable de entorno NEXTAUTH_SECRET no está definida.');
  //   return NextResponse.next();
  // }

  // const token = await getToken({ req, secret }); // Comentar esta línea

  // const { pathname } = req.nextUrl; // Comentar esta línea

  // // Si el usuario no está autenticado (no hay token) E intenta acceder a una ruta protegida
  // if (!token && pathname.startsWith('/dashboard')) {
  //   const loginUrl = new URL('/login', req.url);
  //   loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
  //   return NextResponse.redirect(loginUrl);
  // }

  // // Si el usuario está autenticado (hay token) E intenta acceder a la página de login o registro
  // if (token && (pathname === '/login' || pathname === '/register')) {
  //   return NextResponse.redirect(new URL('/dashboard', req.url));
  // }

  // Permite que la solicitud continúe siempre (temporalmente)
  return NextResponse.next();
}

// Configuración del Matcher: Especifica qué rutas serán interceptadas por el middleware.
export const config = {
  matcher: [
    // El matcher sigue siendo importante para que Next.js sepa que existe un middleware,
    // aunque su lógica interna esté deshabilitada temporalmente.
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};