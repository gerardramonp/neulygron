import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { env } from "@/lib/env";
import { pathRequiresAuthentication } from "@/lib/auth/route-guard";
import {
  registerLimiter,
  authLimiter,
  classifyLimiter,
  apiLimiter,
  type RateLimiter,
} from "@/lib/rate-limit";

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "127.0.0.1";
}

function selectLimiter(pathname: string): RateLimiter {
  if (pathname === "/api/auth/register") {
    return registerLimiter;
  }

  if (pathname.startsWith("/api/auth/")) {
    return authLimiter;
  }

  if (pathname === "/api/expenses/classify") {
    return classifyLimiter;
  }

  return apiLimiter;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/")) {
    if (process.env.RATE_LIMIT_DISABLED === "true") {
      return NextResponse.next();
    }

    const clientIp = getClientIp(request);
    const limiter = selectLimiter(pathname);

    try {
      await limiter.consume(clientIp);
    } catch {
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

    return NextResponse.next();
  }

  if (pathRequiresAuthentication(pathname)) {
    const token = await getToken({
      req: request,
      secret: env.AUTH_SECRET,
    });

    if (!token) {
      const login = new URL("/login", request.url);
      login.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
}

// Keep in sync with `AUTH_REQUIRED_PATH_PREFIXES` in `lib/auth/route-guard.ts`.
export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/config",
    "/config/:path*",
    "/reports",
    "/reports/:path*",
  ],
};
