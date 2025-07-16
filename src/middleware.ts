// src/middleware.ts

// Se importa directamente el middleware por defecto de next-auth.
// Esta es la forma más simple y recomendada.
export { default } from "next-auth/middleware"

// Se define explícitamente qué rutas deben estar protegidas por la autenticación.
// Cualquier ruta que NO esté en esta lista (como /_next/static, /images, etc.)
// será completamente ignorada por el middleware, solucionando los errores 404.
export const config = { 
  matcher: [
    "/dashboard",
    "/historias",
    "/historias/:path*", // Protege tanto /historias como /historias/nuevo, /historias/123, etc.
    "/profesionales",
    "/agente-ia",
    "/edad-biologica",
    "/reportes",
    "/ajustes"
  ] 
}
