export { default } from "next-auth/middleware";

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/historias/:path*",
        "/profesionales/:path*",
        "/ajustes/:path*",
        "/edad-biologica/:path*"
    ]
};
