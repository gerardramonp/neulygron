import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  registerLimiter,
  authLimiter,
  classifyLimiter,
  apiLimiter,
  type RateLimiter,
} from "@/lib/rate-limit";

function getClientIp(request: NextRequest): string {
  // Try various headers that might contain the real IP
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list, take the first one
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback for local development
  return "127.0.0.1";
}

function selectLimiter(pathname: string): RateLimiter {
  // Registration endpoint - strictest limits
  if (pathname === "/api/auth/register") {
    return registerLimiter;
  }

  // NextAuth endpoints (login, OAuth callbacks)
  if (pathname.startsWith("/api/auth/")) {
    return authLimiter;
  }

  // AI classification endpoint - expensive operations
  if (pathname === "/api/expenses/classify") {
    return classifyLimiter;
  }

  // All other API endpoints
  return apiLimiter;
}

export async function middleware(request: NextRequest) {
  // Skip rate limiting if disabled (for testing/development)
  if (process.env.RATE_LIMIT_DISABLED === "true") {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;

  // Only rate limit API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const clientIp = getClientIp(request);
  const limiter = selectLimiter(pathname);

  try {
    await limiter.consume(clientIp);
    return NextResponse.next();
  } catch {
    // Rate limit exceeded
    return NextResponse.json(
      {
        message: "Too many requests. Please try again later.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
        },
      },
    );
  }
}

export const config = {
  matcher: "/api/:path*",
};
