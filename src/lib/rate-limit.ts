/**
 * Rate Limiter — Upstash Redis
 * 
 * Provides per-IP rate limiting for API routes to prevent brute-force attacks.
 * Falls through gracefully if Redis is not configured (development mode).
 * 
 * Required env vars on Render:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

let ratelimit: Ratelimit | null = null;

// Only initialize if Redis env vars are present
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    ratelimit = new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds
        analytics: true,
        prefix: "ratelimit:api",
    });
}

/**
 * Check rate limit for a given request.
 * Returns a 429 response if limit exceeded, or null if request is allowed.
 * Falls through silently if Redis is not configured.
 */
export async function checkRateLimit(
    req: Request,
    identifier?: string
): Promise<NextResponse | null> {
    if (!ratelimit) {
        // Redis not configured — pass through (development or unset)
        return null;
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = identifier || forwarded?.split(",")[0]?.trim() || "anonymous";

    try {
        const { success, limit, remaining, reset } = await ratelimit.limit(ip);

        if (!success) {
            return new NextResponse(
                JSON.stringify({
                    error: "Too Many Requests",
                    retryAfter: Math.ceil((reset - Date.now()) / 1000),
                }),
                {
                    status: 429,
                    headers: {
                        "Content-Type": "application/json",
                        "X-RateLimit-Limit": limit.toString(),
                        "X-RateLimit-Remaining": remaining.toString(),
                        "X-RateLimit-Reset": reset.toString(),
                        "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
                    },
                }
            );
        }
    } catch (error) {
        // Redis connection error — fail open (don't block requests)
        console.error("[RateLimit] Redis error, passing through:", (error as Error).message);
    }

    return null;
}
