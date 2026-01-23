import { NextResponse } from "next/server";
export function middleware(request: any) {
    const { pathname } = request.nextUrl;
    if (pathname.startsWith('/mobile-auth-v1') || pathname.startsWith('/mobile-profile-v1')) {
        return NextResponse.next();
    }
    return NextResponse.next();
}
export const config = { matcher: [] };
