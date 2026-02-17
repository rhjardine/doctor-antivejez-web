/**
 * Centralized CORS Utility — Security Hardened
 * 
 * Single source of truth for CORS configuration across all API routes.
 * Rejects any origin not in the allowed list with 403 Forbidden.
 */
import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
    "https://doctorantivejez-patients.onrender.com",
    // Add additional trusted origins via env var
    ...(process.env.ADDITIONAL_CORS_ORIGINS?.split(",").filter(Boolean) || []),
];

/**
 * Returns CORS headers for a given request.
 * Only allows whitelisted origins.
 */
export function getCorsHeaders(req: Request, methods: string = "POST, OPTIONS") {
    const origin = req.headers.get("origin") || "";
    const isAllowed = ALLOWED_ORIGINS.includes(origin);

    return {
        "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
        "Access-Control-Allow-Methods": methods,
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
    };
}

/**
 * Validates the request origin. Returns a 403 response if not allowed.
 * Use this in OPTIONS handlers to reject unauthorized preflights.
 */
export function handleCorsPreflightOrReject(req: Request, methods: string = "POST, OPTIONS"): NextResponse {
    const origin = req.headers.get("origin") || "";
    const isAllowed = ALLOWED_ORIGINS.includes(origin);

    if (!isAllowed) {
        return new NextResponse("Forbidden: Origin not allowed", {
            status: 403,
            headers: { "Content-Type": "text/plain" },
        });
    }

    return NextResponse.json({}, {
        headers: getCorsHeaders(req, methods),
    });
}

/**
 * Checks if the request origin is allowed. Returns null if OK, or a 403 response if not.
 * Use at the top of POST/GET handlers for origin enforcement.
 */
export function enforceOrigin(req: Request, methods: string = "POST, OPTIONS"): NextResponse | null {
    const origin = req.headers.get("origin") || "";
    // Allow requests without origin header (server-to-server, curl, etc.)
    if (!origin) return null;

    const isAllowed = ALLOWED_ORIGINS.includes(origin);
    if (!isAllowed) {
        return new NextResponse(JSON.stringify({ error: "Forbidden: Origin not allowed" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
        });
    }
    return null;
}
