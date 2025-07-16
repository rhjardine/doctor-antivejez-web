// src/middleware.ts
import { withAuth } from "next-auth/middleware"
import { NextResponse } from 'next/server'

export default withAuth(
  // `withAuth` aumentará la solicitud con el token del usuario.
  function middleware(req) {
    // Puedes añadir lógica adicional aquí si es necesario,
    // por ejemplo, redirecciones basadas en el rol del usuario.
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
    pages: {
      signIn: "/login",
    },
  }
)

// ===== INICIO DE LA MODIFICACIÓN =====
// Este es el cambio más importante. Usamos una expresión regular para
// decirle al middleware que ignore todas las rutas que son para archivos
// estáticos o para la API. De esta forma, solo protegerá las páginas reales
// de la aplicación y no causará los errores 404.
export const config = { 
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (our public images folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
}
// ===== FIN DE LA MODIFICACIÓN =====
