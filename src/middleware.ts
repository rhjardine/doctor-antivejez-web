// src/middleware.ts

// ===== INICIO DE LA MODIFICACIÓN =====
// Se reemplaza el middleware manual por el helper `withAuth` de NextAuth.
// Este es el método recomendado y más seguro para proteger rutas,
// ya que está diseñado para no interferir con los archivos estáticos de Next.js.
import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login",
  },
});
// ===== FIN DE LA MODIFICACIÓN =====

export const config = { 
  // Se especifican únicamente las rutas que se quieren proteger.
  // Cualquier otra ruta (como las de imágenes o archivos de JS) será ignorada.
  matcher: [
    "/dashboard/:path*",
    "/historias/:path*",
    "/profesionales/:path*",
    "/agente-ia/:path*",
    "/edad-biologica/:path*",
    "/reportes/:path*",
    "/ajustes/:path*",
  ],
};
