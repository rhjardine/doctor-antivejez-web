import { withAuth } from "next-auth/middleware";
export default withAuth({
    callbacks: {
        authorized: ({ token, req }) => {
            if (req.nextUrl.pathname.startsWith("/mobile-")) return true;
            if (req.nextUrl.pathname.startsWith("/vcoach-")) return true;
            if (req.nextUrl.pathname.startsWith("/clinical-nlr-v1")) return true;
            return !!token;
        }
    }
});
export const config = { matcher: ["/dashboard/:path*", "/historias/:path*", "/mobile-auth-v1", "/mobile-profile-v1", "/vcoach-chat-v1", "/clinical-nlr-v1"] };
