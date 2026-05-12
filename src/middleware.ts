import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { resolvePermissions, ModuleKey } from "./lib/permissions";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) return NextResponse.next();

    const permissions = resolvePermissions(token.role, token.permissions);

    // Map paths to ModuleKeys
    const routeConfig: { prefix: string; module: ModuleKey }[] = [
      { prefix: "/historias", module: "historias" },
      { prefix: "/profesionales", module: "profesionales" },
      { prefix: "/agente-ia", module: "agente_ia" },
      { prefix: "/reportes", module: "reportes" },
      { prefix: "/ajustes", module: "ajustes" },
      { prefix: "/edad-biologica", module: "edad_biologica" },
      { prefix: "/campanas", module: "campanas" },
    ];

    for (const route of routeConfig) {
      if (path.startsWith(route.prefix)) {
        if (!permissions[route.module]) {
          console.warn(`[Middleware] Acceso denegado a ${path} para usuario ${token.id} (${token.role})`);
          return NextResponse.redirect(new URL("/dashboard?blocked=true", req.url));
        }
        break; // matched and authorized
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/historias/:path*",
    "/profesionales/:path*",
    "/agente-ia/:path*",
    "/reportes/:path*",
    "/ajustes/:path*",
    "/edad-biologica/:path*",
    "/campanas/:path*"
  ]
};
